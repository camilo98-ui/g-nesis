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
          <main className="pt-4 min-h-screen pb-4 relative">
          {/* Professional Gradient Background */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base gradient mejorado */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100/70 via-purple-100/60 to-blue-100/70" />

            {/* Animated color-shifting orbs mejorados */}
            <div className="absolute top-20 right-[10%] w-[600px] h-[600px] rounded-full blur-3xl animate-gradient-1 opacity-80" />
            <div className="absolute bottom-20 left-[15%] w-[700px] h-[700px] rounded-full blur-3xl animate-gradient-2 opacity-70" />
            <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl animate-gradient-3 opacity-75" />

            {/* Orbs adicionales para más profundidad */}
            <div className="absolute top-1/2 right-[25%] w-[400px] h-[400px] rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(circle, rgba(251, 113, 133, 0.4), transparent)' }} />
            <div className="absolute bottom-1/3 right-[10%] w-[350px] h-[350px] rounded-full blur-3xl opacity-35" style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.35), transparent)', animation: 'gradient-shift-1 20s ease-in-out infinite reverse' }} />

            {/* Subtle grid overlay mejorado */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8883_1px,transparent_1px),linear-gradient(to_bottom,#8883_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />

            {/* Luz ambiental sutil */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          </div>

          <div className="container mx-auto px-2 sm:px-4 relative z-10">
            {children}
          </div>
        </main>
        </div>
      </ErrorBoundary>
    </DateFilterProvider>
  );
}