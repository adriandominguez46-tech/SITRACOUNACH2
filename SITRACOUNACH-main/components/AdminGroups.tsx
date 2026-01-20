
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserGroup, GroupType, UserRole } from '../types';
import { fetchGroupsFromAirtable, fetchAffiliatesFromAirtable, createOrUpdateGroup, deleteGroupFromAirtable, batchUpdateAffiliates } from '../services/airtableService';

interface AdminGroupsProps {
  currentUser: UserProfile;
}

const AdminGroups: React.FC<AdminGroupsProps> = ({ currentUser }) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [affiliates, setAffiliates] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingGroup, setEditingGroup] = useState<Partial<UserGroup> | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const canManage = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.EDITOR;

  const loadData = async () => {
    setLoading(true);
    try {
      const [gData, aData] = await Promise.all([
        fetchGroupsFromAirtable(),
        fetchAffiliatesFromAirtable()
      ]);
      setGroups(gData);
      setAffiliates(aData);
    } catch (e) {
      console.error("Error loading group data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingGroup({
      name: '',
      description: '',
      type: GroupType.PERMANENTE,
      memberIds: []
    });
    setSelectedMembers([]);
    setShowModal(true);
  };

  const handleEdit = (group: UserGroup) => {
    setEditingGroup(group);
    setSelectedMembers(group.memberIds);
    setShowModal(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!window.confirm("¿Está seguro de eliminar este grupo?")) return;
    const success = await deleteGroupFromAirtable(groupId);
    if (success) {
      alert("Grupo eliminado.");
      loadData();
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const handleSave = async () => {
    if (!editingGroup?.name) return alert("Por favor, asigne un nombre al grupo.");
    setIsSaving(true);
    
    try {
      const finalGroup = {
        ...editingGroup,
        memberIds: selectedMembers
      };

      const success = await createOrUpdateGroup(finalGroup);
      
      if (success) {
        // Sincronización en lote para actualizar el campo 'grupos' en los afiliados
        const updates = selectedMembers.map(id => {
          const user = affiliates.find(a => a.id === id);
          if (!user) return null;
          
          const currentGroups = user.grupos ? user.grupos.split(',').map(g => g.trim()) : [];
          if (!currentGroups.includes(finalGroup.name!)) {
            currentGroups.push(finalGroup.name!);
          }
          return { id, fields: { grupos: currentGroups.join(', ') } };
        }).filter(u => u !== null) as { id: string, fields: Partial<UserProfile> }[];

        if (updates.length > 0) {
          await batchUpdateAffiliates(updates);
        }

        alert("¡Grupo guardado y sincronizado!");
        setShowModal(false);
        await loadData();
      } else {
        alert("Error al guardar en Airtable. Verifique la tabla 'Grupos'.");
      }
    } catch (err) {
      console.error(err);
      alert("Error inesperado al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const availableAffiliates = useMemo(() => {
    return affiliates.filter(a => 
      !selectedMembers.includes(a.id) &&
      (a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
       a.employeeId.includes(searchTerm))
    );
  }, [affiliates, selectedMembers, searchTerm]);

  const membersList = useMemo(() => {
    return affiliates.filter(a => selectedMembers.includes(a.id));
  }, [affiliates, selectedMembers]);

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-black text-indigo-900 tracking-tight">Gestión de Grupos</h2>
          <p className="text-slate-500 font-medium italic">Organice agremiados en comisiones y grupos internos</p>
        </div>
        {canManage && (
          <button 
            onClick={handleCreateNew}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            <i className="fas fa-users-viewfinder"></i> Nuevo Grupo
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Grupo</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Miembros</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="p-20 text-center font-black text-slate-300 uppercase tracking-widest animate-pulse">Sincronizando grupos...</td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic text-xs uppercase tracking-widest">No hay grupos registrados</td></tr>
            ) : groups.map(group => (
              <tr key={group.id} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <p className="font-black text-indigo-900 text-sm mb-1">{group.name}</p>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${group.type === GroupType.PERMANENTE ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-700'}`}>
                    {group.type}
                  </span>
                </td>
                <td className="px-8 py-6 text-xs text-slate-500 max-w-xs truncate">
                  {group.description || 'Sin descripción'}
                </td>
                <td className="px-8 py-6 text-center">
                  <button onClick={() => handleEdit(group)} className="text-sm font-black text-indigo-600 underline">
                    {group.memberIds.length || '0'}
                  </button>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(group)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all">
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button onClick={() => handleDelete(group.id)} className="w-8 h-8 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL REDISEÑADO PARA VISIBILIDAD TOTAL */}
      {showModal && editingGroup && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] overflow-y-auto py-6 px-4 flex justify-center">
          <div className="bg-white rounded-[2rem] w-full max-w-6xl h-fit min-h-[600px] max-h-none shadow-2xl overflow-hidden flex flex-col my-auto border border-white/20 animate-fadeIn">
             
             {/* Header Super Compacto */}
             <div className="bg-indigo-900 p-5 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-users-gear text-sm text-indigo-200"></i>
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-tight">{editingGroup.id ? 'Editar Grupo' : 'Nuevo Grupo'}</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all">
                   <i className="fas fa-times text-sm"></i>
                </button>
             </div>

             {/* Inputs en una sola fila para ahorrar espacio vertical */}
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4 shrink-0 shadow-inner">
                <div className="flex-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                   <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
                    placeholder="Ej. Comision Vigilancia"
                    value={editingGroup.name}
                    onChange={e => setEditingGroup({...editingGroup, name: e.target.value})}
                   />
                </div>
                <div className="w-full md:w-40">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                   <select 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
                    value={editingGroup.type}
                    onChange={e => setEditingGroup({...editingGroup, type: e.target.value as GroupType})}
                   >
                     <option value={GroupType.PERMANENTE}>Permanente</option>
                     <option value={GroupType.TEMPORAL}>Temporal</option>
                   </select>
                </div>
                <div className="flex-[1.5]">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                   <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
                    placeholder="Propósito del grupo..."
                    value={editingGroup.description}
                    onChange={e => setEditingGroup({...editingGroup, description: e.target.value})}
                   />
                </div>
             </div>

             {/* Listas de Transferencia */}
             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
                {/* Seleccionados */}
                <div className="border-r border-slate-200 flex flex-col bg-slate-50/50 overflow-hidden">
                   <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
                      <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Participantes ({selectedMembers.length})</h4>
                      <p className="text-[7px] text-slate-400 font-bold uppercase italic">Haz clic para quitar</p>
                   </div>
                   <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-[400px] custom-scrollbar">
                      {membersList.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 p-10 opacity-40">
                           <i className="fas fa-user-plus text-2xl mb-2"></i>
                           <p className="text-[9px] font-black uppercase">Vacío</p>
                        </div>
                      ) : membersList.map(m => (
                        <div key={m.id} onClick={() => toggleMember(m.id)} className="p-2.5 bg-white border border-indigo-100 rounded-xl shadow-sm hover:bg-rose-50 hover:border-rose-300 cursor-pointer flex items-center justify-between group transition-all">
                           <div className="flex items-center gap-2">
                              <img src={m.fotoUrl || `https://i.pravatar.cc/50?u=${m.id}`} className="w-6 h-6 rounded-md object-cover" />
                              <div>
                                 <p className="text-[11px] font-black text-slate-800 leading-tight">{m.fullName}</p>
                                 <p className="text-[8px] text-slate-400 font-bold uppercase">ID: {m.employeeId}</p>
                              </div>
                           </div>
                           <i className="fas fa-times text-[10px] text-slate-200 group-hover:text-rose-500"></i>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Disponibles */}
                <div className="flex flex-col overflow-hidden">
                   <div className="p-3 bg-white border-b border-slate-100 shrink-0">
                      <div className="relative">
                         <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-[10px]"></i>
                         <input 
                          type="text" 
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Buscar..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                         />
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-[400px] custom-scrollbar">
                      {availableAffiliates.length === 0 ? (
                        <div className="p-6 text-center text-slate-300 text-[10px] font-black uppercase italic">Sin resultados</div>
                      ) : availableAffiliates.map(m => (
                        <div key={m.id} onClick={() => toggleMember(m.id)} className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer flex items-center justify-between group transition-all">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-indigo-900 text-white flex items-center justify-center font-black text-[9px] overflow-hidden">
                                 {m.fotoUrl ? <img src={m.fotoUrl} className="w-full h-full object-cover" /> : m.fullName.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-slate-800 leading-tight">{m.fullName}</p>
                                 <p className="text-[8px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{m.dependencia || m.area || 'UNACH'}</p>
                              </div>
                           </div>
                           <i className="fas fa-arrow-left text-[10px] text-slate-200 group-hover:text-emerald-500"></i>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Footer */}
             <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white text-slate-500 font-black rounded-xl border border-slate-200 hover:bg-slate-100 text-[10px] uppercase tracking-widest">
                   Cerrar
                </button>
                <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                  {isSaving ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
                  {isSaving ? 'Guardando...' : 'Guardar Grupo'}
                </button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AdminGroups;
