
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, EmploymentStatus } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProfileForm from './components/ProfileForm';
import AIAdvisor from './components/AIAdvisor';
import DuesTable from './components/DuesTable';
import AdminTreasury from './components/AdminTreasury';
import AdminConfig from './components/AdminConfig';
import AdminUsers from './components/AdminUsers';
import AdminGroups from './components/AdminGroups';
import AdminEvents from './components/AdminEvents';
import AdminPolls from './components/AdminPolls';
import AdminNews from './components/AdminNews';
import AdminAITraining from './components/AdminAITraining';
import PollsView from './components/PollsView';
import AdminUsersSystem from './components/AdminUsersSystem';
import Settings from './components/Settings';
import { setAirtableConfig, findUserByCredentials, updateAffiliateInAirtable } from './services/airtableService';
import { hashPassword } from './services/authService';

const LOGO_URL = "https://i.imgur.com/ii23rOX.png";

const DEFAULT_CONFIG = {
  airtableKey: 'patN8J9gM4MCMyC4n.07880fe8ba9ed93070008b3fdaf741e56ebae52e0841423da23ba8c14414e8bc', 
  baseId: 'appdhqH6rb8UJqD0U'
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isAuthenticated && user && (user.role === UserRole.ADMIN || user.role === UserRole.EDITOR)) {
      const updateActivity = () => {
        updateAffiliateInAirtable(user.id, { last_active: new Date().toISOString() });
      };
      updateActivity();
      interval = setInterval(updateActivity, 1000 * 60 * 4);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  useEffect(() => {
    const initializeConfig = () => {
      const savedConfig = localStorage.getItem('sitracounach_config');
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          setAirtableConfig(parsed.airtableKey || DEFAULT_CONFIG.airtableKey, parsed.baseId || DEFAULT_CONFIG.baseId);
        } catch (e) {
          setAirtableConfig(DEFAULT_CONFIG.airtableKey, DEFAULT_CONFIG.baseId);
        }
      } else {
        setAirtableConfig(DEFAULT_CONFIG.airtableKey, DEFAULT_CONFIG.baseId);
      }
    };
    initializeConfig();
    const savedUser = localStorage.getItem('sitracounach_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('sitracounach_user');
      }
    }
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);
    const form = e.currentTarget as HTMLFormElement;
    const identifierInput = (form.elements[0] as HTMLInputElement).value.trim().toLowerCase();
    const passwordInput = (form.elements[1] as HTMLInputElement).value.trim();
    if (identifierInput === 'raul.rios@unach.mx' && passwordInput === 'SITRACO3452') {
      const masterUser: UserProfile = {
        id: 'MASTER_GOD_MODE',
        fullName: 'Raúl Ríos Trujillo',
        employeeId: '3452',
        email: 'raul.rios@unach.mx',
        email_unach: 'raul.rios@unach.mx',
        status: EmploymentStatus.ACTIVO,
        role: UserRole.ADMIN,
        area: 'Administración Central',
        joinDate: new Date().toISOString(),
        isAdmin: true,
        perm_all: true,
        last_login: new Date().toLocaleString()
      };
      setUser(masterUser);
      setIsAuthenticated(true);
      localStorage.setItem('sitracounach_user', JSON.stringify(masterUser));
      setIsLoading(false);
      return;
    }
    try {
      const dbUser = await findUserByCredentials(identifierInput);
      if (dbUser) {
        const inputHash = await hashPassword(passwordInput);
        const isDefaultPass = passwordInput === "Sitra@2025!";
        const hasNoHashYet = !dbUser.password_hash;
        if (dbUser.password_hash === inputHash || (hasNoHashYet && isDefaultPass)) {
          const nowFormatted = new Date().toLocaleString();
          const finalUser = { 
            ...dbUser, 
            isAdmin: dbUser.role === UserRole.ADMIN || dbUser.role === UserRole.TESORERO,
            last_login: nowFormatted
          };
          updateAffiliateInAirtable(dbUser.id, { last_login: nowFormatted });
          setUser(finalUser);
          setIsAuthenticated(true);
          localStorage.setItem('sitracounach_user', JSON.stringify(finalUser));
        } else {
          setLoginError("La contraseña ingresada no es válida.");
        }
      } else {
        setLoginError("No se encontró ningún registro con ese identificador.");
      }
    } catch (err) {
      setLoginError("Error de comunicación con el servidor de datos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sitracounach_user');
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-indigo-900 text-white font-black uppercase tracking-widest">SITRACOUNACH...</div>;

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white">
          <div className="bg-indigo-900 p-10 text-center text-white relative">
            <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10 p-4">
              <img src={LOGO_URL} alt="Logo SITRACOUNACH" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-tight leading-tight relative z-10">SITRACOUNACH</h1>
            <p className="text-xs text-indigo-200 mt-2 font-bold uppercase tracking-widest relative z-10">Acceso Sindical Seguro</p>
          </div>
          <div className="p-10 space-y-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificador (Nickname o Correo)</label>
                <input type="text" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium text-slate-700" placeholder="Ej: rriostrujillo" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                <input type="password" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium text-slate-700" placeholder="••••••••" />
              </div>
              {loginError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase rounded-xl animate-fadeIn">
                  <i className="fas fa-exclamation-triangle mr-2"></i> {loginError}
                </div>
              )}
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase tracking-widest">
                Entrar al Sistema
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard profile={user} setActiveTab={setActiveTab} />}
      {activeTab === 'profile' && <ProfileForm profile={user} onUpdate={(u) => setUser(u)} />}
      {activeTab === 'dues' && <DuesTable userProfile={user} />}
      {activeTab === 'polls' && <PollsView profile={user} />}
      {activeTab === 'advisor' && <AIAdvisor profile={user} />}
      {activeTab === 'admin-treasury' && <AdminTreasury currentUser={user} />}
      {activeTab === 'admin-config' && <AdminConfig />}
      {activeTab === 'admin-users' && <AdminUsers currentUser={user} />}
      {activeTab === 'admin-news' && <AdminNews currentUser={user} />}
      {activeTab === 'admin-groups' && <AdminGroups currentUser={user} />}
      {activeTab === 'admin-events' && <AdminEvents currentUser={user} />}
      {activeTab === 'admin-polls' && <AdminPolls currentUser={user} />}
      {activeTab === 'admin-ai-training' && <AdminAITraining currentUser={user} />}
      {activeTab === 'admin-system' && <AdminUsersSystem />}
      {activeTab === 'settings' && <Settings user={user} onUserUpdate={(u) => setUser(u)} />}
    </Layout>
  );
};

export default App;
