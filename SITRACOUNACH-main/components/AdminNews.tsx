
import React, { useState, useEffect } from 'react';
import { NewsPost, UserProfile } from '../types';
import { fetchNewsFromAirtable, createOrUpdateNews, deleteNewsFromAirtable } from '../services/airtableService';
import { uploadToCloudinary } from '../services/cloudinaryService';

const AdminNews: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [editingPost, setEditingPost] = useState<Partial<NewsPost>>({
    titulo: '',
    contenido: '',
    imagenUrl: '',
    autor: 'Comité Ejecutivo',
    fecha: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchNewsFromAirtable();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!editingPost.titulo || !editingPost.contenido) return alert("El título y contenido son obligatorios.");
    setIsSaving(true);
    const success = await createOrUpdateNews(editingPost);
    if (success) {
      setShowModal(false);
      loadData();
    }
    setIsSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadToCloudinary(file, "noticias_sindicato");
    if (url) {
      setEditingPost({ ...editingPost, imagenUrl: url });
    }
    setUploadingImage(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este comunicado?")) return;
    const success = await deleteNewsFromAirtable(id);
    if (success) loadData();
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-4xl font-black text-indigo-900 tracking-tighter">Gestión de Comunicados</h2>
          <p className="text-slate-500 font-medium italic">Plataforma de noticias internas SITRACOUNACH</p>
        </div>
        <button 
          onClick={() => { setEditingPost({ titulo: '', contenido: '', imagenUrl: '', autor: 'Comité Ejecutivo', fecha: new Date().toISOString().split('T')[0] }); setShowModal(true); }}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 uppercase tracking-widest"
        >
          <i className="fas fa-plus-circle"></i> Redactar Noticia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-40 text-center font-black text-slate-300 uppercase animate-pulse tracking-widest">Sincronizando portal de noticias...</div>
        ) : posts.length === 0 ? (
          <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400 font-black uppercase text-xs">Sin noticias en el historial</div>
        ) : posts.map(post => (
          <div key={post.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-2xl transition-all">
            <div className="h-48 overflow-hidden relative">
              <img src={post.imagenUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600&auto=format&fit=crop"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute top-4 right-4 flex gap-2">
                 <button onClick={() => { setEditingPost(post); setShowModal(true); }} className="w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-edit text-xs"></i></button>
                 <button onClick={() => handleDelete(post.id)} className="w-8 h-8 rounded-lg bg-white text-rose-500 flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
              </div>
            </div>
            <div className="p-8 flex flex-col flex-1">
               <div className="flex justify-between items-center mb-3">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{post.autor}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">{new Date(post.fecha).toLocaleDateString()}</span>
               </div>
               <h3 className="text-lg font-black text-slate-900 mb-4 line-clamp-2 leading-tight">{post.titulo}</h3>
               <div className="text-xs text-slate-500 line-clamp-3 mb-6 flex-1" dangerouslySetInnerHTML={{ __html: post.contenido.substring(0, 150) + '...' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EDITOR DE BLOG */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
              <div className="bg-indigo-900 p-8 text-white flex justify-between items-center shrink-0">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Editor de Noticias Institucionales</h3>
                 <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all shadow-lg border border-white/10">
                    <i className="fas fa-times text-xl"></i>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título del Comunicado</label>
                          <input 
                            type="text" 
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-base outline-none focus:border-indigo-500 transition-all"
                            value={editingPost.titulo}
                            onChange={e => setEditingPost({...editingPost, titulo: e.target.value})}
                            placeholder="Escriba el titular..."
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Autor / Departamento</label>
                             <input type="text" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-indigo-500" value={editingPost.autor} onChange={e => setEditingPost({...editingPost, autor: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Publicación</label>
                             <input type="date" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-indigo-500" value={editingPost.fecha} onChange={e => setEditingPost({...editingPost, fecha: e.target.value})} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imagen de Portada (Cloudinary)</label>
                          <div className="relative h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] overflow-hidden flex items-center justify-center group">
                             {editingPost.imagenUrl ? (
                               <img src={editingPost.imagenUrl} className="w-full h-full object-cover" />
                             ) : (
                               <i className={`fas ${uploadingImage ? 'fa-circle-notch animate-spin' : 'fa-image'} text-4xl text-slate-200`}></i>
                             )}
                             <label className="absolute inset-0 bg-indigo-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Cambiar Imagen</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                             </label>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2 flex flex-col h-full">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contenido (HTML/Links/Embeds)</label>
                          <textarea 
                            className="flex-1 w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-medium text-sm outline-none focus:border-indigo-500 resize-none font-mono"
                            value={editingPost.contenido}
                            onChange={e => setEditingPost({...editingPost, contenido: e.target.value})}
                            placeholder="Escriba el cuerpo de la noticia. Acepta HTML para enlaces y embebidos..."
                          />
                       </div>
                    </div>
                 </div>

                 {/* VISTA PREVIA PROFESIONAL */}
                 <div className="pt-10 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Vista Previa Profesional</h4>
                    <div className="max-w-3xl mx-auto bg-slate-50 p-10 rounded-[3rem] shadow-inner prose prose-slate max-w-none">
                       <h1 className="text-3xl font-black text-slate-900">{editingPost.titulo || 'Titular de la noticia'}</h1>
                       <div className="flex gap-4 items-center not-prose mb-8">
                          <span className="text-[9px] font-black uppercase bg-indigo-600 text-white px-3 py-1 rounded-full">{editingPost.autor}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{new Date(editingPost.fecha || Date.now()).toLocaleDateString()}</span>
                       </div>
                       <div className="text-slate-700 leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: editingPost.contenido || 'Comience a escribir su comunicado...' }}></div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-200 flex gap-4 shrink-0">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-5 bg-white text-slate-400 font-black rounded-2xl border-2 border-slate-200 hover:bg-slate-100 transition-all text-xs uppercase tracking-widest">Cancelar</button>
                 <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl hover:bg-black transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                    {isSaving ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-save"></i>}
                    {isSaving ? 'Publicando...' : 'Guardar y Publicar Comunicado'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AdminNews;
