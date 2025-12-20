import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SmartSearch from '@/components/SmartSearch';
import MotivationalHeader from '@/components/MotivationalHeader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
  Home, LayoutDashboard, Menu, Snowflake, CalendarDays
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from 'framer-motion';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

const NAV_ITEMS = [
  { name: '', page: 'FreezerMap', icon: Snowflake, isIcon: true },
  { name: '', page: 'Home', icon: Home, isIcon: true },
  { name: '', page: 'PopsyPlanner', icon: CalendarDays, isIcon: true },
  { name: '', page: 'Management', icon: LayoutDashboard, isIcon: true },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [userRole, setUserRole] = useState('lider');

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    const savedRole = localStorage.getItem('userRole');
    if (saved) setSelectedStore(saved);
    if (savedRole) setUserRole(savedRole);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        {/* Motivational Banner - Pastel muy suave */}
        <div className="fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-pink-50/70 via-rose-50/60 to-amber-50/70 z-50 border-b border-pink-100/50">
          <MotivationalHeader />
        </div>

      {/* Top Header Bar */}
      <header className="fixed top-8 left-0 right-0 h-14 bg-white border-b border-gray-100 z-50 px-4 flex items-center justify-between shadow-sm">
        {/* Logo izquierda y ubicación */}
        <div className="flex items-center gap-3">
          {currentPageName !== 'Home' && (
            <Link to={createPageUrl('Home')} className="flex items-center">
              <motion.img 
                src={LOGO_URL} 
                alt="Popsy" 
                className="h-8 md:h-10 object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </Link>
          )}
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <span>📍</span>
            <span className="hidden sm:inline">Bogotá Noroccidente</span>
          </div>
        </div>

        {/* Center Nav - Visible en todos los dispositivos */}
        <nav className="flex items-center gap-1 justify-center absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            
            // Restricciones por rol - Embajador tiene acceso al mapa
            const isLocked = (userRole === 'calidad' && (item.page === 'FreezerMap' || item.page === 'Management')) ||
                            (userRole === 'c_interno' && item.page !== 'Home' && item.page !== 'PopsyPlanner');
            
            if (isLocked) {
              return (
                <motion.div
                  key={item.page}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="transition-all duration-200 w-10 h-10 text-gray-300 cursor-not-allowed opacity-50"
                  >
                    <Icon className="w-5 h-5" />
                  </Button>
                </motion.div>
              );
            }
            
            return (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                  variant="ghost"
                  size="icon"
                  className={`transition-all duration-200 w-10 h-10 ${isActive 
                    ? item.page === 'Home' 
                                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' 
                                                : item.page === 'FreezerMap'
                                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                                                  : item.page === 'Management'
                                                    ? 'bg-gradient-to-r from-slate-600 to-gray-700 text-white shadow-lg'
                                                    : item.page === 'PopsyPlanner'
                                                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                                      : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                                              : item.page === 'FreezerMap'
                                                ? 'text-cyan-500 hover:text-cyan-600 hover:bg-cyan-50'
                                                : item.page === 'Home'
                                                  ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50'
                                                  : item.page === 'Management'
                                                    ? 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'
                                                    : item.page === 'PopsyPlanner'
                                                      ? 'text-violet-500 hover:text-violet-600 hover:bg-violet-50'
                                                      : 'text-teal-500 hover:text-teal-600 hover:bg-teal-50'}`}
                  >
                  <Icon className="w-5 h-5" />
                  </Button>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 h-full">
          <div className="flex items-center h-full">
            <SmartSearch storeId={selectedStore} />
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              localStorage.removeItem('selectedStore');
              localStorage.removeItem('popsySession');
              window.location.href = '/Home';
            }}
            className="rounded-full text-gray-400 hover:text-pink-500 hover:bg-pink-50"
            title="Cerrar sesión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="w-6 h-6 text-gray-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-white">
              <div className="mt-4 mb-6">
                <img src={LOGO_URL} alt="Popsy" className="h-12 object-contain" />
              </div>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.page;
                  const itemName = item.page === 'FreezerMap' ? 'Mapa Nevera' : item.page === 'Home' ? 'Inicio' : item.page === 'Management' ? 'Gerencia' : item.page === 'PopsyPlanner' ? 'Planner' : 'Calidad';
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileOpen(false)}
                    >
                      <motion.div
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive 
                            ? item.page === 'FreezerMap' 
                                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                                                                : item.page === 'Home'
                                                                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                                                                  : item.page === 'Management'
                                                                    ? 'bg-gradient-to-r from-slate-600 to-gray-700 text-white'
                                                                    : item.page === 'PopsyPlanner'
                                                                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                                                                      : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                            : 'text-gray-600 hover:bg-pink-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{itemName}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

        {/* Main Content */}
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="pt-[88px] min-h-screen pb-4 relative"
        >
          {/* Animated gradient background */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                background: [
                  'radial-gradient(circle at 20% 30%, rgba(252, 231, 243, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 70%, rgba(243, 232, 255, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 40% 60%, rgba(254, 243, 199, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 30%, rgba(252, 231, 243, 0.3) 0%, transparent 50%)',
                ]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            />
          </div>

          <motion.div 
            className="container mx-auto px-2 sm:px-4"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </motion.main>
      </div>
    </ErrorBoundary>
  );
}