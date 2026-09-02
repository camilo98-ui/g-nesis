import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, TrendingUp, Activity, Target,
  FileText, Snowflake, Clock, BarChart3, LogOut, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tienda', path: 'Dashboard', roles: ['lider', 'embajador', 'gerente'] },
  { icon: TrendingUp, label: 'P&G', path: 'PYGDashboard', roles: ['gerente'] },
  { icon: FileText, label: 'Informe', path: 'SalesReportView', roles: ['lider', 'embajador', 'gerente'] },
  { icon: Clock, label: 'Txn por hora', path: 'HourlyTransactions', roles: ['lider', 'embajador', 'gerente'] },
  { icon: BarChart3, label: 'Participación', path: 'SalesReportView', roles: ['lider', 'embajador', 'gerente'] },
  { icon: Snowflake, label: 'Mapa Nevera', path: 'FreezerMap', roles: ['lider', 'embajador', 'gerente'] },
  { icon: Activity, label: 'Radar Competitivo', path: 'RadarCompetitivo', roles: ['lider', 'gerente'] },
];

function NavItem({ item, isActive, collapsed }) {
  const Icon = item.icon;
  return (
    <Link to={`/${item.path}`} title={collapsed ? item.label : undefined}>
      <motion.div
        whileHover={{ x: collapsed ? 0 : 2 }}
        className="w-full flex items-center gap-2.5 rounded-xl text-left"
        style={{
          padding: collapsed ? '8px 6px' : '10px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          ...(isActive ? {
            background: 'linear-gradient(135deg, rgba(194,24,117,0.10), rgba(194,24,117,0.05))',
            border: '1px solid rgba(194,24,117,0.22)',
            boxShadow: '0 3px 12px rgba(194,24,117,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
          } : {
            border: '1px solid transparent',
          })
        }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={isActive
            ? { background: 'rgba(194,24,117,0.14)', boxShadow: '0 2px 6px rgba(194,24,117,0.15)' }
            : { background: 'rgba(0,0,0,0.03)' }}>
          <Icon style={{ color: isActive ? '#C21875' : '#9ca3af', width: 14, height: 14 }} />
        </div>
        {!collapsed && (
          <>
            <span className="text-[12px] font-semibold flex-1 truncate"
              style={{ color: isActive ? '#C21875' : '#6b7280' }}>
              {item.label}
            </span>
            {isActive && (
              <div className="w-1.5 h-4 rounded-full flex-shrink-0"
                style={{ background: 'linear-gradient(180deg, #C21875, #e11d7a)' }} />
            )}
          </>
        )}
      </motion.div>
    </Link>
  );
}

export default function SidebarNav() {
  const location = useLocation();
  const currentPath = location.pathname.replace('/', '');
  const [collapsed, setCollapsed] = React.useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  };

  const session = (() => {
    try { return JSON.parse(localStorage.getItem('popsySession') || '{}'); } catch { return {}; }
  })();
  const role = session.role || localStorage.getItem('userRole') || 'lider';
  const storeName = session.store || '';

  const filteredNav = NAV_ITEMS.filter(n => n.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem('selectedStore');
    localStorage.removeItem('popsySession');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: collapsed ? 52 : 208 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="hidden lg:flex flex-col h-screen flex-shrink-0 sticky top-0 z-20 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(48px) saturate(160%)',
        borderRight: '1px solid rgba(0,0,0,0.045)',
        boxShadow: '2px 0 24px rgba(0,0,0,0.03)',
      }}>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute top-3 -right-3 z-30 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
        style={{ background: '#fff', border: '1px solid rgba(194,24,117,0.2)' }}
        title={collapsed ? 'Expandir' : 'Contraer'}
      >
        {collapsed
          ? <PanelLeftOpen style={{ color: '#C21875', width: 13, height: 13 }} />
          : <PanelLeftClose style={{ color: '#C21875', width: 13, height: 13 }} />}
      </button>

      {/* Logo */}
      <div className="px-4 pt-5 pb-4 overflow-hidden">
        <img src={LOGO_URL} alt="Popsy" className="h-12 object-contain mb-5" style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.2s' }} />
        {!collapsed && storeName && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
            style={{ background: 'rgba(194,24,117,0.05)', border: '1px solid rgba(194,24,117,0.09)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
              style={{ boxShadow: '0 0 5px rgba(52,211,153,0.7)' }} />
            <span className="text-[10.5px] font-semibold text-slate-500 truncate">{storeName}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 px-2.5 space-y-px overflow-y-auto pb-2">
        <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.14em] px-3 mb-2" style={{ opacity: collapsed ? 0 : 1 }}>{collapsed ? '' : 'Navegación'}</p>
        {filteredNav.map(item => (
          <NavItem key={item.label} item={item} isActive={currentPath === item.path} collapsed={collapsed} />
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-black/5">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10.5px] font-medium text-slate-400 hover:text-slate-600 hover:bg-black/[0.03] transition-all"
          title="Cerrar sesión"
        >
          <LogOut className="w-3 h-3 flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </motion.aside>
  );
}