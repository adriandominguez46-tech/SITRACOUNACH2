
import React, { useState, useEffect, useMemo } from 'react';
import { Poll, PollResponse, UserProfile, UserRole } from '../types';
import { fetchPollsFromAirtable, createOrUpdatePoll, fetchAllPollResponses } from '../services/airtableService';

const AdminPolls: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [allResponses, setAllResponses] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const [editingPoll, setEditingPoll] = useState<Partial<Poll>>({
    pregunta: '',
    descripcion: '',
    opciones: ['Sí', 'No'],
    fechaInicio: new Date().toISOString().slice(0, 16),
    fechaFin: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
    estatus: 'Borrador'
  });

  const loadData = async () => {
    // No reseteamos loading para evitar parpadeos en el polling
    try {
      const [pData, rData] = await Promise.all([
        fetchPollsFromAirtable(),
        fetchAllPollResponses()
      ]);
      setPolls(pData);
      setAllResponses(rData);
      
      // Si hay una encuesta seleccionada, actualizamos su referencia para que use los nuevos datos
      if (selectedPoll) {
        const updated = pData.find(p => p.id === selectedPoll.id);
        if (updated) setSelectedPoll(updated);
      }
    } catch (e) {
      console.error("Error al sincronizar encuestas:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Polling cada 10s
    return () => clearInterval(interval);
  }, [selectedPoll?.id]);

  const handleOpenResults = (poll: Poll) => {
    setSelectedPoll(poll);
  };

  const handleSave = async () => {
    if (!editingPoll.pregunta || !editingPoll.opciones || editingPoll.opciones.length < 2) {
      alert("La encuesta requiere una pregunta y al menos 2 opciones.");
      return;
    }
    setIsSaving(true);
    const success = await createOrUpdatePoll(editingPoll);
    if (success) {
      setShowModal(false);
      await loadData();
    }
    setIsSaving(false);
  };

  // Cálculo de resultados robusto (insensible a mayúsculas/acentos y espacios)
  const currentPollResponses = useMemo(() => {
    if (!selectedPoll) return [];
    return allResponses.filter(r => r.pollId === selectedPoll.id);
  }, [selectedPoll, allResponses]);

  const resultsData = useMemo(() => {
    if (!selectedPoll) return [];
    
    return selectedPoll.opciones.map(opt => {
      const normalizedOpt = opt.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const count = currentPollResponses.filter(r => {
        const normalizedVote = String(r.voto || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalizedVote === normalizedOpt;
      }).length;

      const percentage = currentPollResponses.length > 0 ? (count / currentPollResponses.length) * 100 : 0;
      
      return { 
        label: opt, 
        count, 
        percentage 
      };
    });
  }, [selectedPoll, currentPollResponses]);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-indigo-900 tracking-tighter">Gestión de Encuestas</h2>
          <p className="text-slate-500 font-medium italic">Consenso democrático y toma de decisiones en tiempo real</p>
        </div>
        <button onClick={() => { setEditingPoll({ pregunta: '', descripcion: '', opciones: ['Sí', 'No'], fechaInicio: new Date().toISOString().slice(0, 16), fechaFin: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16), estatus: 'Borrador' }); setShowModal(true); }} className="bg-amber-600 text-white px-8 h-14 rounded-2xl font-black text-xs shadow-xl hover:bg-amber-700 transition-all flex items-center gap-2 uppercase tracking-widest">
          <i className="fas fa-plus-circle text-lg"></i> Crear Nueva Encuesta
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          {loading && polls.length === 0 ? (
            <div className="py-20 text-center font-black text-slate-300 uppercase animate-pulse">Sincronizando encuestas...</div>
          ) : polls.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-400 font-black uppercase text-xs">No hay encuestas registradas</div>
          ) : (
            polls.map(poll => (
              <div 
                key={poll.id} 
                onClick={() => handleOpenResults(poll)}
                className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl group cursor-pointer ${selectedPoll?.id === poll.id ? 'ring-4 ring-indigo-500/20 border-indigo-200' : ''}`}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${poll.estatus === 'Publicada' ? 'bg-emerald-100 text-emerald-700' : poll.estatus === 'Finalizada' ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-600'}`}>
                      {poll.estatus === 'Publicada' ? 'Publicada' : poll.estatus === 'Finalizada' ? 'Cerrada' : 'Borrador'}
                    </span>
                    <div className="flex gap-2">
                       <button onClick={(e) => { e.stopPropagation(); setEditingPoll(poll); setShowModal(true); }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center">
                          <i className="fas fa-edit text-xs"></i>
                       </button>
                    </div>
                  </div>
                  <h3 className={`text-xl font-black leading-tight mb-4 transition-colors ${selectedPoll?.id === poll.id ? 'text-indigo-600' : 'text-slate-800'}`}>{poll.pregunta}</h3>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <p><i className="fas fa-calendar-alt mr-2"></i> Inicio: {new Date(poll.fechaInicio).toLocaleDateString()}</p>
                     <p className="text-right"><i className="fas fa-users mr-2"></i> {allResponses.filter(r => r.pollId === poll.id).length} Votos Totales</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-5">
           <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 min-h-[500px] sticky top-8 flex flex-col">
              {!selectedPoll ? (
                <div className="flex-1 flex flex-col items-center justify-center text-indigo-300 opacity-50 text-center space-y-4 py-20">
                  <i className="fas fa-chart-pie text-6xl"></i>
                  <p className="text-xs font-black uppercase tracking-widest">Selecciona una encuesta para ver resultados en vivo</p>
                </div>
              ) : (
                <div className="animate-fadeIn h-full flex flex-col">
                   <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xl font-black leading-tight flex-1">{selectedPoll.pregunta}</h3>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)] mt-2 ml-4"></div>
                   </div>
                   <p className="text-[10px] text-indigo-300 uppercase font-black tracking-widest mb-10">Total de Respuestas: {currentPollResponses.length} Afiliados</p>
                   
                   <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                     {resultsData.map((res, i) => (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                             <span>{res.label}</span>
                             <span className="text-indigo-300">{res.count} ({res.percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-gradient-to-r from-emerald-400 to-indigo-400 rounded-full transition-all duration-1000" 
                               style={{ width: `${res.percentage}%` }}
                             ></div>
                          </div>
                       </div>
                     ))}
                   </div>

                   <div className="pt-10 border-t border-white/10 flex justify-between items-center mt-6">
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> ACTUALIZANDO...
                      </div>
                      <button onClick={() => window.print()} className="text-[10px] font-black uppercase bg-white text-indigo-900 px-6 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">Descargar Reporte</button>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-fadeIn border border-white/20">
              <div className="bg-amber-600 p-8 text-white flex justify-between items-center">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Editor de Encuestas</h3>
                 <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all"><i className="fas fa-times"></i></button>
              </div>
              <div className="p-10 space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pregunta Principal</label>
                    <input type="text" value={editingPoll.pregunta} onChange={e => setEditingPoll({...editingPoll, pregunta: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-amber-500" placeholder="¿Está de acuerdo con...?" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Opciones (separadas por coma)</label>
                    <input type="text" value={editingPoll.opciones?.join(', ')} onChange={e => setEditingPoll({...editingPoll, opciones: e.target.value.split(',').map(o => o.trim())})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-amber-500" placeholder="Sí, No, Abstención" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha Cierre</label>
                       <input type="datetime-local" value={editingPoll.fechaFin} onChange={e => setEditingPoll({...editingPoll, fechaFin: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-amber-500" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Estatus</label>
                       <select value={editingPoll.estatus} onChange={e => setEditingPoll({...editingPoll, estatus: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-amber-500">
                          <option value="Borrador">Borrador</option>
                          <option value="Publicada">Publicada</option>
                          <option value="Finalizada">Finalizada</option>
                       </select>
                    </div>
                 </div>
                 <button onClick={handleSave} disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
                    {isSaving ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
                    Sincronizar Encuesta
                 </button>
              </div>
           </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AdminPolls;
