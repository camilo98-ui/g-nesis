import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle, AlertCircle, 
  BarChart3, Zap, X, Package, TrendingUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import OrderPredictionPanel from './OrderPredictionPanel';
import StockVisualization from './StockVisualization';

export default function FreezerAuditPanel({ 
  auditData, 
  onClose, 
  onApplySuggestions,
  onAutoCorrect,
  isLoading,
  allSlots = []
}) {
  const [selectedFreezer, setSelectedFreezer] = React.useState(auditData.selectedFreezer || 'total');
  
  if (!auditData) return null;

  const { byFreezer, total, suggestions } = auditData;
  const currentData = selectedFreezer === 'total' ? total : byFreezer?.[selectedFreezer] || total;
  
  // Filtrar slots según la nevera seleccionada
  const relevantSlots = selectedFreezer === 'total' 
    ? allSlots 
    : allSlots.filter(s => s.store_id?.endsWith(`_F${selectedFreezer}`));
  
  // Usar los valores calculados de auditData que ya vienen correctos desde FreezerMap
  const { 
    totalSlots, 
    filledSlots, 
    emptySlots, 
    misplacedSlots, 
    repeatedFlavors, 
    efficiency 
  } = currentData;
  
  console.log(`📊 Panel mostrando (${selectedFreezer}):`, {
    totalSlots,
    filledSlots,
    emptySlots,
    calculated: currentData
  });

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
      className="fixed right-0 top-24 bottom-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-40 overflow-y-auto"
    >
      <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pink-600" />
            <h3 className="font-bold text-gray-800">Auditoría de Neveras</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Selector de Nevera */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedFreezer('total')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedFreezer === 'total'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Resumen (3 neveras)
          </button>
          {byFreezer && Object.keys(byFreezer).sort((a, b) => a - b).map(freezerNum => (
            <button
              key={freezerNum}
              onClick={() => setSelectedFreezer(freezerNum)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFreezer === freezerNum
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🧊 N#{freezerNum}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Efficiency Score */}
        <div className={`p-4 rounded-xl ${getEfficiencyColor(efficiency)}`}>
          <div className="text-center">
            <p className="text-sm font-medium mb-1">Eficiencia de Nevera</p>
            <p className="text-4xl font-bold">{efficiency}%</p>
          </div>
        </div>

        {/* Stats Grid - SIN mal ubicados */}
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
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <Zap className="w-5 h-5 text-yellow-600 mb-1" />
            <p className="text-xl font-bold text-yellow-700">{repeatedFlavors?.length || 0}</p>
            <p className="text-xs text-yellow-600">Repetidos</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <Package className="w-5 h-5 text-purple-600 mb-1" />
            <p className="text-xl font-bold text-purple-700">{efficiency}%</p>
            <p className="text-xs text-purple-600">Eficiencia</p>
          </div>
        </div>

        {/* Resumen de Sabores */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
          <h4 className="font-bold text-cyan-700 text-sm mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Resumen de Sabores
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Total de sabores diferentes:</span>
              <span className="font-bold text-cyan-700">{(() => {
                const uniqueFlavors = new Set();
                relevantSlots.forEach(s => {
                  if (!s.is_empty && s.flavor_name) {
                    uniqueFlavors.add(s.flavor_name.toLowerCase().trim());
                  }
                });
                return uniqueFlavors.size;
              })()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Cubetas ocupadas:</span>
              <span className="font-bold text-cyan-700">{filledSlots} / {totalSlots}</span>
            </div>
            <div className="text-[10px] text-cyan-600 mt-2 pt-2 border-t border-cyan-200 max-h-48 overflow-y-auto">
              {(() => {
                const flavorCounts = {};
                relevantSlots.forEach(s => {
                  if (!s.is_empty && s.flavor_name) {
                    const key = s.flavor_name.toLowerCase().trim();
                    if (!flavorCounts[key]) {
                      flavorCounts[key] = 0;
                    }
                    flavorCounts[key]++;
                  }
                });
                const sortedFlavors = Object.entries(flavorCounts)
                  .map(([key, count]) => {
                    const originalSlot = relevantSlots.find(s => s.flavor_name?.toLowerCase().trim() === key);
                    return { name: originalSlot?.flavor_name || key, count };
                  })
                  .sort((a, b) => b.count - a.count);
                
                return sortedFlavors.length > 0 ? (
                  <div>
                    <p className="font-semibold mb-1">
                      {selectedFreezer === 'total' ? 'Todos los sabores:' : `Sabores en Nevera #${selectedFreezer}:`}
                    </p>
                    <div className="space-y-0.5">
                      {sortedFlavors.map((f, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{f.name}</span>
                          <span className="font-bold">{f.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : 'No hay sabores en la nevera';
              })()}
            </div>
          </div>
        </div>



        {/* Issues List - Solo repetidos */}
        {repeatedFlavors?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-yellow-700 text-sm">🔄 Sabores Repetidos</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {repeatedFlavors.map((f, i) => (
                <div key={i} className="text-xs p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-yellow-800">{f.name}</span>
                    <span className="text-yellow-600 font-semibold">{f.count}x</span>
                  </div>
                  {f.positions && (
                    <p className="text-[10px] text-gray-500">Ubicaciones: {f.positions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t">
          <Button
            onClick={onAutoCorrect}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            Corregir Automáticamente
          </Button>
        </div>
      </div>
    </motion.div>
  );
}