import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SmartSearch from '@/components/SmartSearch';
import MotivationalHeader from '@/components/MotivationalHeader';
import { 
  Home, LayoutDashboard, TrendingUp, Award,
  Target, Users, Menu, X, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from 'framer-motion';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/c3a36de58_Capturadepantalla2025-11-251251441.png";

const NAV_ITEMS = [
  { name: 'Inicio', page: 'Home', icon: Home },
  { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
  { name: 'Ventas', page: 'Sales', icon: TrendingUp },
  { name: 'Rankings', page: 'Rankings', icon: Award },
  { name: 'Presupuestos', page: 'Budget', icon: Target },
  { name: 'Equipo', page: 'Team', icon: Users },
  { name: 'Reportes', page: 'Reports', icon: FileText },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Motivational Banner */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 z-50 border-b border-pink-100">
        <MotivationalHeader />
      </div>

      {/* Top Header Bar */}
      <header className="fixed top-8 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 px-4 flex items-center justify-between shadow-sm">
        {/* Logo */}
        <Link to={createPageUrl('Home')} className="flex items-center">
          <motion.img 
            src={LOGO_URL} 
            alt="Popsy" 
            className="h-12 md:h-14 object-contain"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
        </Link>

        {/* Center Nav - Desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`gap-2 transition-all duration-200 ${isActive 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20' 
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </Button>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <SmartSearch storeId={selectedStore} />

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
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
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                            : 'text-gray-600 hover:bg-pink-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
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
      <main className="pt-24 min-h-screen">
        {children}
      </main>
    </div>
  );
}