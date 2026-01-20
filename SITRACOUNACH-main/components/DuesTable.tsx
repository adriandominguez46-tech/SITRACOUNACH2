
import React, { useState, useEffect, useCallback } from 'react';
import { MonthlyDue, UserProfile, PaymentRecord } from '../types';
import { fetchPaymentsForUser, createPaymentInAirtable } from '../services/airtableService';
import { uploadToCloudinary } from '../services/cloudinaryService';

interface DuesTableProps {
  userProfile: UserProfile;
}

const DuesTable: React.FC<DuesTableProps> = ({ userProfile }) => {
  const [dues, setDues] = useState<MonthlyDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newReport, setNewReport] = useState<Partial<PaymentRecord>>({
    monto: 50,
    mes: 'Abril',
    año: 2025,
    metodo: 'Transferencia',
    fechaDeposito: new Date().toISOString().split('T')[0],
    referencia: '',
    notas: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadDues = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    const data = await fetchPaymentsForUser(userProfile.employeeId);
    setDues(data);
    if (!isSilent) setLoading(false);
  }, [userProfile.employeeId]);

  useEffect(() => {
    loadDues();
    // POLLING: Refrescar cuotas cada 15 segundos para ver validaciones en tiempo real
    const interval = setInterval(() => loadDues(true), 15000);
    return () => clearInterval(interval);
  }, [loadDues]);

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let url = "";
    if (selectedFile) {
      url = await uploadToCloudinary(selectedFile, "bouchers_afiliados") || "";
    }

    const result = await createPaymentInAirtable({
      ...newReport,
      afiliadoId: userProfile.id,
      comprobanteUrl: url,
      estatus: 'Pendiente',
      adminEditor: 'Reporte de Usuario'
    });

    if (result) {
      alert("✅ ¡Reporte enviado! Tesorería lo validará en breve.");
      closeModalAndReset();
      loadDues();
    } else {
      alert("❌ Error al enviar el reporte. Intente más tarde.");
    }
    setIsSubmitting(false);
  };

  const closeModalAndReset = () => {
    setShowModal(false);
    setNewReport({ monto: 50, mes: 'Abril', año: 2025, metodo: 'Transferencia', fechaDeposito: new Date().toISOString().split('T')[0], referencia: '', notas: '' });
    setSelectedFile(null);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Estado de Mis Cuotas</h3>
          <p className="text-slate-500 text-sm font-medium">Historial de aportes vinculado a Plaza: {userProfile.employeeId}</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => loadDues()}
             className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
           >
             <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
           </button>
           <button 
             onClick={() => setShowModal(true)}
             className="bg-indigo-600 text-white px-8 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2"
           >
             <i className="fas fa-plus-circle"></i> Reportar Nuevo Pago
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Sincronizando Tesorería...</p>
        </div>
      ) : dues.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center text-slate-300 flex flex-col items-center shadow-inner">
           <i className="fas fa-wallet text-6xl mb-6 opacity-10"></i>
           <p className="text-sm font-black uppercase tracking-widest">Sin registros de cuotas</p>
           <p className="text-[10px] mt-2 font-medium">Usa el botón "Reportar Nuevo Pago" para registrar tu primer aporte.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Periodo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidencia / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dues.map((due) => (
                  <tr key={due.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-700">{due.month}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{due.year}</p>
                    </td>
                    <td className="px-8 py-6 text-sm text-indigo-600 font-black font-mono">${due.amount.toFixed(2)}</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        due.status === 'Pagado' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700 animate-pulse'
                      }`}>
                        <i className={`fas ${due.status === 'Pagado' ? 'fa-check-circle' : 'fa-clock'}`}></i>
                        {due.status === 'Pagado' ? 'VALIDADO' : 'EN REVISIÓN'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-800 font-mono leading-none">{due.reference || 'REF: N/A'}</p>
                          <p className="text-[9px] text-slate-400 font-medium italic mt-1">{due.paymentDate}</p>
                        </div>
                        {due.comprobanteUrl && (
                          <a href={due.comprobanteUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                             <i className="fas fa-image text-xs"></i>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REPORTE DE PAGO (USUARIO) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-fadeIn border border-white/20">
            <div className="bg-indigo-900 p-8 text-white flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                     <i className="fas fa-file-upload text-2xl text-indigo-300"></i>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Reportar Pago de Cuota</h3>
               </div>
               <button onClick={closeModalAndReset} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all shadow-lg"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleReportPayment} className="p-10 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Depositado ($)</label>
                    <input type="number" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none" value={newReport.monto} onChange={e => setNewReport({...newReport, monto: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Operación</label>
                    <input type="date" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={newReport.fechaDeposito} onChange={e => setNewReport({...newReport, fechaDeposito: e.target.value})} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mes correspondiente</label>
                    <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={newReport.mes} onChange={e => setNewReport({...newReport, mes: e.target.value})}>
                      {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pago</label>
                    <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={newReport.metodo} onChange={e => setNewReport({...newReport, metodo: e.target.value as any})}>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Depósito">Depósito Bancario</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referencia o Folio</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none uppercase" placeholder="Ej: 123456789" value={newReport.referencia} onChange={e => setNewReport({...newReport, referencia: e.target.value})} />
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjuntar Boucher (Imagen)</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      accept="image/*"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <div className="w-full py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:border-indigo-400 transition-all">
                       {selectedFile ? (
                         <>
                           <i className="fas fa-check-circle text-emerald-500 text-3xl"></i>
                           <p className="text-[10px] font-black text-slate-600 uppercase">{selectedFile.name}</p>
                         </>
                       ) : (
                         <>
                           <i className="fas fa-cloud-upload-alt text-3xl text-slate-300 group-hover:text-indigo-600 transition-colors"></i>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Haz clic o arrastra tu boucher aquí</p>
                         </>
                       )}
                    </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={closeModalAndReset}
                    className="flex-1 py-5 bg-white text-slate-500 font-black rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Cancelar Reporte
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`flex-[2] py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-[10px] ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-paper-plane"></i>}
                    {isSubmitting ? 'Enviando...' : 'Enviar Reporte a Tesorería'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuesTable;
