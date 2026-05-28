import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Clock, TrendingUp, BarChart3, Store, ShieldCheck, ArrowLeft, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StoreHourlyView from '@/components/hourly/StoreHourlyView';
import ManagerPanel from '@/components/hourly/ManagerPanel';
import SidebarNav from '@/components/SidebarNav';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22];

function extractCode(name) {
  if (!name) return name;
  const m = String(name).toUpperCase().match(/(BTA|TUNJA|BOGOTA)\s*(\d+)/);
  if (m) {
    const prefix = m[1] === 'BOGOTA' ? 'BTA' : m[1];
    return `${prefix} ${m[2]}`;
  }
  return String(name).replace(/\s*\([^)]*\)/g, '').trim();
}

// Obtener el código de tienda de la sesión activa (siempre normalizado)
function getSessionStoreCode() {
  try {
    const session = JSON.parse(localStorage.getItem('popsySession') || '{}');
    const raw = session.store || null;
    return raw ? extractCode(raw) : null;
  } catch { return null; }
}

function getSessionRole() {
  try {
    return localStorage.getItem('userRole') || null;
  } catch { return null; }
}

export default function HourlyTransactions() {
  const sessionStore = getSessionStoreCode();
  const sessionRole = getSessionRole();
  const isGerente = sessionRole === 'gerente';

  const [view, setView] = useState(() => {
    // Si hay tienda en sesión y NO es gerente → ir directo a la vista de tienda
    if (sessionStore && !isGerente) return 'store';
    return 'home';
  });
  // Permitir que cualquier usuario (no solo gerente) seleccione tienda
  const [selectedStore, setSelectedStore] = useState(() => {
    // Si no hay sesión de tienda, intentar usar el último selectedStore del localStorage
    if (!sessionStore) {
      try { return JSON.parse(localStorage.getItem('hourlySelectedStore') || 'null'); } catch { return null; }
    }
    return null;
  });
  const [search, setSearch] = useState('');
  const [managerCode, setManagerCode] = useState('');
  const [managerError, setManagerError] = useState('');
  const [showManagerLogin, setShowManagerLogin] = useState(false);

  const { data: allRecords = [], isLoading, refetch } = useQuery({
    queryKey: ['storeTransactions'],
    queryFn: () => base44.entities.StoreTransactions.list('-uploaded_at', 1000),
  });

  // Encontrar el store de sesión en los registros (para pasarle al StoreHourlyView)
  const sessionStoreRecord = useMemo(() => {
    if (!sessionStore) return null;
    const sessionCode = extractCode(sessionStore);
    const sessionCodeLower = sessionCode.toLowerCase();
    // Buscar por código exacto, extractCode, o por nombre
    const match = allRecords.find(r => {
      const fc = (r.store_code || '').trim();
      const fn = (r.store_name || '').trim();
      if (fc === sessionCode || extractCode(fn) === sessionCode || extractCode(fc) === sessionCode) return true;
      if (fn.toLowerCase().includes(sessionCodeLower)) return true;
      if (sessionCodeLower.includes(fn.toLowerCase()) && fn.length > 3) return true;
      return false;
    });
    // Usar el store_code del registro encontrado para garantizar coincidencia exacta en el filtro posterior
    const resolvedCode = match ? ((match.store_code || '').trim() || extractCode(match.store_name)) : sessionCode;
    return { code: resolvedCode, name: match?.store_name || sessionStore };
  }, [allRecords, sessionStore]);

  // Agrupar por tienda (solo para gerente)
  const stores = useMemo(() => {
    const map = {};
    allRecords.forEach(r => {
      // Prefer the clean store_code field; fall back to extracting from store_name
      const code = (r.store_code && r.store_code.trim()) ? r.store_code.trim() : extractCode(r.store_name);
      if (!map[code]) {
        map[code] = { code, name: r.store_name, months: new Set(), latestTotal: 0 };
      }
      map[code].months.add(`${r.year}-${r.month}`);
      if (r.total > map[code].latestTotal) map[code].latestTotal = r.total;
    });
    return Object.values(map).sort((a, b) => a.code.localeCompare(b.code));
  }, [allRecords]);

  const filtered = useMemo(() => {
    if (!search.trim()) return stores;
    const s = search.toLowerCase();
    return stores.filter(st => st.code.toLowerCase().includes(s) || st.name.toLowerCase().includes(s));
  }, [stores, search]);

  const handleManagerLogin = () => {
    if (managerCode === '1998') {
      setView('manager');
      setShowManagerLogin(false);
      setManagerCode('');
      setManagerError('');
    } else {
      setManagerError('Código incorrecto');
    }
  };

  // Compute active store
  const activeStore = (view === 'store' && sessionStoreRecord && !selectedStore)
    ? sessionStoreRecord
    : selectedStore;

  // Compute store records
  const storeCode = activeStore ? extractCode(activeStore.code) : null;
  const storeCodeLower = storeCode ? storeCode.toLowerCase() : '';
  const storeRecords = useMemo(() => {
    if (!activeStore || !storeCode) return [];
    return allRecords.filter(r => {
      const fc = (r.store_code || '').trim();
      const fn = (r.store_name || '').trim();
      const fcExtracted = extractCode(fc);
      const fnExtracted = extractCode(fn);
      if (fc === storeCode || fcExtracted === storeCode || fnExtracted === storeCode) return true;
      if (fn.toLowerCase().includes(storeCodeLower)) return true;
      if (storeCodeLower.includes(fn.toLowerCase()) && fn.length > 3) return true;
      const sessionName = (activeStore.name || '').toLowerCase();
      if (sessionName.length > 3 && fn.toLowerCase().includes(sessionName)) return true;
      if (sessionName.length > 3 && sessionName.includes(fn.toLowerCase()) && fn.length > 3) return true;
      return false;
    });
  }, [allRecords, activeStore, storeCode, storeCodeLower]);

  // Determine content
  let mainContent;
  if (isGerente || view === 'manager') {
    mainContent = (
      <ManagerPanel
        onBack={isGerente ? () => window.history.back() : () => setView('home')}
        allRecords={allRecords}
        refetch={refetch}
      />
    );
  } else if (view === 'store' && isLoading) {
    mainContent = (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  } else if (view === 'store' && activeStore) {
    if (!isLoading && storeRecords.length === 0 && allRecords.length > 0) {
      mainContent = (
        <div className="overflow-auto h-full">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold text-lg mb-2">No hay datos para {storeCode}</p>
            <p className="text-slate-400 text-sm mb-8">El gerente debe cargar el reporte. O selecciona otra tienda:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {stores.map((store) => (
                <button
                  key={store.code}
                  onClick={() => { setSelectedStore(store); localStorage.setItem('hourlySelectedStore', JSON.stringify(store)); }}
                  className="bg-white rounded-xl border-2 border-slate-100 p-4 text-left hover:border-slate-900 hover:shadow-md transition-all"
                >
                  <p className="font-black text-slate-900">{store.code}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{store.months.size} meses</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      mainContent = (
        <StoreHourlyView
          key={storeCode}
          storeCode={storeCode}
          storeName={activeStore.name}
          allRecords={storeRecords}
          onBack={() => {
            if (selectedStore) { setView('home'); setSelectedStore(null); }
            else window.history.back();
          }}
        />
      );
    }
  } else {
    // Store selector view
    mainContent = (
      <div className="overflow-auto h-full">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Transacciones por Hora</h1>
              <p className="text-xs text-slate-500">Análisis de rendimiento horario</p>
            </div>
          </div>
          <button
            onClick={() => setShowManagerLogin(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Acceso Gerente
          </button>
        </div>
      </div>

      {/* Manager Login Modal */}
      <AnimatePresence>
        {showManagerLogin && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowManagerLogin(false); setManagerCode(''); setManagerError(''); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Acceso Gerente</h2>
                <p className="text-sm text-slate-500 mt-1">Ingresa tu código de acceso</p>
              </div>
              <input
                type="password"
                placeholder="Código de acceso"
                value={managerCode}
                onChange={e => { setManagerCode(e.target.value); setManagerError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleManagerLogin()}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:border-slate-900 mb-3"
                autoFocus
              />
              {managerError && <p className="text-red-500 text-sm text-center mb-3">{managerError}</p>}
              <button
                onClick={handleManagerLogin}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-all"
              >
                Entrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content — solo gerente llega aquí */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Tiendas Disponibles</h2>
          <p className="text-slate-500">Selecciona una tienda para ver su análisis horario</p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar tienda..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 bg-white text-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              {allRecords.length === 0 ? 'Aún no hay datos cargados. El gerente debe subir el primer reporte.' : 'No se encontraron tiendas.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((store, i) => (
              <motion.div
                key={store.code}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { setSelectedStore(store); localStorage.setItem('hourlySelectedStore', JSON.stringify(store)); setView('store'); }}
                className="bg-white rounded-2xl border-2 border-slate-100 p-5 cursor-pointer hover:border-slate-900 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-slate-100 group-hover:bg-slate-900 rounded-xl flex items-center justify-center transition-all">
                    <Store className="w-5 h-5 text-slate-600 group-hover:text-white transition-all" />
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                    {store.months.size} {store.months.size === 1 ? 'mes' : 'meses'}
                  </span>
                </div>
                <p className="font-black text-slate-900 text-lg">{store.code}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{store.name}</p>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Mejor mes: <span className="font-bold text-slate-700">{store.latestTotal.toLocaleString('es-CO')} txn</span></p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <div className="flex-1 min-h-0 overflow-hidden">
        {mainContent}
      </div>
    </div>
  );
}