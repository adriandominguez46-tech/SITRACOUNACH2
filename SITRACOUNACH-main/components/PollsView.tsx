
import React, { useState, useEffect } from 'react';
import { Poll, PollResponse, UserProfile } from '../types';
import { fetchPollsFromAirtable, fetchAllPollResponses, submitPollVote } from '../services/airtableService';

const PollsView: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    console.log("[POLLS VIEW] Sincronizando datos...");
    try {
      const [allPolls, allResponses] = await Promise.all([
        fetchPollsFromAirtable(),
        fetchAllPollResponses()
      ]);
      
      const activePolls = allPolls.filter(p => p.estatus === 'Publicada');
      
      const userMap: Record<string, string> = {};
      activePolls.forEach(p => {
        const userResp = allResponses.find(r => r.pollId === p.id && r.afiliadoId === profile.id);
        if (userResp) {
          userMap[p.id] = userResp.voto;
        }
      });
      
      setUserResponses(userMap);
      setPolls(activePolls);
      console.log("[POLLS VIEW] Carga exitosa.");
    } catch (e) {
      console.error("[POLLS VIEW] Error al cargar:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profile.id]);

  const handleSelectOption = (pollId: string, option: string) => {
    if (votingId === pollId) return;
    setSelectedOptions(prev => ({
      ...prev,
      [pollId]: option
    }));
  };

  const handleVote = async (pollId: string) => {
    const option = selectedOptions[pollId];
    
    console.log(`[VOTACIÓN INICIADA] Encuesta: ${pollId}, Voto: ${option}`);
    
    if (!option) {
      alert("Por favor, selecciona una opción.");
      return;
    }

    if (profile.id === 'MASTER_GOD_MODE') {
      alert("La cuenta maestra no puede votar (no existe en tabla Afiliados).");
      return;
    }

    // Cambiamos el estado de votación inmediatamente para feedback visual
    console.log("[VOTACIÓN] Bloqueando UI...");
    setVotingId(pollId);
    
    try {
      console.log("[VOTACIÓN] Llamando a airtableService.submitPollVote...");
      const success = await submitPollVote(pollId, profile.id, option);
      
      if (success) {
        console.log("[VOTACIÓN] ¡Éxito reportado por el servicio!");
        alert("✅ Voto registrado correctamente.");
        
        // Limpiamos selección local
        setSelectedOptions(prev => {
          const newState = { ...prev };
          delete newState[pollId];
          return newState;
        });
        
        // Recargamos datos para ocultar la encuesta
        await loadData();
      } else {
        console.error("[VOTACIÓN] El servicio reportó fallo.");
        alert("❌ No se pudo guardar el voto. Revisa la consola (F12) para ver el error de Airtable.");
      }
    } catch (err) {
      console.error("[VOTACIÓN] Error fatal en handleVote:", err);
      alert("Error inesperado en la conexión.");
    } finally {
      console.log("[VOTACIÓN] Liberando UI...");
      setVotingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-black text-indigo-900 tracking-tight">Consultas a la Base</h2>
        <p className="text-slate-500 font-medium italic">Tu opinión es fundamental para la democracia de nuestro sindicato</p>
      </div>

      {loading ? (
        <div className="py-20 text-center font-black text-slate-300 uppercase animate-pulse">
           <i className="fas fa-circle-notch animate-spin text-4xl mb-4 block text-indigo-200 mx-auto"></i>
           Accediendo a la urna digital...
        </div>
      ) : polls.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center text-slate-400 italic font-black uppercase text-xs">
          No hay consultas vigentes en este momento.
        </div>
      ) : (
        polls.map(poll => {
          const hasVoted = !!userResponses[poll.id];
          const currentSelection = selectedOptions[poll.id];
          const isVotingNow = votingId === poll.id;
          
          return (
            <div key={poll.id} className={`bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden transition-all ${hasVoted ? 'opacity-90' : 'hover:shadow-2xl'}`}>
              <div className="p-10">
                <div className="flex justify-between items-start mb-6">
                   <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${hasVoted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {hasVoted ? 'Participación Registrada' : 'Consulta Abierta'}
                   </span>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finaliza: {new Date(poll.fechaFin).toLocaleDateString()}</p>
                </div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight mb-4">{poll.pregunta}</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">{poll.descripcion}</p>

                {hasVoted ? (
                  <div className="bg-slate-50 p-8 rounded-2xl border border-emerald-100 flex items-center justify-between animate-fadeIn">
                     <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tu voto registrado:</p>
                        <p className="text-xl font-black text-indigo-600 uppercase">{userResponses[poll.id]}</p>
                     </div>
                     <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <i className="fas fa-check text-xl"></i>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {poll.opciones.map((opt, idx) => {
                        const isSelected = currentSelection === opt;
                        return (
                          <button 
                            key={idx} 
                            onClick={() => handleSelectOption(poll.id, opt)}
                            disabled={isVotingNow}
                            className={`py-5 border-2 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                                : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-400'
                            }`}
                          >
                            <i className={`fas ${isSelected ? 'fa-check-circle' : 'fa-circle'} ${isSelected ? 'text-white' : 'text-indigo-300'}`}></i>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    
                    {currentSelection && (
                      <button 
                        onClick={() => handleVote(poll.id)}
                        disabled={isVotingNow}
                        className={`w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 animate-fadeIn ${isVotingNow ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {isVotingNow ? (
                          <>
                            <i className="fas fa-circle-notch animate-spin text-lg"></i>
                            Sincronizando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane"></i>
                            Enviar Voto a la Urna
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PollsView;
