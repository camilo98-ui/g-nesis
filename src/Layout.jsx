import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SmartSearch from '@/components/SmartSearch';
import MotivationalHeader from '@/components/MotivationalHeader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { base44 } from '@/api/base44Client';
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
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    const savedRole = localStorage.getItem('userRole');
    if (saved) setSelectedStore(saved);
    if (savedRole) setUserRole(savedRole);
    
    // Apply saved theme on mount
    const savedTheme = localStorage.getItem('popsyTheme') || 'classic';
    const root = document.documentElement;
    root.classList.remove('theme-classic', 'theme-dark', 'theme-mint', 'theme-sunset', 'theme-ocean');
    root.classList.add(`theme-${savedTheme}`);
    root.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (!authenticated && currentPageName !== 'Home') {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    };
    
    checkAuth();
  }, [currentPageName]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 theme-border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-semibold">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen app-container">



        {/* Main Content */}
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="pt-4 min-h-screen pb-4 relative"
        >
          {/* Premium Modern Background */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none app-background">
            {/* Animated gradient orbs */}
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 right-[10%] w-[500px] h-[500px] theme-orb-1 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, 80, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-20 left-[15%] w-[600px] h-[600px] theme-orb-2 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, 60, 0],
                y: [0, -60, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[40%] left-[5%] w-[400px] h-[400px] bg-gradient-to-br from-blue-300/10 via-cyan-300/15 to-transparent rounded-full blur-3xl"
            />

            {/* Geometric shapes */}
            <div className="absolute top-[15%] right-[20%] w-32 h-32 border border-pink-200/30 rounded-2xl rotate-12 opacity-40" />
            <div className="absolute bottom-[25%] left-[25%] w-24 h-24 border border-purple-200/30 rounded-full opacity-30" />
            <div className="absolute top-[60%] right-[35%] w-20 h-20 border border-blue-200/30 rounded-xl -rotate-6 opacity-40" />

            {/* Glassmorphism layers */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[10%] left-[40%] w-64 h-64 bg-gradient-to-br from-white/40 to-pink-100/30 rounded-full backdrop-blur-3xl"
            />
            <motion.div
              animate={{
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-[15%] right-[30%] w-48 h-48 bg-gradient-to-br from-white/30 to-purple-100/30 rounded-full backdrop-blur-3xl"
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