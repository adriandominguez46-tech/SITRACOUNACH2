
import React, { useState, useEffect, useMemo } from 'react';
import { LaborEvent, UserProfile, UserRole } from '../types';
import { fetchEventsFromAirtable, createOrUpdateEvent, fetchAffiliatesFromAirtable } from '../services/airtableService';

const AdminEvents: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [events, setEvents] = useState<LaborEvent[]>([]);
  const [affiliates, setAffiliates] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState<Partial<LaborEvent> | null>(null);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<LaborEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendeeSearchTerm, setAttendeeSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const loadData = async () => {
    setLoading(true);
    try {
      const [eData, aData] = await Promise.all([
        fetchEventsFromAirtable(),
        fetchAffiliatesFromAirtable()
      ]);
      setEvents(eData);
      setAffiliates(aData);
    } catch (err) {
      console.error("Error sincronizando eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "Sin fecha";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Fecha no válida" : d.toLocaleString('es-MX', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
  };

  const handleCreate = () => {
    setEditingEvent({
      nombre: '',
      fecha: new Date().toISOString().slice(0, 16),
      fechaCierre: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      lugar: '',
      descripcion: '',
      estatusRegistro: 'Abierto',
      registradosIds: []
    });
    setShowModal(true);
  };

  const handleEdit = (event: LaborEvent) => {
    const formattedEvent = {
      ...event,
      fecha: event.fecha ? new Date(event.fecha).toISOString().slice(0, 16) : '',
      fechaCierre: event.fechaCierre ? new Date(event.fechaCierre).toISOString().slice(0, 16) : ''
    };
    setEditingEvent(formattedEvent);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingEvent?.nombre || !editingEvent?.fecha) return alert("Nombre y fecha son obligatorios");
    setIsSaving(true);
    
    const eventToSave = {
      ...editingEvent,
      fecha: editingEvent.fecha ? new Date(editingEvent.fecha).toISOString() : '',
      fechaCierre: editingEvent.fechaCierre ? new Date(editingEvent.fechaCierre).toISOString() : ''
    };

    const success = await createOrUpdateEvent(eventToSave);
    if (success) {
      alert("Evento sincronizado correctamente.");
      setShowModal(false);
      loadData();
    }
    setIsSaving(false);
  };

  const handleToggleEstatus = async (event: LaborEvent) => {
    const newEstatus = event.estatusRegistro === 'Abierto' ? 'Cerrado' : 'Abierto';
    const success = await createOrUpdateEvent({ ...event, estatusRegistro: newEstatus });
    if (success) loadData();
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter(e => {
      const matchSearch = e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || e.lugar.toLowerCase().includes(searchTerm.toLowerCase());
      const eventDate = new Date(e.fecha);
      if (filterType === 'upcoming') return matchSearch && (isNaN(eventDate.getTime()) || eventDate >= now);
      if (filterType === 'past') return matchSearch && !isNaN(eventDate.getTime()) && eventDate < now;
      return matchSearch;
    });
  }, [events, searchTerm, filterType]);

  const attendeesList = useMemo(() => {
    if (!selectedEventForAttendees) return [];
    return affiliates.filter(a => 
      selectedEventForAttendees.registradosIds.includes(a.id) &&
      (a.fullName.toLowerCase().includes(attendeeSearchTerm.toLowerCase()) || a.employeeId.includes(attendeeSearchTerm))
    );
  }, [selectedEventForAttendees, affiliates, attendeeSearchTerm]);

  // Helper para obtener fotos de los asistentes confirmados
  const getAttendeePhotos = (ids: string[]) => {
    return affiliates
      .filter(a => ids.includes(a.id))
      .map(a => a.fotoUrl || `https://i.pravatar.cc/50?u=${a.id}`)
      .slice(0, 5);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20 px-4">
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-black text-indigo-950 tracking-tighter">Eventos Sindicales</h2>
            <p className="text-slate-500 font-medium italic">Gestión de asistencia y logística de base</p>
          </div>
          <div className="flex gap-4">
              <button onClick={handleCreate} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                 <i className="fas fa-calendar-plus"></i> Crear evento
              </button>
              <button onClick={loadData} className="bg-white border-2 border-indigo-100 text-indigo-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all">
                 <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
              </button>
          </div>
        </div>
        
        <div className="flex gap-2">
           {['upcoming', 'past', 'all'].map(t => (
             <button 
               key={t}
               onClick={() => setFilterType(t as any)}
               className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-indigo-900 text-white' : 'bg-slate-100 text-slate-400'}`}
             >
               {t === 'upcoming' ? 'Próximos' : t === 'past' ? 'Pasados' : 'Todos'}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Evento / Fecha / Lugar</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Registro</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asistentes</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="p-32 text-center font-black text-slate-300 uppercase animate-pulse">Sincronizando con base de datos...</td></tr>
            ) : filteredEvents.length === 0 ? (
              <tr><td colSpan={4} className="p-32 text-center text-slate-400 italic font-black text-[10px] uppercase tracking-widest">No hay eventos para mostrar</td></tr>
            ) : filteredEvents.map(event => {
              const cierreDate = new Date(event.fechaCierre);
              const isExpired = !isNaN(cierreDate.getTime()) && new Date() > cierreDate;
              const estatusEfectivo = isExpired ? 'Cerrado' : event.estatusRegistro;
              const photos = getAttendeePhotos(event.registradosIds);
              
              return (
                <tr key={event.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-10 py-8">
                    <p className="font-black text-indigo-950 text-lg mb-2 leading-tight">{event.nombre}</p>
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] text-slate-500 font-bold flex items-center gap-2 uppercase tracking-wide">
                        <i className="fas fa-calendar-day text-indigo-400"></i> {formatDateLabel(event.fecha)}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-2 uppercase tracking-wide">
                        <i className="fas fa-map-marker-alt text-rose-400"></i> {event.lugar}
                      </p>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <button 
                      onClick={() => handleToggleEstatus(event)}
                      className={`text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border transition-all ${
                        estatusEfectivo === 'Abierto' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {estatusEfectivo}
                    </button>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                       <div className="flex -space-x-3 overflow-hidden">
                         {photos.map((src, idx) => (
                           <img key={idx} className="inline-block h-10 w-10 rounded-full ring-4 ring-white object-cover" src={src} alt={`Attendee ${idx}`} />
                         ))}
                         {event.registradosIds.length > 5 && (
                           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500 ring-4 ring-white">
                             +{event.registradosIds.length - 5}
                           </div>
                         )}
                       </div>
                       <button 
                         onClick={() => { setSelectedEventForAttendees(event); setShowAttendeesModal(true); }}
                         className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                       >
                         {event.registradosIds.length} confirmados
                       </button>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                     <button onClick={() => handleEdit(event)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        <i className="fas fa-edit"></i>
                     </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL LISTA DE ASISTENTES DETALLADA */}
      {showAttendeesModal && selectedEventForAttendees && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[250] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-fadeIn border border-white/20">
              <div className="bg-indigo-900 p-8 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Afiliados Confirmados</h3>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase mt-1">Evento: {selectedEventForAttendees.nombre}</p>
                 </div>
                 <button onClick={() => setShowAttendeesModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all">
                    <i className="fas fa-times"></i>
                 </button>
              </div>
              <div className="p-8">
                 <div className="relative mb-6">
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre, plaza o dependencia..." 
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-500"
                      value={attendeeSearchTerm}
                      onChange={e => setAttendeeSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                    {attendeesList.length === 0 ? (
                      <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">
                        {selectedEventForAttendees.registradosIds.length > 0 ? 'Sin coincidencias en la búsqueda.' : 'No hay confirmaciones aún.'}
                      </div>
                    ) : attendeesList.map(a => (
                      <div key={a.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-indigo-200 transition-colors">
                         <img src={a.fotoUrl || `https://i.pravatar.cc/100?u=${a.id}`} className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md" />
                         <div>
                            <p className="text-[11px] font-black text-indigo-950 leading-tight">{a.fullName}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Plaza: {a.employeeId}</p>
                            <p className="text-[8px] text-indigo-400 font-black uppercase mt-0.5 truncate max-w-[150px]">{a.dependencia || 'Admón. Central'}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900 hover:text-white transition-all">
                  Descargar Lista (PDF)
                </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {showModal && editingEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-fadeIn border border-white/20">
              <div className="bg-indigo-900 p-10 text-white flex justify-between items-center">
                 <h3 className="text-2xl font-black uppercase tracking-tight">{editingEvent.id ? 'Modificar Evento' : 'Programar Nuevo Evento'}</h3>
                 <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all">
                    <i className="fas fa-times text-xl"></i>
                 </button>
              </div>
              <div className="p-12 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre oficial del evento</label>
                    <input type="text" value={editingEvent.nombre} onChange={e => setEditingEvent({...editingEvent, nombre: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-black focus:border-indigo-500 outline-none transition-all" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha y Hora</label>
                       <input type="datetime-local" value={editingEvent.fecha} onChange={e => setEditingEvent({...editingEvent, fecha: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-black focus:border-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest ml-1">Cierre de Registro</label>
                       <input type="datetime-local" value={editingEvent.fechaCierre} onChange={e => setEditingEvent({...editingEvent, fechaCierre: e.target.value})} className="w-full px-6 py-4 bg-rose-50 border-2 border-rose-100 rounded-[1.5rem] text-sm font-black focus:border-rose-500 outline-none transition-all" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación / Sede</label>
                    <input type="text" value={editingEvent.lugar} onChange={e => setEditingEvent({...editingEvent, lugar: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-black focus:border-indigo-500 outline-none transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción y detalles</label>
                    <textarea value={editingEvent.descripcion} onChange={e => setEditingEvent({...editingEvent, descripcion: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-medium focus:border-indigo-500 outline-none transition-all h-32 resize-none" />
                 </div>
              </div>
              <div className="p-10 bg-slate-50 border-t border-slate-200 flex gap-5">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-5 bg-white text-slate-400 font-black rounded-[1.5rem] border-2 border-slate-200 hover:bg-slate-100 transition-all text-[11px] uppercase tracking-widest">Descartar</button>
                 <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] shadow-2xl hover:bg-indigo-700 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-3">
                    {isSaving ? <i className="fas fa-circle-notch animate-spin text-lg"></i> : <i className="fas fa-cloud-upload-alt text-lg"></i>}
                    {isSaving ? 'Sincronizando...' : 'Publicar Evento'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
