
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface IDCardProps {
  profile: UserProfile;
}

const IDCard: React.FC<IDCardProps> = ({ profile }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // URL del escudo proporcionada por el usuario (versión fondo blanco optimizada)
  const LOGO_SINDICATO = "https://res.cloudinary.com/rriostrujillo/image/upload/fl_preserve_transparency/v1766968622/Photokako-channel-mixer-8BSNv3HzsZXc7S6U_y4tiyt.jpg";
  const FIRMA_SECRETARIA = "https://i.imgur.com/wmib5hq.png"; 

  return (
    <div className="perspective-1000 w-[340px] h-[540px] cursor-pointer mx-auto" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-[0_40px_80px_-15px_rgba(0,0,0,0.35)] rounded-[2.5rem] ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* ANVERSO (Frente) */}
        <div className="absolute inset-0 backface-hidden bg-white rounded-[2.5rem] overflow-hidden flex flex-col border border-slate-100">
          
          {/* Header Minimalista */}
          <div className="h-32 bg-indigo-900 flex items-center justify-between px-8 relative">
            <div className="z-10">
              <p className="text-[14px] text-white font-black tracking-widest leading-none mb-1">SITRACOUNACH</p>
              <p className="text-[6.5px] text-indigo-200 font-bold uppercase tracking-[0.1em] max-w-[160px] leading-tight opacity-90">
                Sindicato de Trabajadores de Confianza de la UNACH
              </p>
            </div>
            {/* Escudo Restaurado - Frente Derecha */}
            <div className="w-14 h-14 bg-white rounded-2xl p-1.5 border border-white/20 flex items-center justify-center overflow-hidden shadow-lg">
               <img src={LOGO_SINDICATO} className="w-full h-full object-contain" alt="Escudo Frente" />
            </div>
          </div>

          {/* Zona de Fotografía */}
          <div className="relative h-24 flex justify-center">
            <div className="absolute -top-12 w-36 h-36 bg-white rounded-[2.5rem] p-1.5 shadow-2xl border border-slate-50 overflow-hidden ring-4 ring-white">
               <img 
                 src={profile.fotoUrl || `https://i.pravatar.cc/300?u=${profile.id}`} 
                 className="w-full h-full object-cover rounded-[2rem]" 
                 alt="Foto Agremiado" 
               />
            </div>
          </div>

          {/* Cuerpo de Datos */}
          <div className="mt-4 flex-1 flex flex-col px-8 text-center">
            <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{profile.fullName}</h3>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.3em] mb-4">Socio Agremiado</p>
            
            <div className="w-full grid grid-cols-2 gap-y-4 text-left border-t border-slate-50 pt-4">
              <div className="space-y-0.5">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">No. de Plaza</p>
                <p className="text-[11px] font-black text-slate-800">{profile.employeeId}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">RFC Oficial</p>
                <p className="text-[11px] font-black text-slate-800 uppercase">{profile.rfc || 'N/A'}</p>
              </div>
              <div className="col-span-2 space-y-0.5">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Dependencia</p>
                <p className="text-[10px] font-bold text-slate-700 leading-tight truncate">{profile.dependencia || profile.area || 'Administración Central'}</p>
              </div>
              <div className="col-span-2 space-y-0.5">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Grupos / Comisiones</p>
                <p className="text-[9px] font-black text-indigo-600 truncate">{profile.grupos || 'Ninguno'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Situación</p>
                <p className="text-[10px] font-black text-emerald-600 uppercase">{profile.status}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Puesto</p>
                <p className="text-[10px] font-bold text-slate-700 truncate">{profile.puesto || profile.role}</p>
              </div>
            </div>

            {/* Firma del Titular */}
            <div className="mt-auto mb-4 w-full flex flex-col items-center">
              <div className="h-14 w-32 relative flex items-center justify-center">
                {profile.firmaUrl ? (
                  <img src={profile.firmaUrl} className="max-w-full max-h-full object-contain mix-blend-multiply" alt="Firma Titular" />
                ) : (
                  <div className="w-full h-px bg-slate-200 mt-6 opacity-50"></div>
                )}
              </div>
              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest border-t border-slate-100 pt-1 w-28">Firma del Titular</p>
            </div>
          </div>
          
          <div className="h-10 bg-slate-50 flex items-center justify-center border-t border-slate-100">
             <p className="text-[7px] text-slate-400 font-bold tracking-[0.2em] uppercase">Solidaridad y Respeto a Nuestros Derechos</p>
          </div>
        </div>

        {/* REVERSO (Dorso) */}
        <div className="absolute inset-0 backface-hidden bg-slate-50 rounded-[2.5rem] overflow-hidden flex flex-col border border-slate-200 rotate-y-180">
          
          <div className="p-8 flex justify-between items-start shrink-0">
             <div className="space-y-1">
                <p className="text-xs font-black text-slate-800 tracking-tighter">SITRACOUNACH</p>
                <p className="text-[6px] text-slate-400 font-bold uppercase max-w-[140px] leading-tight">Sindicato de Trabajadores de Confianza de la UNACH</p>
             </div>
             <div className="w-10 h-10 bg-white rounded-xl p-1 border border-slate-100 shadow-sm flex items-center justify-center">
                <img src={LOGO_SINDICATO} className="w-full h-full object-contain" alt="Escudo Dorso Superior" />
             </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl border border-white ring-[10px] ring-white/50">
               <img src={profile.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SITRACO:${profile.employeeId}`} className="w-40 h-40" alt="Código QR" />
            </div>
            <div className="text-center px-10">
              <p className="text-[8px] text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                Acreditación oficial de la membresía activa del SITRACOUNACH. 
                Válida únicamente con el sello digital vigente y firma autorizada.
              </p>
            </div>
          </div>

          {/* Firma Autoridad */}
          <div className="p-8 bg-white border-t border-slate-100 flex flex-col items-center relative">
            <div className="w-40 h-20 relative mb-2 flex items-center justify-center">
              <img src={FIRMA_SECRETARIA} className="max-w-full max-h-full object-contain" alt="Firma Autoridad" />
            </div>
            <h4 className="text-[10px] font-black text-slate-900 uppercase">Lic. Marcela Arguello Álvarez</h4>
            <p className="text-[8px] text-indigo-600 font-black uppercase tracking-widest">Secretaria General</p>
          </div>
          
          <div className="h-16 bg-indigo-900 flex items-center justify-between px-8">
             <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden">
                   <img src={LOGO_SINDICATO} className="h-full w-full object-contain" alt="Escudo Dorso Footer" />
                </div>
                <div className="h-6 w-px bg-white/20"></div>
                <p className="text-[8px] text-white/80 font-black uppercase tracking-tighter">SITRACO</p>
             </div>
             <p className="text-[9px] text-white font-black tracking-tighter uppercase opacity-80">Gestión 2024 - 2026</p>
          </div>
        </div>

      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default IDCard;
