
import React, { useState, useEffect, useMemo } from 'react';
import { PaymentRecord, UserProfile, UserRole } from '../types';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { createPaymentInAirtable, fetchAffiliatesFromAirtable, fetchAllPayments, updatePaymentInAirtable } from '../services/airtableService';

interface AdminTreasuryProps {
  currentUser: UserProfile;
}

const AdminTreasury: React.FC<AdminTreasuryProps> = ({ currentUser }) => {
  const [affiliates, setAffiliates] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balances' | 'audit'>('balances');
  
  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedPaymentForReview, setSelectedPaymentForReview] = useState<PaymentRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Búsqueda
  const [searchAffiliate, setSearchAffiliate] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<UserProfile | null>(null);
  const [showSearchList, setShowSearchList] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');

  const [newPayment, setNewPayment] = useState<Partial<PaymentRecord>>({
    monto: 50, 
    metodo: 'Transferencia', 
    estatus: 'Validado', 
    mes: 'Abril', 
    año: 2025,
    fechaDeposito: new Date().toISOString().split('T')[0],
    referencia: '',
    notas: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const canAddPayments = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TESORERO || currentUser.perm_treasury_pay;

  const loadData = async () => {
    setLoading(true);
    const [aData, pData] = await Promise.all([
      fetchAffiliatesFromAirtable(),
      fetchAllPayments()
    ]);
    setAffiliates(aData);
    setPayments(pData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Resumen de saldos por afiliado
  const affiliateFinancials = useMemo(() => {
    return affiliates.map(aff => {
      const affPayments = payments.filter(p => p.afiliadoId === aff.id && p.estatus === 'Validado');
      const totalPaid = affPayments.reduce((acc, curr) => acc + curr.monto, 0);
      const lastPayment = affPayments.length > 0 ? affPayments.sort((a, b) => new Date(b.fechaDeposito).getTime() - new Date(a.fechaDeposito).getTime())[0] : null;
      return {
        ...aff,
        totalPaid,
        lastPeriod: lastPayment ? `${lastPayment.mes} ${lastPayment.año}` : 'Sin registros'
      };
    }).filter(aff => 
      aff.fullName.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
      aff.employeeId.includes(globalSearchTerm)
    );
  }, [affiliates, payments, globalSearchTerm]);

  // Auditoría cronológica de pagos
  const filteredAuditPayments = useMemo(() => {
    return payments.filter(p => {
      const aff = affiliates.find(a => a.id === p.afiliadoId);
      const searchString = `${aff?.fullName} ${aff?.employeeId} ${p.referencia} ${p.mes}`.toLowerCase();
      return searchString.includes(auditSearchTerm.toLowerCase());
    });
  }, [payments, affiliates, auditSearchTerm]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliate) return alert("Identifique al afiliado.");
    
    setIsSubmitting(true);
    let finalComprobanteUrl = "";
    if (selectedFile) {
      finalComprobanteUrl = await uploadToCloudinary(selectedFile, "pagos") || "";
    }
    
    const result = await createPaymentInAirtable({ 
      ...newPayment, 
      afiliadoId: selectedAffiliate.id,
      comprobanteUrl: finalComprobanteUrl, 
      adminEditor: currentUser.fullName 
    });

    if (result) {
      alert("¡Sincronización exitosa!");
      closeAndReset();
      loadData();
    } else {
      alert("Error al intentar sincronizar.");
    }
    setIsSubmitting(false);
  };

  const handleUpdateStatus = async (status: 'Validado' | 'Rechazado') => {
    if (!selectedPaymentForReview) return;
    setIsSubmitting(true);
    const success = await updatePaymentInAirtable(selectedPaymentForReview.id, {
      estatus: status,
      adminEditor: currentUser.fullName,
      notas: selectedPaymentForReview.notas
    });
    if (success) {
      alert(`Pago ${status} correctamente.`);
      setShowReviewModal(false);
      loadData();
    }
    setIsSubmitting(false);
  };

  const closeAndReset = () => {
    setShowModal(false);
    setNewPayment({ monto: 50, metodo: 'Transferencia', estatus: 'Validado', mes: 'Abril', año: 2025, fechaDeposito: new Date().toISOString().split('T')[0], referencia: '', notas: '' });
    setSelectedFile(null);
    setSelectedAffiliate(null);
    setSearchAffiliate('');
  };

  const filteredSearchAffiliates = affiliates.filter(a => 
    a.fullName.toLowerCase().includes(searchAffiliate.toLowerCase()) || 
    a.employeeId.includes(searchAffiliate)
  ).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-indigo-900 tracking-tighter">Gestión Tesorería</h2>
          <p className="text-slate-500 font-medium italic">Control financiero y auditoría de cuotas sindicales</p>
        </div>
        <div className="flex gap-4">
          <button onClick={loadData} className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
          </button>
          {canAddPayments && (
            <button onClick={() => setShowModal(true)} className="bg-indigo-900 text-white px-8 h-14 rounded-2xl font-black text-xs shadow-xl hover:bg-black transition-all flex items-center gap-2 uppercase tracking-widest">
              <i className="fas fa-plus-circle text-lg"></i> Nuevo Registro
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
         <button 
           onClick={() => setActiveTab('balances')}
           className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'balances' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
         >
           Resumen de Saldos
         </button>
         <button 
           onClick={() => setActiveTab('audit')}
           className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
         >
           Auditoría de Pagos
           {payments.filter(p => p.estatus === 'Pendiente').length > 0 && (
             <span className="ml-2 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[8px]">{payments.filter(p => p.estatus === 'Pendiente').length}</span>
           )}
         </button>
      </div>

      {activeTab === 'balances' ? (
        <div className="animate-fadeIn">
          <div className="mb-8 relative max-w-xl">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              type="text" 
              placeholder="Buscar afiliado..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={globalSearchTerm}
              onChange={e => setGlobalSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden overflow-x-auto shadow-indigo-100/30">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agremiado / Plaza</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dependencia</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aportado Total</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Último Periodo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-32 text-center font-black text-slate-300 uppercase tracking-widest animate-pulse italic">Cargando estados financieros...</td></tr>
                ) : affiliateFinancials.length === 0 ? (
                  <tr><td colSpan={5} className="p-32 text-center text-slate-400 italic text-xs uppercase tracking-widest">No se encontraron registros</td></tr>
                ) : affiliateFinancials.map(aff => (
                  <tr key={aff.id} className="hover:bg-indigo-50/40 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={aff.fotoUrl || `https://i.pravatar.cc/100?u=${aff.id}`} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                        <div>
                           <p className="font-black text-slate-800 text-sm leading-tight">{aff.fullName}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Plaza: {aff.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase max-w-[200px] truncate">
                      {aff.dependencia || aff.area}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-base font-black ${aff.totalPaid > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                        ${aff.totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${aff.lastPeriod !== 'Sin registros' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                        {aff.lastPeriod}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <button 
                        onClick={() => { setSelectedAffiliate(aff); setSearchAffiliate(aff.fullName); setShowModal(true); }}
                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                       >
                         <i className="fas fa-plus-circle"></i>
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          <div className="mb-8 relative max-w-xl">
            <i className="fas fa-filter absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              type="text" 
              placeholder="Filtrar por referencia o afiliado..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={auditSearchTerm}
              onChange={e => setAuditSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha / Ref</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Afiliado</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Monto</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estatus</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditPayments.length === 0 ? (
                  <tr><td colSpan={5} className="p-32 text-center text-slate-400 italic text-xs uppercase tracking-widest">No hay pagos registrados</td></tr>
                ) : filteredAuditPayments.map(p => {
                  const aff = affiliates.find(a => a.id === p.afiliadoId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-slate-700">{p.fechaDeposito}</p>
                        <p className="text-[9px] font-mono text-slate-400 uppercase">{p.referencia || 'SIN REF'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-slate-800">{aff?.fullName || 'Desconocido'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{p.mes} {p.año}</p>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-indigo-600 text-sm">
                        ${p.monto.toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                          p.estatus === 'Validado' ? 'bg-emerald-100 text-emerald-700' : 
                          p.estatus === 'Pendiente' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {p.estatus}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => { setSelectedPaymentForReview(p); setShowReviewModal(true); }}
                          className="px-6 py-2.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE REVISIÓN DE PAGO (VALIDACIÓN) */}
      {showReviewModal && selectedPaymentForReview && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Lado Izquierdo: Comprobante */}
            <div className="md:w-1/2 bg-slate-100 p-8 flex flex-col items-center justify-center border-r border-slate-200">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Evidencia de Operación</h4>
              {selectedPaymentForReview.comprobanteUrl ? (
                <div className="w-full h-full flex flex-col gap-4">
                  <div className="flex-1 bg-white rounded-3xl overflow-hidden shadow-inner border border-slate-200 group relative">
                    <img src={selectedPaymentForReview.comprobanteUrl} className="w-full h-full object-contain" alt="Comprobante" />
                    <a href={selectedPaymentForReview.comprobanteUrl} target="_blank" className="absolute bottom-4 right-4 bg-black/50 text-white w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <i className="fas fa-expand"></i>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 italic p-20 text-center">
                  <i className="fas fa-image text-6xl mb-4 opacity-10"></i>
                  <p className="text-sm font-bold uppercase tracking-widest">Sin comprobante digital adjunto</p>
                </div>
              )}
            </div>

            {/* Lado Derecho: Detalles y Acciones */}
            <div className="md:w-1/2 p-10 flex flex-col bg-white">
              <div className="flex justify-between items-start mb-10">
                <div>
                   <h3 className="text-2xl font-black text-indigo-900 leading-tight">Auditoría de Movimiento</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID Airtable: {selectedPaymentForReview.id}</p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Monto Reportado</p>
                    <p className="text-2xl font-black text-emerald-600">${selectedPaymentForReview.monto.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Fecha Depósito</p>
                    <p className="text-lg font-black text-slate-800">{selectedPaymentForReview.fechaDeposito}</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest border-b pb-2">
                     <span className="text-slate-400">Concepto</span>
                     <span className="text-indigo-600">{selectedPaymentForReview.mes} {selectedPaymentForReview.año}</span>
                   </div>
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest border-b pb-2">
                     <span className="text-slate-400">Referencia Bancaria</span>
                     <span className="text-slate-800">{selectedPaymentForReview.referencia || 'N/A'}</span>
                   </div>
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest border-b pb-2">
                     <span className="text-slate-400">Método</span>
                     <span className="text-slate-800">{selectedPaymentForReview.metodo}</span>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Comentario Administrativo</label>
                  <textarea 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-28 resize-none"
                    value={selectedPaymentForReview.notas}
                    onChange={e => setSelectedPaymentForReview({...selectedPaymentForReview, notas: e.target.value})}
                    placeholder="Escriba motivo de rechazo o nota de validación..."
                  />
                </div>
              </div>

              <div className="pt-10 flex gap-4">
                <button 
                  onClick={() => handleUpdateStatus('Rechazado')}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-rose-50 text-rose-600 font-black rounded-2xl text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all"
                >
                  Rechazar Pago
                </button>
                <button 
                  onClick={() => handleUpdateStatus('Validado')}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-check-circle"></i>}
                  {isSubmitting ? 'Procesando...' : 'Validar y Aplicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORTE DE PAGO (NUEVO REGISTRO) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-indigo-900 p-8 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <i className="fas fa-file-invoice-dollar text-3xl text-indigo-300"></i>
                <h3 className="text-2xl font-black uppercase tracking-tight">Nuevo Registro de Pago</h3>
              </div>
              <button onClick={closeAndReset} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificar Afiliado</label>
                <div className="relative">
                  <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  <input 
                    type="text"
                    className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    placeholder="Escriba nombre o plaza..."
                    value={searchAffiliate}
                    onFocus={() => setShowSearchList(true)}
                    onChange={(e) => {
                      setSearchAffiliate(e.target.value);
                      setShowSearchList(true);
                    }}
                  />
                  {showSearchList && searchAffiliate.length > 1 && !selectedAffiliate && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                      {filteredSearchAffiliates.map(aff => (
                        <div key={aff.id} onClick={() => { setSelectedAffiliate(aff); setSearchAffiliate(aff.fullName); setShowSearchList(false); }} className="p-4 hover:bg-indigo-50 cursor-pointer flex items-center gap-4 border-b">
                          <img src={aff.fotoUrl || `https://i.pravatar.cc/50?u=${aff.id}`} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="text-xs font-black text-slate-800">{aff.fullName}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Plaza {aff.employeeId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedAffiliate && (
                  <div className="p-4 bg-indigo-900 rounded-2xl flex items-center justify-between text-white animate-fadeIn">
                    <div className="flex items-center gap-4">
                       <img src={selectedAffiliate.fotoUrl || `https://i.pravatar.cc/50?u=${selectedAffiliate.id}`} className="w-10 h-10 rounded-xl object-cover border border-white/20" />
                       <div>
                         <p className="text-xs font-black leading-none">{selectedAffiliate.fullName}</p>
                         <p className="text-[9px] font-bold text-indigo-300 uppercase mt-1">Socio Identificado: {selectedAffiliate.employeeId}</p>
                       </div>
                    </div>
                    <button onClick={() => { setSelectedAffiliate(null); setSearchAffiliate(''); }} className="text-white/50 hover:text-white"><i className="fas fa-times"></i></button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MONTO ($ MXN)</label>
                  <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newPayment.monto} onChange={e => setNewPayment({...newPayment, monto: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MES DEL PERIODO</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newPayment.mes} onChange={e => setNewPayment({...newPayment, mes: e.target.value})}>
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AÑO</label>
                  <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newPayment.año} onChange={e => setNewPayment({...newPayment, año: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">FECHA DEPÓSITO</label>
                  <input type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newPayment.fechaDeposito} onChange={e => setNewPayment({...newPayment, fechaDeposito: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MÉTODO</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newPayment.metodo} onChange={e => setNewPayment({...newPayment, metodo: e.target.value as any})}>
                    <option value="Transferencia">Transferencia</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Depósito">Depósito</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SUBIR BOCHUER</label>
                   <div className="relative h-[58px]">
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                      <div className="h-full border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-black text-[10px] uppercase">
                         {selectedFile ? <><i className="fas fa-check-circle text-emerald-500"></i> {selectedFile.name.substring(0, 15)}...</> : <><i className="fas fa-upload"></i> Adjuntar Imagen</>}
                      </div>
                   </div>
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">REFERENCIA O FOLIO</label>
                  <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-indigo-700 uppercase focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="FOLIO BANCARIO..." value={newPayment.referencia} onChange={e => setNewPayment({...newPayment, referencia: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row gap-4 shrink-0">
               <button onClick={closeAndReset} className="flex-1 py-5 bg-white text-slate-500 font-black rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all text-xs uppercase tracking-widest">CANCELAR</button>
               <button onClick={handleAddPayment} disabled={isSubmitting || !selectedAffiliate} className={`flex-[2] py-5 font-black rounded-2xl shadow-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 ${!selectedAffiliate || isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-900 shadow-indigo-100'}`}>
                 {isSubmitting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
                 {isSubmitting ? 'Sincronizando...' : 'GUARDAR REGISTRO'}
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

export default AdminTreasury;
