import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SmartSearch from '@/components/SmartSearch';
import MotivationalHeader from '@/components/MotivationalHeader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
  Home, LayoutDashboard, Menu, Snowflake, CalendarDays, TrendingUp
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from 'framer-motion';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

const NAV_ITEMS = [
  { name: 'Inicio', page: 'Home', icon: Home, isIcon: true },
  { name: 'Planner', page: 'PopsyPlanner', icon: CalendarDays, isIcon: true },
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <span>📍</span>
              <span className="hidden sm:inline">Bogotá Noroccidente</span>
            </div>
          </div>
        </div>

        {/* Center Nav - Visible en todos los dispositivos */}
        <nav className="flex items-center gap-1 justify-center absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            
            // Restricciones por rol
            const isLocked = (userRole === 'calidad' && item.page === 'Management') ||
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
                                                : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                              : item.page === 'Home'
                                                  ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50'
                                                  : 'text-violet-500 hover:text-violet-600 hover:bg-violet-50'}`}
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
                  const itemName = item.name;
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
                            ? item.page === 'Home'
                                                                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                                                                  : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
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
          {/* Ultra Premium Sophisticated Background */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base gradient with depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-pink-900/20" />
            
            {/* Animated mesh gradient */}
            <motion.div
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
                backgroundSize: '100% 100%'
              }}
            />
            
            {/* Large animated orbs with glow */}
            <motion.div
              animate={{
                x: [0, 150, 0],
                y: [0, -100, 0],
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-[5%] w-[700px] h-[700px] bg-gradient-to-br from-pink-500/40 via-rose-500/30 to-purple-500/20 rounded-full blur-[120px]"
              style={{
                boxShadow: '0 0 200px 100px rgba(236, 72, 153, 0.3)',
              }}
            />
            <motion.div
              animate={{
                x: [0, -120, 0],
                y: [0, 100, 0],
                scale: [1, 1.4, 1],
                rotate: [0, -180, -360],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-10 left-[5%] w-[800px] h-[800px] bg-gradient-to-br from-purple-500/40 via-indigo-500/30 to-blue-500/20 rounded-full blur-[120px]"
              style={{
                boxShadow: '0 0 200px 100px rgba(168, 85, 247, 0.3)',
              }}
            />
            <motion.div
              animate={{
                x: [0, 80, 0],
                y: [0, -80, 0],
                scale: [1, 1.25, 1],
                rotate: [0, 120, 240],
              }}
              transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[35%] left-[45%] w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/30 via-blue-500/25 to-purple-500/20 rounded-full blur-[100px]"
              style={{
                boxShadow: '0 0 180px 90px rgba(59, 130, 246, 0.2)',
              }}
            />

            {/* Animated geometric shapes with neon glow */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-[10%] right-[15%] w-64 h-64 border-2 border-pink-400/40 rounded-3xl"
              style={{
                boxShadow: '0 0 40px rgba(236, 72, 153, 0.5), inset 0 0 40px rgba(236, 72, 153, 0.2)',
              }}
            />
            <motion.div
              animate={{
                rotate: [0, -360],
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[20%] left-[20%] w-48 h-48 border-2 border-purple-400/40 rounded-full"
              style={{
                boxShadow: '0 0 40px rgba(168, 85, 247, 0.5), inset 0 0 40px rgba(168, 85, 247, 0.2)',
              }}
            />
            <motion.div
              animate={{
                rotate: [0, 180, 360],
                x: [0, 30, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[55%] right-[25%] w-32 h-32 border-2 border-blue-400/40 rounded-2xl"
              style={{
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 30px rgba(59, 130, 246, 0.2)',
              }}
            />

            {/* Hexagonal pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
                 style={{
                   backgroundImage: 'radial-gradient(circle, rgba(236, 72, 153, 0.8) 1px, transparent 1px)',
                   backgroundSize: '50px 50px',
                 }}
            />

            {/* Dynamic light rays */}
            <motion.div
              animate={{
                opacity: [0.1, 0.3, 0.1],
                rotate: [0, 10, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-gradient-to-b from-pink-500/50 via-purple-500/30 to-transparent"
              style={{
                boxShadow: '0 0 20px 5px rgba(236, 72, 153, 0.3)',
              }}
            />

            {/* Floating glassmorphism particles */}
            <motion.div
              animate={{
                y: [0, -30, 0],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[15%] left-[35%] w-32 h-32 bg-white/10 rounded-full backdrop-blur-xl"
              style={{
                boxShadow: '0 0 40px rgba(255, 255, 255, 0.2)',
              }}
            />
            <motion.div
              animate={{
                y: [0, 40, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[25%] right-[40%] w-24 h-24 bg-white/10 rounded-full backdrop-blur-xl"
              style={{
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.2)',
              }}
            />
            <motion.div
              animate={{
                y: [0, -25, 0],
                x: [0, 15, 0],
                opacity: [0.35, 0.65, 0.35],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-[60%] left-[60%] w-20 h-20 bg-white/10 rounded-full backdrop-blur-xl"
              style={{
                boxShadow: '0 0 25px rgba(255, 255, 255, 0.2)',
              }}
            />
          </div>

          <motion.div 
            className="container mx-auto px-2 sm:px-4 relative z-10"
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