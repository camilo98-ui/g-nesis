import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import GoodbyeModal from '@/components/GoodbyeModal';
import HeaderCones from '@/components/HeaderCones';
import QuickSearch from '@/components/QuickSearch';
import AnimatedIcon from '@/components/AnimatedIcon';
import { 
  Home, LayoutDashboard, TrendingUp, Award, Search, 
  Target, Users, LogOut, Menu, X, FileText, Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Inicio', page: 'Home', icon: Home, color: 'pink' },
  { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard, color: 'purple' },
  { name: 'Ventas', page: 'Sales', icon: TrendingUp, color: 'green' },
  { name: 'Rankings', page: 'Rankings', icon: Award, color: 'yellow' },
  { name: 'Presupuestos', page: 'Budget', icon: Target, color: 'blue' },
  { name: 'Equipo', page: 'Team', icon: Users, color: 'cyan' },
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-fuchsia-50/30 to-purple-50">
      <style>{`
        :root {
          --primary: 219 39 119;
          --primary-foreground: 255 255 255;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #be185d 0%, #a21caf 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white/70 backdrop-blur-xl border-r border-fuchsia-100 flex-col z-40">
        <div className="p-6 border-b border-fuchsia-100">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/abbf8c276_Capturadepantalla2025-11-25125144.jpg"
              alt="Popsy Logo"
              className="h-14 object-contain"
            />
          </Link>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30' 
                      : 'text-gray-600 hover:bg-fuchsia-50'
                  }`}
                >
                  <motion.div
                    animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <span className="font-medium">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-fuchsia-100 space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-500 hover:text-fuchsia-600 hover:bg-fuchsia-50"
            onClick={() => navigate(createPageUrl('Settings'))}
          >
            <Settings className="w-5 h-5 mr-3" />
            Configuración
          </Button>
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-fuchsia-100 z-40 px-4 flex items-center justify-between">
        <HeaderCones />
        
        <Link to={createPageUrl('Home')} className="flex items-center gap-2 relative z-10">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/abbf8c276_Capturadepantalla2025-11-25125144.jpg"
            alt="Popsy Logo"
            className="h-10 object-contain"
          />
        </Link>

        <div className="flex items-center gap-2 relative z-10">
          {selectedStore && <QuickSearch storeId={selectedStore} />}
          
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-fuchsia-50">
                <Menu className="w-6 h-6 text-fuchsia-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-white/95 backdrop-blur-xl border-fuchsia-100">
              <div className="mt-4 mb-6">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/abbf8c276_Capturadepantalla2025-11-25125144.jpg"
                  alt="Popsy Logo"
                  className="h-12 object-contain"
                />
              </div>
              
              <nav className="space-y-2">
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
                            ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white' 
                            : 'text-gray-600 hover:bg-fuchsia-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>

              <div className="absolute bottom-8 left-4 right-4 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-500 hover:text-fuchsia-600"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate(createPageUrl('Settings'));
                  }}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Configuración
                </Button>
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
        </div>
      </header>

      {/* Desktop Quick Search */}
      <div className="hidden lg:block fixed top-4 right-4 z-50">
        {selectedStore && <QuickSearch storeId={selectedStore} />}
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}