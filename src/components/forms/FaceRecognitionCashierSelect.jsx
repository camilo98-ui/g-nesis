import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Check, X, Sparkles, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FaceRecognitionCashierSelect({ cashiers = [], onSelect, selectedId = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  // Filtrar cajeros por búsqueda
  const filteredCashiers = cashiers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por inicial
  const groupedCashiers = filteredCashiers.reduce((acc, cashier) => {
    const initial = cashier.name?.[0]?.toUpperCase() || '?';
    if (!acc[initial]) acc[initial] = [];
    acc[initial].push(cashier);
    return acc;
  }, {});

  const handleCashierClick = (cashier) => {
    onSelect(cashier.id);
  };

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y cámara */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Buscar cajero por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 border-2 border-purple-200 focus:border-purple-400 rounded-xl bg-white/80"
          />
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
        </div>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="button"
            onClick={() => setShowCamera(!showCamera)}
            className="h-12 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl shadow-md"
          >
            <Camera className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Modo Cámara (Simulado) */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 border-2 border-purple-300"
          >
            <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 border-4 border-purple-500"
              />
              <Camera className="w-16 h-16 text-purple-400" />
            </div>
            <p className="text-center text-xs text-purple-700 mt-3 font-medium">
              🎥 Coloca tu rostro frente a la cámara para identificación automática
            </p>
            <div className="mt-3 flex justify-center">
              <Button
                type="button"
                onClick={() => setShowCamera(false)}
                variant="outline"
                size="sm"
                className="border-purple-300"
              >
                <X className="w-4 h-4 mr-1" />
                Cerrar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Galería Visual de Cajeros */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <p className="text-sm font-bold text-purple-700">
            {selectedId ? 'Cajero seleccionado' : 'Selecciona tu perfil'}
          </p>
        </div>

        {Object.keys(groupedCashiers).length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No se encontraron cajeros</p>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto space-y-4 pr-2">
            {Object.entries(groupedCashiers)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([initial, cashierGroup]) => (
                <div key={initial}>
                  <div className="sticky top-0 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-lg mb-2 z-10">
                    <p className="text-xs font-black text-purple-700">{initial}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {cashierGroup.map((cashier, idx) => {
                      const isSelected = selectedId === cashier.id;
                      return (
                        <motion.button
                          key={cashier.id}
                          type="button"
                          onClick={() => handleCashierClick(cashier)}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className={`relative p-3 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg ring-2 ring-purple-300'
                              : 'bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 shadow-sm hover:shadow-md border-2 border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'ring-2 ring-white/50' : ''
                            }`}>
                              {cashier.photo_url ? (
                                <img 
                                  src={cashier.photo_url} 
                                  alt={cashier.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-xl font-black ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-purple-200 to-pink-200 text-purple-700'
                                }`}>
                                  {cashier.name?.[0]?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>

                            {/* Nombre */}
                            <div className="flex-1 text-left min-w-0">
                              <p className={`text-sm font-bold truncate ${
                                isSelected ? 'text-white' : 'text-gray-800'
                              }`}>
                                {cashier.name}
                              </p>
                              {cashier.position && (
                                <p className={`text-xs truncate ${
                                  isSelected ? 'text-white/80' : 'text-gray-500'
                                }`}>
                                  {cashier.position}
                                </p>
                              )}
                            </div>

                            {/* Check icon */}
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="flex-shrink-0"
                              >
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                  <Check className="w-4 h-4 text-purple-600" />
                                </div>
                              </motion.div>
                            )}
                          </div>

                          {/* Efecto de brillo para seleccionado */}
                          {isSelected && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 rounded-xl"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200"
      >
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-700 mb-1">Identificación Rápida</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Selecciona tu foto para un registro más rápido. La cámara permitirá reconocimiento facial automático próximamente.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}