import React from 'react';
import { motion } from 'framer-motion';
import { History, RotateCcw, Calendar, X, User, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function FreezerHistoryPanel({ 
  history = [], 
  onClose, 
  onRestore,
  isLoading 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-24 bottom-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-40 overflow-y-auto"
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <History className="w-5 h-5 text-pink-600" />
          </motion.div>
          <h3 className="font-bold text-gray-800">Historial de Cambios</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin historial disponible</p>
            <p className="text-xs mt-1">Los cambios se guardarán automáticamente</p>
          </div>
        ) : (
          history.map((entry, i) => (
            <motion.div
              key={entry.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl bg-gradient-to-r from-gray-50 to-pink-50/30 border border-gray-200 hover:border-pink-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {entry.date ? format(new Date(entry.date), 'EEEE dd MMM yyyy', { locale: es }) : 'N/A'}
                  </span>
                </div>
              </div>
              
              {/* Hora de modificación */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Clock className="w-3 h-3" />
                <span>
                  Modificado a las {entry.created_date ? format(new Date(entry.created_date), 'HH:mm:ss', { locale: es }) : 'N/A'}
                </span>
              </div>

              {/* Usuario que modificó */}
              {entry.created_by_user && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <User className="w-3 h-3" />
                  <span>Por: {entry.created_by_user}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full font-medium">
                    {entry.filledSlots || entry.filled_slots || 0} sabores
                  </span>
                  {(entry.changes || entry.changes_count) > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                      {entry.changes || entry.changes_count} cambios
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRestore(entry)}
                  disabled={isLoading}
                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 h-7 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Restaurar
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}