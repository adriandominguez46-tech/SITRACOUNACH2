
import React, { useState, useEffect, useMemo } from 'react';
import { KnowledgeBaseItem, UserProfile, UserRole } from '../types';
import { fetchAIKnowledgeBase, createOrUpdateAIKnowledge, deleteAIKnowledge } from '../services/airtableService';

const AdminAITraining: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [knowledge, setKnowledge] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<KnowledgeBaseItem> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAIKnowledgeBase();
    setKnowledge(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setEditingItem({
      titulo: '',
      contenido: '',
      referencia: '',
      categoria: 'General',
      fechaDocumento: new Date().toISOString().split('T')[0],
      activo: true
    });
    setShowModal(true);
  };

  const handleEdit = (item: KnowledgeBaseItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingItem?.titulo || !editingItem?.contenido) return alert("El título y contenido son obligatorios.");
    setIsSaving(true);
    const success = await createOrUpdateAIKnowledge(editingItem);
    if (success) {
      alert("Entrenamiento sincronizado con éxito.");
      setShowModal(false);
      loadData();
    } else {
      alert("Error al guardar en Airtable. Verifique que la tabla 'Entrenamiento_IA' exista.");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Desea eliminar este conocimiento? La IA dejará de usarlo como fuente.")) return;
    const success = await deleteAIKnowledge(id);
    if (success) loadData();
  };

  const filteredKnowledge = useMemo(() => {
    return knowledge.filter(k => 
      k.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      k.referencia.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [knowledge, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-indigo-950 text-amber-400 rounded-3xl flex items-center justify-center text-3xl shadow-2xl">
              <i className="fas fa-brain"></i>
           </div>
           <div>
              <h2 className="text-4xl font-black text-indigo-900 tracking-tighter uppercase">Centro de Entrenamiento IA</h2>
              <p className="text-slate-500 font-medium italic">Base de Conocimiento Oficial SITRACOUNACH</p>
           </div>
        </div>
        <div className="flex gap-4">
            <button onClick={loadData} className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
            </button>
            <button onClick={handleCreate} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-black transition-all flex items-center gap-2 uppercase tracking-widest">
                <i className="fas fa-plus-circle"></i> Nuevo Conocimiento
            </button>
        </div>
      </div>

      <div className="bg-indigo-900 p-8 rounded-[2.5rem] mb-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
         <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-2/3">
               <h4 className="text-xl font-black mb-2">Instrucciones de Entrenamiento</h4>
               <p className="text-indigo-200 text-xs leading-relaxed">
                  Para que el Asesor IA brinde información precisa, cargue aquí documentos oficiales del sindicato, circulares, estatutos y resoluciones de paritarias. 
                  La IA utilizará esta base como su **"Fuente de Verdad"** exclusiva. Mencione siempre los números de oficio para que el bot pueda citarlos.
               </p>
            </div>
            <div className="md:w-1/3 flex justify-center">
               <div className="px-6 py-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                  <p className="text-3xl font-black text-amber-400">{knowledge.length}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-100">Documentos Entrenados</p>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32"></div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
            <div className="relative flex-1">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="text" 
                  placeholder="Buscar en el conocimiento entrenado..." 
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs outline-none focus:border-indigo-500 shadow-inner"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento / Referencia</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Doc.</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estatus IA</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 uppercase animate-pulse">Consultando Red Neuronal...</td></tr>
              ) : filteredKnowledge.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest italic">No hay conocimiento oficial cargado</td></tr>
              ) : filteredKnowledge.map(k => (
                <tr key={k.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <p className="font-black text-indigo-950 text-sm leading-tight">{k.titulo}</p>
                    <p className="text-[9px] font-bold text-amber-600 uppercase mt-1">Ref: {k.referencia || 'Sin Referencia'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[9px] px-3 py-1 bg-slate-100 rounded-full font-black text-slate-500 uppercase">{k.categoria}</span>
                  </td>
                  <td className="px-8 py-6 text-[11px] font-bold text-slate-500">{k.fechaDocumento}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${k.activo ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {k.activo ? 'Aprendido' : 'Ignorado'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(k)} className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDelete(k.id)} className="w-9 h-9 rounded-xl bg-slate-100 text-rose-400 hover:bg-rose-600 hover:text-white transition-all"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDITOR CONOCIMIENTO */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[250] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-fadeIn">
              <div className="bg-indigo-950 p-10 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-amber-400 text-indigo-950 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                       <i className="fas fa-feather-pointed"></i>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight">Editor de Conocimiento Oficial</h3>
                       <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Entrenamiento avanzado para la defensa laboral</p>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all shadow-xl">
                    <i className="fas fa-times text-xl"></i>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Título del Documento / Ley / Estatuto</label>
                          <input 
                            type="text" 
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-500 transition-all"
                            value={editingItem.titulo}
                            onChange={e => setEditingItem({...editingItem, titulo: e.target.value})}
                            placeholder="Ej: Estatutos del SITRACOUNACH 2024"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Referencia / Oficio</label>
                             <input type="text" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-indigo-500" value={editingItem.referencia} onChange={e => setEditingItem({...editingItem, referencia: e.target.value})} placeholder="Ej: OF-ST-045/2024" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                             <select className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xs outline-none focus:border-indigo-500" value={editingItem.categoria} onChange={e => setEditingItem({...editingItem, categoria: e.target.value as any})}>
                                <option value="General">General</option>
                                <option value="Estatutos">Estatutos</option>
                                <option value="CCT">CCT (Contrato Colectivo)</option>
                                <option value="Oficio">Oficio / Circular</option>
                                <option value="Jurisprudencia">Jurisprudencia</option>
                             </select>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha del Documento</label>
                             <input type="date" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-xs" value={editingItem.fechaDocumento} onChange={e => setEditingItem({...editingItem, fechaDocumento: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Estatus</label>
                             <div className="flex items-center h-[52px]">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={editingItem.activo} onChange={e => setEditingItem({...editingItem, activo: e.target.checked})} />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                  <span className="ml-3 text-[10px] font-black uppercase text-slate-500">Habilitado para IA</span>
                                </label>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-6 flex flex-col">
                       <div className="space-y-2 flex-1 flex flex-col">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contenido / Texto Oficial</label>
                          <textarea 
                            className="flex-1 w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-medium text-sm outline-none focus:border-indigo-500 resize-none shadow-inner"
                            value={editingItem.contenido}
                            onChange={e => setEditingItem({...editingItem, contenido: e.target.value})}
                            placeholder="Copie y pegue aquí el texto oficial del documento, artículos o resoluciones..."
                          />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-200 flex gap-5 shrink-0">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-5 bg-white text-slate-400 font-black rounded-3xl border-2 border-slate-200 hover:bg-slate-100 transition-all text-[11px] uppercase tracking-widest">Descartar</button>
                 <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl hover:bg-black transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-3">
                    {isSaving ? <i className="fas fa-circle-notch animate-spin text-lg"></i> : <i className="fas fa-cloud-upload-alt text-lg"></i>}
                    {isSaving ? 'Sincronizando Base de Datos...' : 'Guardar y Entrenar IA'}
                 </button>
              </div>
           </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AdminAITraining;
