import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Target, FileText, Settings, ChevronLeft, ChevronRight,
  TrendingUp, Users, Snowflake, Calendar, Award, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";

const NAV_ITEMS = [
  { name: 'Inicio', page: 'Home', icon: Home, color: 'text-pink-500' },
  { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard, color: 'text-emerald-500' },
  { name: 'Cajeros', page: 'CashiersDashboard', icon: Users, color: 'text-violet-500' },
  { name: 'Rankings', page: 'Rankings', icon: Award, color: 'text-amber-500' },
  { name: 'Mapa Nevera', page: 'FreezerMap', icon: Snowflake, color: 'text-cyan-500' },
  { name: 'Planner', page: 'PopsyPlanner', icon: Calendar, color: 'text-indigo-500' },
  { name: 'Reportes', page: 'Reports', icon: FileText, color: 'text-blue-500' },
  { name: 'Configuración', page: 'Settings', icon: Settings, color: 'text-gray-500' }
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'Home';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-slate-200 shadow-lg z-40 flex flex-col"
    >
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.img
              key="logo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              src={LOGO_URL}
              alt="Popsy"
              className="h-12 object-contain"
            />
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="rounded-full hover:bg-pink-50"
        >
          {collapsed ? <ChevronRight className="w-5 h-5 text-pink-500" /> : <ChevronLeft className="w-5 h-5 text-pink-500" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.page;

          return (
            <Link key={item.page} to={createPageUrl(item.page)}>
              <motion.div
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 shadow-md'
                    : 'hover:bg-slate-50 border-2 border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-white shadow-sm' : 'bg-slate-50'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-slate-400'}`} />
                </div>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      key="text"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1 min-w-0"
                    >
                      <span className={`font-semibold text-sm ${
                        isActive ? 'text-pink-700' : 'text-slate-700'
                      }`}>
                        {item.name}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key="footer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 border-t border-slate-200"
          >
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium">Popsy Management</p>
              <p className="text-[10px] text-slate-400 mt-1">v2.0 • 2026</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}