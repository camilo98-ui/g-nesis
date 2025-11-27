import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import GoodbyeModal from '@/components/GoodbyeModal';
import { 
  Home, LayoutDashboard, TrendingUp, Award, Search, 
  Target, Users, LogOut, Menu, X, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Inicio', page: 'Home', icon: Home },
  { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
  { name: 'Ventas', page: 'Sales', icon: TrendingUp },
  { name: 'Rankings', page: 'Rankings', icon: Award },
  { name: 'Buscar', page: 'SearchCashier', icon: Search },
  { name: 'Presupuestos', page: 'Budget', icon: Target },
  { name: 'Equipo', page: 'Team', icon: Users },
];

export default function Layout({ children, currentPageName }) {
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <style>{`
        :root {
          --primary: 249 115 22;
          --primary-foreground: 255 255 255;
          --secondary: 239 68 68;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-xl border-r border-orange-100 flex-col z-40">
        <div className="p-6 border-b border-orange-100">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl gradient-text">SalesTracker</h1>
              <p className="text-xs text-gray-400">Sistema de Ventas</p>
            </div>
          </Link>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' 
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-orange-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-orange-100 z-40 px-4 flex items-center justify-between">
        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold gradient-text">SalesTracker</span>
        </Link>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-white/95 backdrop-blur-xl border-orange-100">
            <nav className="mt-8 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                        : 'text-gray-600 hover:bg-orange-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-8 left-4 right-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Cerrar Sesión
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}