import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export default function WeatherSalesHeader({ dateRange, onDateChange, onReset }) {
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Impacto del Clima en Ventas</h1>
                <p className="text-sm text-slate-400 mt-0.5">9 días analizados</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="gap-2 text-slate-300 hover:bg-white/10"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {format(dateRange.from, 'd MMM')} - {format(dateRange.to, 'd MMM')}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 bg-slate-900 border-white/20">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-2 block">Desde</label>
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => onDateChange({ ...dateRange, from: date })}
                      className="rounded-lg border border-white/10 bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-2 block">Hasta</label>
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => onDateChange({ ...dateRange, to: date })}
                      className="rounded-lg border border-white/10 bg-slate-800"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="text-slate-400 hover:text-slate-300 hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}