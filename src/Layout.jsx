import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ErrorBoundary from '@/components/ErrorBoundary';
import { DateFilterProvider, useDateFilter } from '@/components/DateFilterContext';
import { base44 } from '@/api/base44Client';
import { Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";



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

  useEffect(() => {
    document.documentElement.lang = 'es';
  }, []);

  return (
    <DateFilterProvider>
      <ErrorBoundary>
        <div className="min-h-screen app-container">
          {/* Main Content */}
          <main className="min-h-screen relative overflow-y-auto">
          {/* Gradient Background - Optimizado para móvil */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base gradient simple */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100" />
          </div>

          <div className="w-full relative z-10 overflow-y-auto">
            {children}
          </div>
          </main>
          </div>
          </ErrorBoundary>
          </DateFilterProvider>
          );
          }