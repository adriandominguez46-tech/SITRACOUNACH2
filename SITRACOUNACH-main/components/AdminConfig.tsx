
import React, { useState, useEffect } from 'react';
import { setAirtableConfig } from '../services/airtableService';

const AdminConfig: React.FC = () => {
  const [config, setConfig] = useState({
    airtableKey: '',
    baseId: 'appdhqH6rb8UJqD0U',
    monthlyAmount: '50'
  });

  useEffect(() => {
    const saved = localStorage.getItem('sitracounach_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    if (!config.airtableKey.startsWith('pat')) {
      alert("Error: El Token debe iniciar con 'pat'");
      return;
    }
    setAirtableConfig(config.airtableKey, config.baseId);
    localStorage.setItem('sitracounach_config', JSON.stringify(config));
    alert("Infraestructura sincronizada y guardada correctamente.");
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tight">Infraestructura</h2>
          <p className="text-indigo-200 font-medium">Configuración de Bases de Datos (Airtable)</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <i className="fas fa-table text-indigo-500"></i> Conexión con Airtable
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Personal Access Token (PAT)</label>
              <input 
                type="text" 
                value={config.airtableKey}
                onChange={e => setConfig({...config, airtableKey: e.target.value})}
                className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="pat..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Base ID</label>
              <input 
                type="text" 
                value={config.baseId}
                onChange={e => setConfig({...config, baseId: e.target.value})}
                className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="appXXXXXXXXXXXX"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <i className="fas fa-coins text-amber-500"></i> Parámetros de Cuota
          </h3>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Monto Mensual ($ MXN)</label>
            <input 
              type="number" 
              value={config.monthlyAmount}
              onChange={e => setConfig({...config, monthlyAmount: e.target.value})}
              className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button 
            onClick={handleSave}
            className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center gap-2"
          >
            <i className="fas fa-sync-alt"></i>
            Sincronizar Cambios
          </button>
        </div>

        <div className="p-6 bg-slate-100 rounded-2xl flex gap-4 items-center border border-slate-200">
          <i className="fas fa-shield-check text-emerald-500 text-xl"></i>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Se ha validado la estructura del token. El sistema está operando con la infraestructura vinculada.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminConfig;
