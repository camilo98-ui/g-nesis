import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

/**
 * Detector de fraude para ventas
 * Detecta registros sospechosos como:
 * - Ventas extremadamente altas vs promedio
 * - Ticket promedio muy alto
 * - Sugeridos desproporcionados
 */
export default function FraudDetector({ salesData, averageData, onConfirm, onCancel }) {
  const [showWarning, setShowWarning] = React.useState(false);
  const [fraudReasons, setFraudReasons] = React.useState([]);

  useEffect(() => {
    const reasons = [];
    
    // Ticket promedio = ventas / transacciones
    const ticketPromedio = salesData.transactions > 0 ? salesData.sales / salesData.transactions : 0;
    const avgTicket = averageData.avgTicket || 0;
    
    // Alerta si ventas son 3x más que el promedio
    if (salesData.sales > averageData.avgSales * 3) {
      reasons.push(`Ventas ${((salesData.sales / averageData.avgSales) * 100).toFixed(0)}% superiores al promedio (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(averageData.avgSales)})`);
    }
    
    // Alerta si ticket promedio es 2.5x más que el promedio
    if (ticketPromedio > avgTicket * 2.5 && avgTicket > 0) {
      reasons.push(`Ticket promedio ${((ticketPromedio / avgTicket) * 100).toFixed(0)}% superior al promedio (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(avgTicket)})`);
    }
    
    // Alerta si sugeridos son 3x más que el promedio
    if (salesData.suggested > averageData.avgSuggested * 3 && averageData.avgSuggested > 0) {
      reasons.push(`Sugeridos ${((salesData.suggested / averageData.avgSuggested) * 100).toFixed(0)}% superiores al promedio (${averageData.avgSuggested.toFixed(0)})`);
    }
    
    // Alerta si transacciones son muy pocas pero ventas muy altas (ticket extremadamente alto)
    if (salesData.transactions < 20 && ticketPromedio > 200000) {
      reasons.push(`Ticket promedio muy alto (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(ticketPromedio)}) con pocas transacciones (${salesData.transactions})`);
    }
    
    setFraudReasons(reasons);
    setShowWarning(reasons.length > 0);
  }, [salesData, averageData]);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-5 text-white">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  <AlertTriangle className="w-8 h-8" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold">⚠️ Alerta de Datos Inusuales</h2>
                  <p className="text-white/80 text-sm">Revisa antes de confirmar</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-medium">
                Detectamos registros que están muy por encima del promedio:
              </p>
              
              <div className="space-y-2">
                {fraudReasons.map((reason, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{reason}</p>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-800 font-medium mb-1">🔍 Verifica que:</p>
                <ul className="text-xs text-amber-700 space-y-0.5 ml-4 list-disc">
                  <li>Los números estén correctos</li>
                  <li>No haya errores al ingresar los datos</li>
                  <li>Las ventas correspondan al turno registrado</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancelar y corregir
                </Button>
                <Button 
                  onClick={onConfirm}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600"
                >
                  Confirmar de todas formas
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}