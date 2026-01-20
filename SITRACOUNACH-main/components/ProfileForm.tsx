
import React, { useState } from 'react';
import { UserProfile, UserRole, EmploymentStatus } from '../types';
import SignatureCanvas from './SignatureCanvas';
import IDCard from './IDCard';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { updateAffiliateInAirtable } from '../services/airtableService';

interface ProfileFormProps {
  profile: UserProfile;
  onUpdate: (updated: UserProfile) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [tempFirma, setTempFirma] = useState<string | null>(null);

  const isAdminSession = profile.role === UserRole.ADMIN || profile.role === UserRole.EDITOR || profile.id === 'MASTER_GOD_MODE';
  const canModifyRestrictedFields = isAdminSession || profile.perm_all || profile.perm_role;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file, "fotos_agremiados");
      if (url) {
        setFormData(prev => ({ ...prev, fotoUrl: url }));
      }
    } catch (err) {
      alert("Error al subir la fotografía.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        let finalFirmaUrl = formData.firmaUrl;
        if (tempFirma && tempFirma.startsWith('data:image')) {
          const url = await uploadToCloudinary(tempFirma, "firmas_agremiados");
          if (url) finalFirmaUrl = url;
        }

        const success = await updateAffiliateInAirtable(profile.id, { ...formData, firmaUrl: finalFirmaUrl });
        if (success) {
          const updated = { ...formData, firmaUrl: finalFirmaUrl };
          onUpdate(updated);
          localStorage.setItem('sitracounach_user', JSON.stringify(updated));
          alert("¡Expediente actualizado y sincronizado correctamente!");
          setTempFirma(null);
        }
    } catch (err) {
        alert("Ocurrió un error al guardar los cambios.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-indigo-900 p-8 text-white">
          <h3 className="text-2xl font-black">Mi Expediente Digital</h3>
          <p className="text-indigo-200 text-sm font-medium">Información oficial vinculada a base de datos</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* FOTOGRAFÍA */}
          <div className="flex flex-col items-center mb-8">
             <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-100">
                   {uploadingPhoto ? (
                     <div className="w-full h-full flex items-center justify-center bg-indigo-900/10">
                        <i className="fas fa-circle-notch animate-spin text-indigo-600 text-2xl"></i>
                     </div>
                   ) : (
                     <img 
                       src={formData.fotoUrl || `https://i.pravatar.cc/300?u=${profile.id}`} 
                       className="w-full h-full object-cover" 
                       alt="Avatar" 
                     />
                   )}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-indigo-700 transition-all border-4 border-white">
                   <i className="fas fa-camera text-xs"></i>
                   <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} />
                </label>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Fotografía de Perfil</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-full space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
              <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. de Plaza (Vinculado)</label>
              <input type="text" value={formData.employeeId} disabled={!canModifyRestrictedFields} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold ${!canModifyRestrictedFields ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'}`} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RFC Oficial</label>
              <input type="text" value={formData.rfc || ''} disabled={!canModifyRestrictedFields} onChange={(e) => setFormData({...formData, rfc: e.target.value})} className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold uppercase ${!canModifyRestrictedFields ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'}`} />
            </div>

            <div className="col-span-full space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grupos y Comisiones Sindicales</label>
              <div className="w-full px-5 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm font-black text-indigo-700">
                {formData.grupos || 'Ningún grupo asignado actualmente'}
              </div>
              <p className="text-[9px] text-slate-400 italic ml-1 mt-1">* Este campo es de solo lectura y se sincroniza con la administración central.</p>
            </div>

            <div className="col-span-full space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Domicilio Particular (Vinculado)</label>
              <input type="text" value={formData.direccion || ''} onChange={(e) => setFormData({...formData, direccion: e.target.value})} placeholder="Ingrese su domicilio" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dependencia</label>
              <input type="text" value={formData.dependencia || ''} onChange={(e) => setFormData({...formData, dependencia: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estatus Laboral</label>
              <select value={formData.status} disabled={!canModifyRestrictedFields} onChange={(e) => setFormData({...formData, status: e.target.value as EmploymentStatus})} className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold ${!canModifyRestrictedFields ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'}`}>
                {Object.values(EmploymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Firma del Titular</label>
            <SignatureCanvas onSave={(data) => setTempFirma(data)} onClear={() => { setTempFirma(null); setFormData({...formData, firmaUrl: ''}); }} />
          </div>

          <button type="submit" disabled={isSaving || uploadingPhoto} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-900 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-50">
             {isSaving ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
             {isSaving ? 'Guardando...' : 'Sincronizar Datos con Airtable'}
          </button>
        </form>
      </div>

      {/* VISTA PREVIA */}
      <div className="flex flex-col items-center justify-start p-10 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 sticky top-8 h-fit">
        <div className="mb-10 text-center">
           <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Vista Previa de Identidad</h4>
           <p className="text-[10px] text-slate-400 italic">Haz clic para voltear la credencial</p>
        </div>
        <IDCard profile={{...formData, firmaUrl: tempFirma || formData.firmaUrl}} />
      </div>
    </div>
  );
};

export default ProfileForm;
