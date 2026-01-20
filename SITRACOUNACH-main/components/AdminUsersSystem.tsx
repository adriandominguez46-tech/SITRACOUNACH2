
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, EmploymentStatus } from '../types';
import { fetchAffiliatesFromAirtable, updateAffiliateInAirtable } from '../services/airtableService';

const AdminUsersSystem: React.FC = () => {
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([]);
  const [allAffiliates, setAllAffiliates] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [searchAffiliate, setSearchAffiliate] = useState('');
  const [newGestorProfile, setNewGestorProfile] = useState<UserProfile | null>(null);
  const [showSearchList, setShowSearchList] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.EDITOR);

  const loadData = async () => {
    setLoading(true);
    const users = await fetchAffiliatesFromAirtable();
    setAllAffiliates(users);
    setSystemUsers(users.filter(u => u.role === UserRole.EDITOR || u.role === UserRole.ADMIN));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000 * 45);
    return () => clearInterval(interval);
  }, []);

  const isUserOnline = (lastActive?: string) => {
    if (!lastActive) return false;
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diff = (now.getTime() - lastActiveDate.getTime()) / 1000 / 60;
    return diff < 5;
  };

  const togglePermission = (field: keyof UserProfile) => {
    if (!selectedUser) return;
    const newValue = !selectedUser[field];
    const update: any = { [field]: newValue };

    if (field === 'perm_all') {
      update.perm_status = newValue;
      update.perm_role = newValue;
      update.perm_photo = newValue;
      update.perm_treasury_view = newValue;
      update.perm_treasury_pay = newValue;
    }
    setSelectedUser({ ...selectedUser, ...update });
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    const success = await updateAffiliateInAirtable(selectedUser.id, selectedUser);
    if (success) {
      alert("Privilegios actualizados.");
      loadData();
    }
    setIsSaving(false);
  };

  const handleChangeRole = async (newRole: UserRole) => {
    if (!selectedUser) return;
    const confirmMsg = newRole === UserRole.AFILIADO 
      ? "¿Desea revocar los privilegios administrativos?" 
      : `¿Promover a ${newRole}?`;
      
    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    const success = await updateAffiliateInAirtable(selectedUser.id, { role: newRole });
    if (success) {
      alert(`Rol actualizado.`);
      if (newRole === UserRole.AFILIADO) setSelectedUser(null);
      loadData();
    }
    setIsSaving(false);
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGestorProfile) return;
    
    setIsSaving(true);
    const success = await updateAffiliateInAirtable(newGestorProfile.id, { role: selectedRole });
    if (success) {
      alert(`¡${newGestorProfile.fullName} ahora es ${selectedRole}!`);
      setShowAddModal(false);
      setNewGestorProfile(null);
      setSearchAffiliate('');
      loadData();
    }
    setIsSaving(false);
  };

  const filteredAffiliates = allAffiliates.filter(a => 
    (a.fullName.toLowerCase().includes(searchAffiliate.toLowerCase()) || 
    a.employeeId.includes(searchAffiliate)) &&
    a.role === UserRole.AFILIADO
  ).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight text-indigo-900">Gestión de Usuarios Sistema</h2>
          <p className="text-slate-500 font-medium italic">Administración de jerarquías del equipo administrativo</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 h-14 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest"
        >
          <i className="fas fa-plus-circle"></i> Nuevo Gestor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipo de Gestión</h3>
               <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{systemUsers.length} Activos</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-10 text-center font-bold text-slate-300 uppercase text-xs">Cargando...</div>
              ) : systemUsers.map(u => (
                <div 
                  key={u.id} 
                  className={`p-5 flex items-center justify-between hover:bg-indigo-50/50 cursor-pointer transition-all ${selectedUser?.id === u.id ? 'bg-indigo-50 border-r-4 border-indigo-600' : ''}`}
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black shadow-md ${u.role === UserRole.ADMIN ? 'bg-amber-500' : 'bg-indigo-900'}`}>
                        {u.fotoUrl ? <img src={u.fotoUrl} className="w-full h-full object-cover rounded-xl" /> : u.fullName.charAt(0)}
                      </div>
                      {isUserOnline(u.last_active) && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-md"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">{u.fullName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${u.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {u.role}
                        </span>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">PLAZA {u.employeeId}</p>
                      </div>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-slate-300 text-[10px]"></i>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          {selectedUser ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 space-y-8 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={selectedUser.fotoUrl || `https://i.pravatar.cc/100?u=${selectedUser.id}`} className="w-20 h-20 object-cover rounded-[1.5rem] shadow-xl border-4 border-white ring-1 ring-slate-100" />
                      {isUserOnline(selectedUser.last_active) && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{selectedUser.fullName}</h3>
                      <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">{selectedUser.role} • Plaza {selectedUser.employeeId}</p>
                      <div className="mt-2">
                        {isUserOnline(selectedUser.last_active) ? (
                          <span className="text-[9px] text-emerald-600 font-black uppercase flex items-center gap-1">
                            <i className="fas fa-circle text-[5px]"></i> Conectado ahora
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter italic">
                            Última actividad: {selectedUser.last_active ? new Date(selectedUser.last_active).toLocaleString() : 'No registrada'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleChangeRole(UserRole.AFILIADO)}
                    className="px-6 py-3 bg-rose-50 text-rose-600 text-[9px] font-black uppercase rounded-2xl hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-2"
                  >
                    <i className="fas fa-user-slash"></i> Revocar Acceso
                  </button>
                </div>

                {selectedUser.role === UserRole.EDITOR && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personalización de Privilegios Editor</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PermissionItem active={selectedUser.perm_all} label="Control Total" desc="Súper-usuario admin" onClick={() => togglePermission('perm_all')} />
                        <PermissionItem active={selectedUser.perm_status} label="Estatus Laboral" desc="Cambiar situaciones" onClick={() => togglePermission('perm_status')} />
                        <PermissionItem active={selectedUser.perm_role} label="Cargos Sindicales" desc="Gestión de roles" onClick={() => togglePermission('perm_role')} />
                        <PermissionItem active={selectedUser.perm_treasury_pay} label="Cobros y Pagos" desc="Captura de finanzas" onClick={() => togglePermission('perm_treasury_pay')} />
                    </div>
                    <button 
                      onClick={handleSavePermissions}
                      disabled={isSaving}
                      className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-xs"
                    >
                      {isSaving ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
                      {isSaving ? 'Guardando cambios...' : 'Guardar Configuración de Privilegios'}
                    </button>
                  </div>
                )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 italic">
              <i className="fas fa-shield-alt text-6xl mb-6 opacity-10"></i>
              <p className="text-xs font-black uppercase tracking-widest">Seleccione un gestor para editar sus privilegios</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="bg-emerald-600 p-7 md:p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                      <i className="fas fa-user-plus text-xl md:text-2xl"></i>
                   </div>
                   <div>
                      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Activar Nuevo Gestor</h3>
                      <p className="hidden md:block text-[10px] text-emerald-100 font-bold uppercase tracking-widest mt-1">Sincronización de roles en tiempo real con la base de datos</p>
                   </div>
                </div>
                <button onClick={() => {setShowAddModal(false); setNewGestorProfile(null);}} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all shadow-lg">
                  <i className="fas fa-times"></i>
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-7 md:p-10 custom-scrollbar">
               <form id="gestor-form" onSubmit={handleAssignManager} className="space-y-10">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Localizar Trabajador Existente</h4>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none opacity-50">
                        <i className="fas fa-search text-xl"></i>
                      </div>
                      <input 
                        type="text" 
                        autoComplete="off"
                        className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black text-base focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all shadow-sm" 
                        placeholder="Ingrese nombre completo o número de plaza..."
                        value={searchAffiliate}
                        onFocus={() => setShowSearchList(true)}
                        onChange={e => {
                          setSearchAffiliate(e.target.value);
                          setShowSearchList(true);
                          setNewGestorProfile(null);
                        }}
                      />
                      {showSearchList && searchAffiliate.length > 1 && !newGestorProfile && (
                        <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden divide-y divide-slate-50 animate-fadeIn">
                          {filteredAffiliates.length > 0 ? filteredAffiliates.map(aff => (
                            <div 
                              key={aff.id} 
                              className="p-5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between group"
                              onClick={() => {
                                setNewGestorProfile(aff);
                                setSearchAffiliate(aff.fullName);
                                setShowSearchList(false);
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center text-white font-black shadow-lg">
                                  {aff.fotoUrl ? <img src={aff.fotoUrl} className="w-full h-full object-cover rounded-lg" /> : aff.fullName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-800">{aff.fullName}</p>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase italic tracking-tighter">PLAZA {aff.employeeId} • {aff.dependencia}</p>
                                </div>
                              </div>
                              <i className="fas fa-plus text-slate-300 group-hover:text-emerald-600 transition-colors"></i>
                            </div>
                          )) : (
                            <div className="p-10 text-center italic text-slate-400 text-sm font-bold uppercase tracking-widest">Sin resultados encontrados</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {newGestorProfile && (
                    <div className="space-y-8 animate-fadeIn">
                       <div className="p-6 md:p-8 bg-indigo-900 rounded-[2.5rem] flex items-center justify-between shadow-2xl border-4 border-white ring-8 ring-indigo-50/50">
                          <div className="flex items-center gap-6">
                             <img src={newGestorProfile.fotoUrl || `https://i.pravatar.cc/100?u=${newGestorProfile.id}`} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-[1.5rem] shadow-xl border-2 border-white/20" />
                             <div className="text-white">
                                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Perfil Seleccionado</p>
                                <h4 className="text-lg md:text-xl font-black leading-tight tracking-tight">{newGestorProfile.fullName}</h4>
                                <p className="text-[10px] font-bold text-indigo-200 mt-1 uppercase italic truncate max-w-[200px]">{newGestorProfile.dependencia}</p>
                             </div>
                          </div>
                          <button type="button" onClick={() => {setNewGestorProfile(null); setSearchAffiliate('');}} className="p-3 bg-white/10 rounded-2xl text-white hover:bg-rose-600 transition-all flex items-center justify-center">
                             <i className="fas fa-trash-alt text-sm"></i>
                          </button>
                       </div>

                       <div className="space-y-5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Asignar Nivel de Privilegio en el Sistema</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div 
                                onClick={() => setSelectedRole(UserRole.EDITOR)}
                                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-5 ${selectedRole === UserRole.EDITOR ? 'bg-indigo-50 border-indigo-600 shadow-xl' : 'bg-slate-50 border-slate-100 hover:bg-white shadow-sm'}`}
                             >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${selectedRole === UserRole.EDITOR ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}>
                                   <i className="fas fa-user-edit"></i>
                                </div>
                                <div>
                                   <p className="text-base font-black text-slate-800 leading-none">Editor</p>
                                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1.5">Acceso a Afiliados y Finanzas</p>
                                </div>
                             </div>
                             <div 
                                onClick={() => setSelectedRole(UserRole.ADMIN)}
                                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-5 ${selectedRole === UserRole.ADMIN ? 'bg-amber-50 border-amber-500 shadow-xl' : 'bg-slate-50 border-slate-100 hover:bg-white shadow-sm'}`}
                             >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${selectedRole === UserRole.ADMIN ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}>
                                   <i className="fas fa-crown"></i>
                                </div>
                                <div>
                                   <p className="text-base font-black text-slate-800 leading-none">Administrador</p>
                                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1.5">Control Total de Infraestructura</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
               </form>
             </div>

             <div className="bg-slate-50 p-7 md:p-8 flex flex-col md:flex-row gap-5 border-t border-slate-200 shrink-0">
                <button 
                  type="button" 
                  onClick={() => {setShowAddModal(false); setNewGestorProfile(null);}} 
                  className="flex-1 py-5 bg-white text-slate-500 font-black rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all uppercase tracking-widest text-[11px] shadow-sm"
                >
                  Cancelar Operación
                </button>
                <button 
                  form="gestor-form"
                  type="submit" 
                  disabled={isSaving || !newGestorProfile}
                  className={`flex-[2] py-5 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-[11px] ${
                    !newGestorProfile ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                  }`}
                >
                  {isSaving ? <i className="fas fa-circle-notch animate-spin text-lg"></i> : <i className="fas fa-user-shield text-lg"></i>}
                  {isSaving ? 'Actualizando Base de Datos...' : 'Activar Privilegios de Gestión'}
                </button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

const PermissionItem = ({ active, label, desc, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer flex items-center gap-4 ${active ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-slate-100 bg-slate-50 hover:bg-white shadow-sm'}`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border-2 border-slate-200 text-transparent'}`}>
      <i className="fas fa-check text-[10px]"></i>
    </div>
    <div>
      <p className="text-xs font-black text-slate-800 leading-none">{label}</p>
      <p className="text-[9px] text-slate-500 font-bold mt-1.5 uppercase tracking-tighter">{desc}</p>
    </div>
  </div>
);

export default AdminUsersSystem;
