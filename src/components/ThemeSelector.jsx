import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Check, Monitor } from 'lucide-react';
import { Button } from "@/components/ui/button";

const THEMES = [
  {
    id: 'classic',
    name: 'Classic Popsy',
    description: 'Rosa corporativo y blanco',
    colors: {
      primary: '#ec4899',
      secondary: '#f43f5e',
      bg: '#ffffff',
      text: '#1e293b'
    }
  },
  {
    id: 'dark',
    name: 'Dark Pro',
    description: 'Fondo oscuro con acentos rosa',
    colors: {
      primary: '#f472b6',
      secondary: '#fb7185',
      bg: '#0f172a',
      text: '#f1f5f9'
    }
  },
  {
    id: 'mint',
    name: 'Fresh Mint',
    description: 'Verde menta y blanco',
    colors: {
      primary: '#10b981',
      secondary: '#14b8a6',
      bg: '#ffffff',
      text: '#1e293b'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Warm',
    description: 'Coral, durazno y tonos cálidos',
    colors: {
      primary: '#fb923c',
      secondary: '#f97316',
      bg: '#ffffff',
      text: '#1e293b'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Azul profundo con acentos claros',
    colors: {
      primary: '#3b82f6',
      secondary: '#06b6d4',
      bg: '#ffffff',
      text: '#1e293b'
    }
  }
];

export default function ThemeSelector({ isOpen, onClose }) {
  const [currentTheme, setCurrentTheme] = useState('classic');
  const [previewTheme, setPreviewTheme] = useState(null);
  const [useSystemTheme, setUseSystemTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('popsyTheme') || 'classic';
    const savedUseSystem = localStorage.getItem('popsyUseSystemTheme') === 'true';
    setCurrentTheme(savedTheme);
    setUseSystemTheme(savedUseSystem);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-bg', theme.colors.bg);
    root.style.setProperty('--theme-text', theme.colors.text);
    
    // Apply theme class for additional styling
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${themeId}`);
  };

  const handleThemeSelect = (themeId) => {
    setCurrentTheme(themeId);
    setPreviewTheme(null);
    applyTheme(themeId);
    localStorage.setItem('popsyTheme', themeId);
    localStorage.setItem('popsyUseSystemTheme', 'false');
    setUseSystemTheme(false);
  };

  const handlePreview = (themeId) => {
    setPreviewTheme(themeId);
    applyTheme(themeId);
  };

  const handleMouseLeave = () => {
    if (previewTheme) {
      setPreviewTheme(null);
      applyTheme(currentTheme);
    }
  };

  const toggleSystemTheme = () => {
    const newValue = !useSystemTheme;
    setUseSystemTheme(newValue);
    localStorage.setItem('popsyUseSystemTheme', newValue.toString());
    
    if (newValue) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const autoTheme = prefersDark ? 'dark' : 'classic';
      handleThemeSelect(autoTheme);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Palette className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Personaliza tu tema</h2>
                <p className="text-white/90 text-sm">Selecciona el estilo visual de tu app</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* System Theme Option */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSystemTheme}
                  onChange={toggleSystemTheme}
                  className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 flex-1">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-bold text-slate-900">Seguir tema del sistema</p>
                    <p className="text-xs text-slate-600">Cambia automáticamente según tu dispositivo</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEMES.map((theme) => {
                const isActive = currentTheme === theme.id;
                const isPreviewing = previewTheme === theme.id;

                return (
                  <motion.button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id)}
                    onMouseEnter={() => handlePreview(theme.id)}
                    onMouseLeave={handleMouseLeave}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                      isActive
                        ? 'border-pink-500 bg-pink-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Color Preview */}
                    <div className="flex gap-2 mb-3">
                      <div
                        className="w-12 h-12 rounded-xl shadow-md"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="w-12 h-12 rounded-xl shadow-md"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <div
                        className="flex-1 rounded-xl border-2 border-slate-200"
                        style={{ backgroundColor: theme.colors.bg }}
                      />
                    </div>

                    {/* Theme Info */}
                    <div className="mb-2">
                      <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
                        {theme.name}
                        {isActive && (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-600">{theme.description}</p>
                    </div>

                    {/* Preview Badge */}
                    {isPreviewing && !isActive && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                        Vista previa
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 rounded-xl"
            >
              Guardar y continuar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}