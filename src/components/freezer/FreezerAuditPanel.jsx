import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle, AlertCircle, 
  BarChart3, Zap, X 
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function FreezerAuditPanel({ 
  auditData, 
  onClose, 
  onApplySuggestions,
  onAutoCorrect,
  isLoading 
}) {
  if (!auditData) return null;

  const { 
    totalSlots, 
    filledSlots, 
    emptySlots, 
    misplacedSlots, 
    repeatedFlavors, 
    suggestions,
    efficiency 
  } = auditData;

  const getEfficiencyColor = (eff) => {
    if (eff >= 80) return 'text-green-600 bg-green-100';
    if (eff >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-24 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-40 overflow-y-auto"
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-pink-600" />
          <h3 className="font-bold text-gray-800">Auditoría</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Efficiency Score */}
        <div className={`p-4 rounded-xl ${getEfficiencyColor(efficiency)}`}>
          <div className="text-center">
            <p className="text-sm font-medium mb-1">Eficiencia de Nevera</p>
            <p className="text-4xl font-bold">{efficiency}%</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
            <p className="text-xl font-bold text-green-700">{filledSlots}</p>
            <p className="text-xs text-green-600">Llenos</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <AlertCircle className="w-5 h-5 text-gray-500 mb-1" />
            <p className="text-xl font-bold text-gray-700">{emptySlots}</p>
            <p className="text-xs text-gray-500">Vacíos</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 mb-1" />
            <p className="text-xl font-bold text-red-700">{misplacedSlots?.length || 0}</p>
            <p className="text-xs text-red-600">Mal ubicados</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <Zap className="w-5 h-5 text-yellow-600 mb-1" />
            <p className="text-xl font-bold text-yellow-700">{repeatedFlavors?.length || 0}</p>
            <p className="text-xs text-yellow-600">Repetidos</p>
          </div>
        </div>

        {/* Issues List */}
        {misplacedSlots?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700 text-sm">⚠️ Mal Ubicados</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {misplacedSlots.map((s, i) => (
                <div key={i} className="text-xs p-2 bg-red-50 rounded-lg">
                  <span className="font-medium">{s.flavor_name}</span>
                  <span className="text-gray-500"> - Fila {s.row}, Pos {s.position}</span>
                  {s.reason && <p className="text-red-600 mt-0.5">{s.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {repeatedFlavors?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-yellow-700 text-sm">🔄 Sabores Repetidos</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {repeatedFlavors.map((f, i) => (
                <div key={i} className="text-xs p-2 bg-yellow-50 rounded-lg">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-gray-500"> - {f.count}x veces</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-purple-700 text-sm">💡 Sugerencias IA</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {suggestions.map((s, i) => (
                <div key={i} className="text-xs p-2 bg-purple-50 rounded-lg">
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t">
          <Button
            onClick={onApplySuggestions}
            disabled={isLoading || !suggestions?.length}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            Aplicar Sugerencias
          </Button>
          <Button
            onClick={onAutoCorrect}
            disabled={isLoading}
            variant="outline"
            className="w-full border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            Corregir Automáticamente
          </Button>
        </div>
      </div>
    </motion.div>
  );
}