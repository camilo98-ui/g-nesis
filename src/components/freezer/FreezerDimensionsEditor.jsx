import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function FreezerDimensionsEditor({ currentRows = 7, currentCols = 5, onAddRow, onRemoveRow, onAddCol, onRemoveCol }) {
  return (
    <div className="flex items-center gap-2">
      {/* Controles de filas */}
      <div className="flex items-center gap-1 bg-pink-100/50 rounded-lg px-2 py-1">
        <span className="text-xs text-pink-700 font-medium">Filas: {currentRows}</span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onAddRow}
          className="w-6 h-6 rounded-md bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors"
          title="Agregar fila"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemoveRow}
          disabled={currentRows <= 1}
          className="w-6 h-6 rounded-md bg-pink-300 text-white flex items-center justify-center hover:bg-pink-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Quitar fila"
        >
          <Minus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Controles de columnas */}
      <div className="flex items-center gap-1 bg-purple-100/50 rounded-lg px-2 py-1">
        <span className="text-xs text-purple-700 font-medium">Cols: {currentCols}</span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onAddCol}
          className="w-6 h-6 rounded-md bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600 transition-colors"
          title="Agregar columna"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemoveCol}
          disabled={currentCols <= 1}
          className="w-6 h-6 rounded-md bg-purple-300 text-white flex items-center justify-center hover:bg-purple-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Quitar columna"
        >
          <Minus className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}