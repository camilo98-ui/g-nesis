import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SmartSearch from '@/components/SmartSearch';
import MotivationalHeader from '@/components/MotivationalHeader';
import ErrorBoundary from '@/components/ErrorBoundary';
import PopsyIllustrationRain from '@/components/PopsyIllustrationRain';
import { base44 } from '@/api/base44Client';
import { 
  Home, LayoutDashboard, Menu, Snowflake, CalendarDays, TrendingUp
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
    
    // Apply saved theme on mount
    const savedTheme = localStorage.getItem('popsyTheme') || 'classic';
    const root = document.documentElement;
    root.classList.remove('theme-classic', 'theme-dark', 'theme-mint', 'theme-sunset', 'theme-ocean');
    root.classList.add(`theme-${savedTheme}`);
    root.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen app-container">
        <PopsyIllustrationRain />
        
        {/* Main Content */}
        <main className="pt-4 min-h-screen pb-4 relative">
          {/* Simplified Static Background */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none app-background">
            <div className="absolute top-20 right-[10%] w-[500px] h-[500px] theme-orb-1 rounded-full blur-3xl opacity-40" />
            <div className="absolute bottom-20 left-[15%] w-[600px] h-[600px] theme-orb-2 rounded-full blur-3xl opacity-30" />
          </div>

          <div className="container mx-auto px-2 sm:px-4 relative z-10">
            {children}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}