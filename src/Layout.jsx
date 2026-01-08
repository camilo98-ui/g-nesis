import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SmartSearch from '@/components/SmartSearch';
import MotivationalHeader from '@/components/MotivationalHeader';
import ErrorBoundary from '@/components/ErrorBoundary';
import PopsyRainingIcons from '@/components/PopsyRainingIcons';
import { DateFilterProvider, useDateFilter } from '@/components/DateFilterContext';
import { base44 } from '@/api/base44Client';
import { 
  Home, LayoutDashboard, Menu, Snowflake, CalendarDays, TrendingUp, Calendar
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

const NAV_ITEMS = [
  { name: 'Inicio', page: 'Home', icon: Home, isIcon: true },
  { name: 'Planner', page: 'PopsyPlanner', icon: CalendarDays, isIcon: true },
];

function DateFilterBar() {
  const { startDate, endDate, setStartDate, setEndDate } = useDateFilter();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 py-3 px-4 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rose-500" />
          <span className="text-sm font-bold text-slate-700">Filtro de Fechas:</span>
        </div>

        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-auto justify-start text-left font-normal border-rose-200 hover:border-rose-400">
              <CalendarDays className="mr-2 h-4 w-4 text-rose-500" />
              <span className="text-sm">
                {format(startDate, 'dd MMM', { locale: es })} - {format(endDate, 'dd MMM yyyy', { locale: es })}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">Fecha Inicio</label>
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={es}
                  className="rounded-md border"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">Fecha Fin</label>
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={es}
                  className="rounded-md border"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
                  }}
                  className="flex-1"
                >
                  Este Mes
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setDatePickerOpen(false)}
                  className="flex-1 bg-rose-500 hover:bg-rose-600"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [userRole, setUserRole] = useState('lider');

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    const savedRole = localStorage.getItem('userRole');
    if (saved) setSelectedStore(saved);
    if (savedRole) setUserRole(savedRole);
    
    // Load theme on mount
    const savedTheme = localStorage.getItem('popsyTheme') || 'classic';
    const root = document.documentElement;
    root.classList.add(`theme-${savedTheme}`);
    
    // Set language to Spanish to prevent translation prompts
    document.documentElement.lang = 'es';
  }, []);

  return (
    <DateFilterProvider>
      <ErrorBoundary>
        <div className="min-h-screen app-container">
          {/* Main Content */}
          <main className="h-screen overflow-hidden relative">
          {/* Professional Gradient Background - Enhanced */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base gradient más vibrante */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-200/80 via-purple-200/70 to-blue-200/80" />

            {/* Animated color-shifting orbs más visibles */}
            <div className="absolute top-10 right-[8%] w-[700px] h-[700px] rounded-full blur-3xl animate-gradient-1 animate-vertical-swap-1" style={{ opacity: 0.9 }} />
            <div className="absolute bottom-10 left-[12%] w-[800px] h-[800px] rounded-full blur-3xl animate-gradient-2 animate-vertical-swap-2" style={{ opacity: 0.85 }} />
            <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full blur-3xl animate-gradient-3 animate-vertical-swap-3" style={{ opacity: 0.9 }} />

            {/* Orbs secundarios con colores intensos */}
            <div className="absolute top-1/2 right-[20%] w-[450px] h-[450px] rounded-full blur-3xl animate-pulse-slow animate-vertical-swap-4" style={{ background: 'radial-gradient(circle, rgba(251, 113, 133, 0.6), rgba(236, 72, 153, 0.3), transparent)', opacity: 0.7 }} />
            <div className="absolute bottom-1/4 right-[15%] w-[400px] h-[400px] rounded-full blur-3xl animate-vertical-swap-5" style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5), rgba(147, 51, 234, 0.25), transparent)', animation: 'gradient-shift-1 18s ease-in-out infinite reverse', opacity: 0.65 }} />
            <div className="absolute top-[15%] left-[20%] w-[350px] h-[350px] rounded-full blur-2xl animate-float animate-vertical-swap-6" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5), rgba(37, 99, 235, 0.25), transparent)', opacity: 0.6 }} />

            {/* Grid overlay más sutil */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8885_1px,transparent_1px),linear-gradient(to_bottom,#8885_1px,transparent_1px)] bg-[size:80px_80px] opacity-15" />

            {/* Múltiples luces ambientales */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,114,182,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_60%)]" />
          </div>

          <div className="w-full h-full relative z-10">
            {children}
          </div>
        </main>
        </div>
      </ErrorBoundary>
    </DateFilterProvider>
  );
}