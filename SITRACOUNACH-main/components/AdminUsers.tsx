
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserRole, EmploymentStatus, UserGroup } from '../types';
import { fetchAffiliatesFromAirtable, updateAffiliateInAirtable, fetchGroupsFromAirtable, createAffiliateInAirtable } from '../services/airtableService';

interface AdminUsersProps {
  currentUser: UserProfile;
}

type SubTab = 'summary' | 'keyword' | 'advanced';

const AdminUsers: React.FC<AdminUsersProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('summary');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  
  // Estados para nuevo usuario
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState<Partial<UserProfile>>({
    fullName: '',
    employeeId: '',
    email_unach: '',
    nickname: '',
    status: EmploymentStatus.ACTIVO,
    role: UserRole.AFILIADO,
    dependencia: '',
    rfc: '',
    curp: '',
    puesto: '',
    nivel: '',
    direccion: '',
    phone: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDependencia, setFilterDependencia] = useState<string>('');
  const [loginRange, setLoginRange] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, groupData] = await Promise.all([
        fetchAffiliatesFromAirtable(),
        fetchGroupsFromAirtable()
      ]);
      setUsers(userData);
      setGroups(groupData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resolveGroupNames = (gruposRaw: string | undefined): string => {
    if (!gruposRaw) return 'Ninguno';
    const rawValue = String(gruposRaw);
    if (!rawValue.includes('rec')) return rawValue;
    const ids = rawValue.split(',').map(id => id.trim());
    const names = ids.map(id => {
      const group = groups.find(g => g.id === id);
      return group ? group.name : id;
    });
    return names.join(', ');
  };

  const filteredUsers = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return users.filter(u => {
      const matchSearch = !searchTerm || 
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.employeeId?.includes(searchTerm) ||
        u.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRole = filterRole === 'all' || u.role === filterRole;
      const matchStatus = filterStatus === 'all' || u.status === filterStatus;
      const matchDep = !filterDependencia || u.dependencia?.toLowerCase().includes(filterDependencia.toLowerCase());
      
      let matchLogin = true;
      const lastLoginDate = u.last_login || u.last_active ? new Date(u.last_login || u.last_active!) : null;
      if (loginRange === 'week' && lastLoginDate) matchLogin = lastLoginDate >= oneWeekAgo;
      else if (loginRange === 'month' && lastLoginDate) matchLogin = lastLoginDate >= oneMonthAgo;

      return matchSearch && matchRole && matchStatus && matchDep && matchLogin;
    });
  }, [users, searchTerm, filterRole, filterStatus, filterDependencia, loginRange]);

  const handleUpdateField = async (id: string, field: keyof UserProfile, value: any) => {
    setSaveStatus('saving');
    const success = await updateAffiliateInAirtable(id, { [field]: value });
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
      loadData();
    } else {
      setSaveStatus('idle');
      alert("Error al sincronizar con Airtable.");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.employeeId) return alert("Nombre y Plaza son obligatorios.");
    
    setIsCreating(true);
    try {
      const success = await createAffiliateInAirtable(newUser);
      if (success) {
        alert("✅ Agremiado registrado exitosamente.");
        setShowAddModal(false);
        setNewUser({
          fullName: '', employeeId: '', email_unach: '', nickname: '',
          status: EmploymentStatus.ACTIVO, role: UserRole.AFILIADO,
          dependencia: '', rfc: '', curp: '', puesto: '', nivel: '',
          direccion: '', phone: ''
        });
        loadData();
      } else {
        alert("Error al crear el registro en Airtable.");
      }
    } catch (err) {
      alert("Error de conexión.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-4xl font-black text-indigo-900 tracking-tighter">Gestión de Afiliados</h2>
          <p className="text-slate-500 font-medium italic">Control centralizado y filtros de conexión activa</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl hover:bg-emerald-700 transition-all cursor-pointer"
            title="Agregar nuevo afiliado"
          >
            <i className="fas fa-plus text-xl"></i>
          </button>
          <button onClick={loadData} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 uppercase tracking-widest cursor-pointer">
            <i className="fas fa-sync-alt"></i> Sincronizar Base
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LISTADO PRINCIPAL */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-1 mb-0 z-10 px-1 overflow-x-auto no-scrollbar">
            {['summary', 'keyword', 'advanced'].map(t => (
              <button 
                key={t} 
                onClick={() => setActiveSubTab(t as any)} 
                className={`px-7 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-[1.5rem] border-x border-t cursor-pointer ${activeSubTab === t ? 'bg-white text-indigo-700 border-slate-200 shadow-sm' : 'bg-slate-100 text-slate-400 border-transparent'}`}
              >
                {t === 'summary' ? 'RESUMEN' : t === 'keyword' ? 'PALABRA CLAVE' : 'AVANZADO'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-tr-[2.5rem] rounded-b-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/30">
               {activeSubTab === 'advanced' && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Rol Sindical</label>
                       <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="all">Todos los roles</option>
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Estatus Laboral</label>
                       <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="all">Cualquier estatus</option>
                          {Object.values(EmploymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Última Conexión</label>
                       <select value={loginRange} onChange={e => setLoginRange(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="all">Cualquier fecha</option>
                          <option value="week">Esta semana</option>
                          <option value="month">Este mes</option>
                       </select>
                    </div>
                 </div>
               )}
               {activeSubTab === 'keyword' && (
                 <div className="relative animate-fadeIn">
                    <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400 text-xl"></i>
                    <input 
                      type="text" 
                      placeholder="Buscar por Nombre, Plaza o RFC..." 
                      className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-700 shadow-inner focus:border-indigo-500 outline-none transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
               )}
               {activeSubTab === 'summary' && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando {filteredUsers.length} registros totales</p>}
            </div>

            <div className="p-8 overflow-x-auto min-h-[500px]">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-slate-400">
                    <th className="pb-2 text-[10px] font-black uppercase tracking-widest px-8">Agremiado / Plaza</th>
                    <th className="pb-2 text-[10px] font-black uppercase tracking-widest px-8">Situación</th>
                    <th className="pb-2 text-[10px] font-black uppercase tracking-widest px-8 text-right">RFC / Correo</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="py-20 text-center font-black text-slate-300 animate-pulse tracking-widest uppercase">Consultando Airtable...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={3} className="py-20 text-center text-slate-400 italic">No se encontraron afiliados</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} onClick={() => setSelectedUser(u)} className={`cursor-pointer transition-all ${selectedUser?.id === u.id ? 'bg-indigo-900 text-white shadow-2xl scale-[1.01] ring-4 ring-indigo-500/10' : 'bg-slate-50 hover:bg-white border border-slate-100 shadow-sm'}`}>
                      <td className="py-6 px-8 rounded-l-[2rem]">
                         <div className="flex items-center gap-4">
                            <img src={u.fotoUrl || `https://i.pravatar.cc/50?u=${u.id}`} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" alt={u.fullName} />
                            <div>
                               <p className="font-black text-sm leading-tight">{u.fullName}</p>
                               <p className="text-[9px] font-bold uppercase mt-1 opacity-60">PLAZA: {u.employeeId || 'NO REGISTRADA'}</p>
                            </div>
                         </div>
                      </td>
                      <td className="py-6 px-8 font-black text-[9px] uppercase tracking-widest">
                         <span className={`px-3 py-1 rounded-full ${u.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{u.status}</span>
                      </td>
                      <td className="py-6 px-8 rounded-r-[2rem] text-right">
                         <p className="text-[10px] font-black tracking-tight">{u.rfc || 'SIN RFC'}</p>
                         <p className="text-[9px] opacity-60 italic truncate max-w-[150px]">{u.email_unach}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* EDITOR DERECHO */}
        <div className="lg:col-span-4 sticky top-8">
           {selectedUser ? (
             <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn flex flex-col h-fit">
               <div className="bg-indigo-900 p-8 text-center text-white relative">
                  <img src={selectedUser.fotoUrl || "https://i.pravatar.cc/200?u=" + selectedUser.id} className="w-32 h-32 rounded-[2rem] mx-auto mb-4 border-4 border-white/10 object-cover shadow-xl" alt="Preview" />
                  <h3 className="text-xl font-black leading-tight tracking-tight">{selectedUser.fullName}</h3>
                  <p className="text-[10px] text-indigo-300 font-black uppercase mt-2 tracking-widest">{selectedUser.role}</p>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center mb-2">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expediente Oficial</h4>
                     {saveStatus === 'saving' && <span className="text-[8px] font-black text-indigo-600 animate-pulse uppercase">Sincronizando...</span>}
                  </div>

                  <DetailField label="Número de Plaza (DB)" value={selectedUser.employeeId} onSave={v => handleUpdateField(selectedUser.id, 'employeeId', v)} />
                  <DetailField label="RFC Oficial" value={selectedUser.rfc || ''} onSave={v => handleUpdateField(selectedUser.id, 'rfc', v)} />
                  <DetailField label="Correo Institucional" value={selectedUser.email_unach || ''} onSave={v => handleUpdateField(selectedUser.id, 'email_unach', v)} />
                  <DetailField label="Domicilio Particular" value={selectedUser.direccion || ''} onSave={v => handleUpdateField(selectedUser.id, 'direccion', v)} />
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button onClick={() => setSelectedUser(null)} className="w-full py-4 bg-slate-100 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest border border-slate-200 cursor-pointer">Cerrar</button>
                    <button onClick={() => window.print()} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 cursor-pointer">Imprimir</button>
                  </div>
               </div>
             </div>
           ) : (
             <div className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center text-slate-300 flex flex-col items-center justify-center min-h-[500px]">
                <i className="fas fa-id-card text-5xl mb-6 opacity-10"></i>
                <p className="text-[10px] font-black uppercase tracking-widest px-10 leading-relaxed">Selecciona un afiliado para visualizar su información vinculada</p>
             </div>
           )}
        </div>
      </div>

      {/* MODAL PARA AGREGAR AFILIADO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh] border border-white/20">
            <div className="bg-indigo-900 p-8 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                     <i className="fas fa-user-plus text-2xl text-indigo-300"></i>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Nuevo Expediente Sindical</h3>
               </div>
               <button onClick={() => setShowAddModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all cursor-pointer">
                  <i className="fas fa-times text-xl"></i>
               </button>
            </div>
            
            <form onSubmit={handleAddUser} className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">Información de Identidad</h4>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo *</label>
                        <input type="text" required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="JUAN PEREZ LOPEZ" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">RFC</label>
                          <input type="text" value={newUser.rfc} onChange={e => setNewUser({...newUser, rfc: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" placeholder="ABCD800101XYZ" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CURP</label>
                          <input type="text" value={newUser.curp} onChange={e => setNewUser({...newUser, curp: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" placeholder="ABCD800101..." />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Domicilio Particular</label>
                        <input type="text" value={newUser.direccion} onChange={e => setNewUser({...newUser, direccion: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="Calle Central #123, Tuxtla Gtz." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
                        <input type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="961 123 4567" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">Información Laboral y Sistema</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest ml-1">No. de Plaza *</label>
                          <input type="text" required value={newUser.employeeId} onChange={e => setNewUser({...newUser, employeeId: e.target.value})} className="w-full px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-black text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="3452" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nivel Salarial</label>
                          <input type="text" value={newUser.nivel} onChange={e => setNewUser({...newUser, nivel: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="10A" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dependencia / Adscripción</label>
                        <input type="text" value={newUser.dependencia} onChange={e => setNewUser({...newUser, dependencia: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="FACULTAD DE INGENIERIA" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Puesto Nominal</label>
                        <input type="text" value={newUser.puesto} onChange={e => setNewUser({...newUser, puesto: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="Técnico de Confianza" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Institucional</label>
                        <input type="email" value={newUser.email_unach} onChange={e => setNewUser({...newUser, email_unach: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="ejemplo@unach.mx" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estatus Laboral</label>
                          <select value={newUser.status} onChange={e => setNewUser({...newUser, status: e.target.value as EmploymentStatus})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                            {Object.values(EmploymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol Sindical</label>
                          <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500">
                            {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nickname de Acceso</label>
                        <input type="text" value={newUser.nickname} onChange={e => setNewUser({...newUser, nickname: e.target.value})} className="w-full px-5 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm font-bold lowercase text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="jlopez" />
                        <p className="text-[8px] text-slate-400 italic mt-1 font-bold">Contraseña inicial segura: Sitra@2025!</p>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-8">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-white text-slate-500 font-black rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={isCreating} className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-[10px] cursor-pointer shadow-indigo-100 disabled:opacity-70">
                    {isCreating ? <i className="fas fa-circle-notch animate-spin text-lg"></i> : <i className="fas fa-save text-lg"></i>}
                    {isCreating ? 'Registrando Afiliado...' : 'Registrar y Sincronizar Afiliado'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailField = ({ label, value, onSave, readOnly }: any) => {
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);
  
  return (
    <div className="space-y-1.5 animate-fadeIn">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      {readOnly ? (
        <div className="w-full px-5 py-4 rounded-2xl text-[11px] font-black text-indigo-700 bg-indigo-50 border-2 border-indigo-100 shadow-sm">
          {val}
        </div>
      ) : (
        <input 
          type="text" 
          className={`w-full px-5 py-4 rounded-2xl text-[11px] font-black text-slate-800 outline-none border-2 transition-all shadow-sm ${!val ? 'bg-amber-50 border-amber-100 italic' : 'bg-slate-50 border-slate-100 focus:border-indigo-400 focus:bg-white'}`} 
          value={val} 
          placeholder={!val ? 'Dato no registrado...' : ''}
          onChange={e => setVal(e.target.value)} 
          onBlur={() => { if (val !== value) onSave(val); }} 
        />
      )}
    </div>
  );
};

export default AdminUsers;
