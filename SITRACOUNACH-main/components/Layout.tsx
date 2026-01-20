
import React from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const isPrivileged = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.TESORERO;
  const isAdmin = user?.role === UserRole.ADMIN;
  
  const navItems = [
    { id: 'dashboard', icon: 'fa-house', label: 'Inicio', mobile: true },
    { id: 'profile', icon: 'fa-id-card', label: 'Perfil', mobile: true },
    { id: 'dues', icon: 'fa-wallet', label: 'Cuotas', mobile: true },
    { id: 'polls', icon: 'fa-check-to-slot', label: 'Votar', mobile: true },
    { id: 'advisor', icon: 'fa-gavel', label: 'Legal', mobile: true },
    { id: 'settings', icon: 'fa-cog', label: 'Ajustes', mobile: true },
  ];

  const adminItems = [
    { id: 'admin-news', icon: 'fa-newspaper', label: 'Noticias' },
    { id: 'admin-users', icon: 'fa-users-cog', label: 'Afiliados' },
    { id: 'admin-treasury', icon: 'fa-file-invoice-dollar', label: 'Tesorería' },
    { id: 'admin-groups', icon: 'fa-users-between-lines', label: 'Grupos' },
    { id: 'admin-events', icon: 'fa-calendar-check', label: 'Eventos' },
    { id: 'admin-polls', icon: 'fa-square-poll-vertical', label: 'Encuestas' },
    { id: 'admin-ai-training', icon: 'fa-brain', label: 'Entrenar IA' }, // NUEVO
    { id: 'admin-system', icon: 'fa-shield-halved', label: 'Gestores' },
    { id: 'admin-config', icon: 'fa-database', label: 'Infraestructura' },
  ];

  const LOGO_URL = "https://i.imgur.com/ii23rOX.png";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-indigo-950 text-white flex-col shadow-2xl z-20">
        <div className="p-8 flex flex-col items-center gap-4 border-b border-white/5">
          <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center p-3 shadow-2xl">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <span className="text-xl font-black tracking-widest block">SITRACOUNACH</span>
            <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-black">Portal Oficial</p>
          </div>
        </div>
        
        <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto no-scrollbar">
          <p className="px-4 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Menú Principal</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/50 scale-[1.02]' : 'text-indigo-200/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={`fas ${item.icon} text-lg w-6`}></i>
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
            </button>
          ))}

          {isPrivileged && (
            <div className="pt-8 space-y-2 pb-10">
              <p className="px-4 text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Administración</p>
              {adminItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all ${
                    activeTab === item.id ? 'bg-amber-600 text-white shadow-xl scale-[1.02]' : 'text-amber-200/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <i className={`fas ${item.icon} text-base w-6`}></i>
                  <span className="text-xs font-bold tracking-tight">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-2xl transition-all font-bold text-sm">
            <i className="fas fa-power-off"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-20 lg:pb-0">
        
        {/* MOBILE HEADER */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <img src={LOGO_URL} className="h-8 w-8 object-contain" alt="Logo" />
             <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">
               {navItems.find(i => i.id === activeTab)?.label || 'Panel'}
             </h2>
          </div>
          <button onClick={() => setActiveTab('settings')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <i className="fas fa-cog"></i>
          </button>
        </header>

        {/* DESKTOP TOP BAR */}
        <header className="hidden lg:flex h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 items-center justify-between px-10 shrink-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
             <h2 className="text-xl font-black text-slate-800 tracking-tight">
               {activeTab.startsWith('admin') ? 'Gestión: ' : ''}{[...navItems, ...adminItems, {id: 'settings', label: 'Ajustes'}].find(i => i.id === activeTab)?.label}
             </h2>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-sm font-black text-slate-900 leading-none">{user?.fullName}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{user?.role}</p>
             </div>
             <img src={user?.fotoUrl || `https://i.pravatar.cc/100?u=${user?.id}`} className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-100 shadow-lg" />
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:p-10 no-scrollbar relative">
          {children}
        </div>

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-2 py-3 z-50 safe-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
           {navItems.slice(0, 5).map(item => (
             <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1.5 px-3 py-1 rounded-2xl transition-all duration-300 ${
                activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'
              }`}
             >
                <i className={`fas ${item.icon} text-xl`}></i>
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
             </button>
           ))}
        </nav>
      </main>
    </div>
  );
};

export default Layout;
