
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { hashPassword } from '../services/authService';
import { updateAffiliateInAirtable } from '../services/airtableService';

interface SettingsProps {
  user: UserProfile;
  onUserUpdate: (updated: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUserUpdate }) => {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (passwords.new !== passwords.confirm) {
      return setMsg({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
    }

    if (passwords.new.length < 8) {
      return setMsg({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    setIsSaving(true);
    try {
      // Verificar contraseña actual
      const currentHash = await hashPassword(passwords.current);
      if (user.password_hash && user.password_hash !== currentHash) {
        setIsSaving(false);
        return setMsg({ type: 'error', text: 'La contraseña actual es incorrecta.' });
      }

      const newHash = await hashPassword(passwords.new);
      const success = await updateAffiliateInAirtable(user.id, { password_hash: newHash });

      if (success) {
        const updatedUser = { ...user, password_hash: newHash };
        onUserUpdate(updatedUser);
        localStorage.setItem('sitracounach_user', JSON.stringify(updatedUser));
        setMsg({ type: 'success', text: '¡Contraseña actualizada con éxito!' });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setMsg({ type: 'error', text: 'Error al conectar con la base de datos.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Ocurrió un error inesperado.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="flex items-center gap-6 mb-10">
        <div className="w-16 h-16 bg-indigo-900 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl">
          <i className="fas fa-cog"></i>
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800">Configuración Personal</h2>
          <p className="text-slate-500 font-medium">Gestione su seguridad y preferencias del portal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <i className="fas fa-shield-alt text-indigo-600"></i>
            <h3 className="text-lg font-black text-slate-800">Cambiar Contraseña</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña Actual</label>
              <input 
                type="password" 
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={passwords.current}
                onChange={e => setPasswords({...passwords, current: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
              <input 
                type="password" 
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={passwords.new}
                onChange={e => setPasswords({...passwords, new: e.target.value})}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
              <input 
                type="password" 
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={passwords.confirm}
                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
              />
            </div>

            {msg && (
              <div className={`p-4 rounded-xl text-xs font-black uppercase flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                {msg.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
            >
              {isSaving ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-key"></i>}
              {isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <h4 className="text-xl font-black mb-4">Información de Acceso</h4>
                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                         <i className="fas fa-id-badge text-indigo-300"></i>
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-indigo-300 uppercase">Nickname de Acceso</p>
                         <p className="text-sm font-black">{user.nickname || 'No asignado'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                         <i className="fas fa-envelope text-indigo-300"></i>
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-indigo-300 uppercase">Correo Identificador</p>
                         <p className="text-sm font-black truncate">{user.email_unach || 'Pendiente por registrar'}</p>
                      </div>
                   </div>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full -mr-16 -mt-16 opacity-50"></div>
          </div>

          <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
             <div className="flex items-start gap-4">
                <i className="fas fa-info-circle text-amber-500 text-xl mt-1"></i>
                <div>
                  <h5 className="font-black text-amber-900 text-sm mb-2">Recordatorio Importante</h5>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Su nickname temporal será reemplazado por su correo institucional una vez que lo complete en su perfil. Podrá seguir entrando con su contraseña personal sin cambios.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
