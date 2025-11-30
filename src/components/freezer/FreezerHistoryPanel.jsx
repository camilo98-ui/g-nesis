import React from 'react';
import { motion } from 'framer-motion';
import { History, RotateCcw, Calendar, X } from 'lucide-react';
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
      className="fixed right-0 top-24 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-40 overflow-y-auto"
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-pink-600" />
          <h3 className="font-bold text-gray-800">Historial</h3>
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
          </div>
        ) : (
          history.map((entry, i) => (
            <motion.div
              key={entry.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-pink-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-500" />
                  <span className="text-sm font-medium">
                    {entry.date ? format(new Date(entry.date), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {entry.time || format(new Date(entry.created_date || Date.now()), 'HH:mm')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span>{entry.filledSlots || 0} sabores</span>
                  {entry.changes && <span className="ml-2">• {entry.changes} cambios</span>}
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