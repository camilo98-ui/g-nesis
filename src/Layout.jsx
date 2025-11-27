import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import GoodbyeModal from '@/components/GoodbyeModal';
import QuickSearch from '@/components/QuickSearch';
import { 
  Home, LayoutDashboard, TrendingUp, Award,
  Target, Users, LogOut, Menu, X, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from 'framer-motion';

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
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleLogout = () => {
    setShowGoodbye(true);
  };

  const completeLogout = () => {
    base44.auth.logout();
  };

  if (showGoodbye) {
    return <GoodbyeModal onComplete={completeLogout} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 px-4 flex items-center justify-between shadow-sm">
        {/* Logo */}
        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-gray-400 leading-none">HELADO GOURMET</span>
            <span className="text-2xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent leading-none">
              Popsy
            </span>
          </div>
        </Link>

        {/* Center Nav - Desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 ${isActive 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20' 
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {selectedStore && <QuickSearch storeId={selectedStore} />}
          
          {/* Logout Button - Always visible */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="gap-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="w-6 h-6 text-gray-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-white">
              <div className="mt-4 mb-6">
                <span className="text-[10px] text-gray-400 block">HELADO GOURMET</span>
                <span className="text-2xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  Popsy
                </span>
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

              <div className="absolute bottom-8 left-4 right-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-pink-600 border-pink-200 hover:bg-pink-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Cerrar Sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}