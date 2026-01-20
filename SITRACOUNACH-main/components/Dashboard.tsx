
import React, { useEffect, useState } from 'react';
import { UserProfile, LaborEvent, Poll, NewsPost, PollResponse } from '../types';
import { fetchEventsFromAirtable, toggleEventRegistration, fetchPollsFromAirtable, fetchAllPollResponses, fetchNewsFromAirtable } from '../services/airtableService';

interface DashboardProps {
  profile: UserProfile;
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, setActiveTab }) => {
  const [events, setEvents] = useState<LaborEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [responses, setResponses] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, pollsRes, allResponses, newsRes] = await Promise.all([
        fetchEventsFromAirtable(),
        fetchPollsFromAirtable(),
        fetchAllPollResponses(),
        fetchNewsFromAirtable()
      ]);
      
      setEvents(eventsRes.slice(0, 5));
      setPolls(pollsRes.filter(p => p.estatus === 'Publicada'));
      setResponses(allResponses);
      setNews(newsRes);
    } catch (e) {
      console.error("[DASHBOARD] Error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleConfirm = async (event: LaborEvent) => {
    const isNowRegistered = !event.registradosIds.includes(profile.id);
    const success = await toggleEventRegistration(event.id, profile.id, event.registradosIds);
    if (success) {
      setEvents(events.map(e => e.id === event.id ? {
        ...e,
        registradosIds: isNowRegistered ? [...e.registradosIds, profile.id] : e.registradosIds.filter(id => id !== profile.id)
      } : e));
    }
  };

  const stats = [
    { label: 'Estatus', value: profile.role, color: 'text-indigo-600', icon: 'fa-id-badge', bg: 'bg-indigo-50' },
    { label: 'Situación', value: profile.status, color: 'text-emerald-600', icon: 'fa-briefcase', bg: 'bg-emerald-50' },
    { label: 'Antigüedad', value: '3+ Años', color: 'text-amber-600', icon: 'fa-calendar-check', bg: 'bg-amber-50' },
    { label: 'Dependencia', value: profile.dependencia || 'General', color: 'text-rose-600', icon: 'fa-university', bg: 'bg-rose-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 animate-fadeIn">
      
      {/* 1. BIENVENIDA */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          ¡Hola, {profile.fullName.split(' ')[0]}!
        </h2>
        <p className="text-sm text-slate-500 font-medium">Resumen sindical para el {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}</p>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-5 transition-all hover:shadow-lg">
            <div className={`w-10 h-10 md:w-14 md:h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-base md:text-xl shrink-0`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div className="text-center md:text-left overflow-hidden w-full">
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-[11px] md:text-sm font-black text-slate-800 truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. LAYOUT PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        
        {/* COLUMNA NOTICIAS */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
                <i className="fas fa-bullhorn text-indigo-600"></i> Comunicados
              </h3>
           </div>

           <div className="space-y-6 md:space-y-10">
             {loading ? (
               <div className="p-20 text-center text-slate-300 animate-pulse font-black uppercase text-xs">Cargando noticias...</div>
             ) : news.length === 0 ? (
               <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-200">Sin noticias</div>
             ) : (
               news.map(post => (
                 <article key={post.id} className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-50 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 group">
                    {post.imagenUrl && (
                      <div className="w-full h-56 md:h-[400px] overflow-hidden relative">
                        <img src={post.imagenUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={post.titulo} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </div>
                    )}
                    <div className="p-6 md:p-12">
                       <div className="flex items-center gap-3 mb-4">
                          <span className="text-[8px] md:text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{post.autor}</span>
                          <span className="text-[8px] md:text-[10px] text-slate-400 font-bold italic">{new Date(post.fecha).toLocaleDateString()}</span>
                       </div>
                       <h4 className="text-xl md:text-3xl font-black text-slate-900 mb-4 md:mb-6 leading-tight group-hover:text-indigo-600 transition-colors">{post.titulo}</h4>
                       <div className="text-slate-600 leading-relaxed text-sm md:text-lg line-clamp-3 md:line-clamp-4 mb-6 md:mb-8 prose prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: post.contenido }}></div>
                       <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                          <button className="text-[10px] md:text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                             Leer más <i className="fas fa-arrow-right"></i>
                          </button>
                       </div>
                    </div>
                 </article>
               ))
             )}
           </div>
        </div>

        {/* BARRA LATERAL */}
        <div className="lg:col-span-4 space-y-8 md:space-y-12 pb-10">
          
          {/* EVENTOS - LÓGICA DE REGISTRO ACTUALIZADA */}
          <section className="space-y-5">
             <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter px-1 flex items-center gap-3">
                <i className="fas fa-calendar-alt text-rose-500"></i> Agenda
             </h3>
             <div className="space-y-4">
                {events.map(event => {
                  const isRegistered = event.registradosIds.includes(profile.id);
                  return (
                    <div key={event.id} className={`p-5 md:p-6 rounded-[2rem] border transition-all ${isRegistered ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                       <div className="flex items-center justify-between mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isRegistered ? 'bg-emerald-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                             {new Date(event.fecha).getDate()}
                          </div>
                          <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase ${isRegistered ? 'text-emerald-600' : 'text-slate-400'}`}>
                             {isRegistered ? 'Asistencia Confirmada' : 'Abierto'}
                          </span>
                       </div>
                       <h4 className="font-black text-slate-800 text-sm mb-4 leading-tight">{event.nombre}</h4>
                       
                       {/* EL BOTÓN DESAPARECE SI YA ESTÁ REGISTRADO */}
                       {!isRegistered ? (
                         <button 
                          onClick={() => handleConfirm(event)}
                          className="w-full py-3 bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                         >
                           Confirmar asistencia
                         </button>
                       ) : (
                         <div className="flex items-center justify-center gap-2 py-3 bg-white/50 border border-emerald-200 rounded-xl text-emerald-600 font-black text-[9px] uppercase">
                            <i className="fas fa-check-circle"></i> Confirmación registrada.
                         </div>
                       )}
                    </div>
                  )
                })}
             </div>
          </section>

          {/* ENCUESTAS */}
          <section className="space-y-5">
             <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter px-1 flex items-center gap-3">
                <i className="fas fa-vote-yea text-amber-500"></i> Consultas
             </h3>
             <div className="space-y-4">
                {polls.map(poll => {
                  const hasVoted = responses.some(r => r.pollId === poll.id && r.afiliadoId === profile.id);
                  return (
                    <div key={poll.id} className={`p-6 rounded-[2.5rem] border transition-all ${hasVoted ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                       <h4 className="text-sm font-black text-slate-800 mb-4 leading-snug">{poll.pregunta}</h4>
                       {hasVoted ? (
                         <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                            <i className="fas fa-check-circle"></i> Voto Registrado
                         </div>
                       ) : (
                         <button 
                          onClick={() => setActiveTab('polls')}
                          className="w-full py-3 bg-amber-600 text-white text-[9px] font-black rounded-xl uppercase tracking-widest hover:bg-black transition-all"
                         >
                           Votar ahora
                         </button>
                       )}
                    </div>
                  )
                })}
             </div>
          </section>

          {/* CTA ASESORÍA IA */}
          <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
             <div className="relative z-10">
                <h4 className="text-xl font-black mb-2">Asesor IA</h4>
                <p className="text-indigo-200 text-xs mb-6 font-medium">Consultas legales inmediatas sobre el CCT.</p>
                <button 
                  onClick={() => setActiveTab('advisor')}
                  className="w-full py-4 bg-white text-indigo-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl"
                >
                  Iniciar Chat Legal
                </button>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
