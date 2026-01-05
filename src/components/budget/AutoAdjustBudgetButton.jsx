import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AutoAdjustBudgetButton({ storeId, storeName, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState(null);

  const handleAutoAdjust = async () => {
    if (!storeId) {
      toast.error('Selecciona una tienda primero');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data } = await base44.functions.invoke('adjustWeeklyBudgetByProjection', {
        store_id: storeId
      });

      setAdjustmentResult(data);
      setShowResultModal(true);

      if (data.adjusted) {
        toast.success(`Presupuesto ajustado +${data.incrementPercentage}%`);
        onSuccess?.();
      } else {
        toast.info('No se requiere ajuste de presupuesto');
      }
    } catch (error) {
      console.error('Error adjusting budget:', error);
      toast.error('Error al ajustar presupuesto automáticamente');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(Math.round(val));

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleAutoAdjust}
          disabled={isProcessing}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Ajustando...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Ajuste Automático
            </>
          )}
        </Button>
      </motion.div>

      {/* Modal de Resultados */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustmentResult?.adjusted ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  Presupuesto Ajustado Exitosamente
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                  No se Requiere Ajuste
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Semana del {adjustmentResult?.weekRange?.start} al {adjustmentResult?.weekRange?.end}
            </DialogDescription>
          </DialogHeader>

          {adjustmentResult && (
            <div className="space-y-4">
              {/* Resumen de Proyección */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Ventas Actuales de la Semana</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(adjustmentResult.currentWeekSales)}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Día {adjustmentResult.daysElapsed} de 7
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-purple-600 mb-1">Presupuesto Semanal Original</p>
                  <p className="text-xl font-bold text-purple-700">
                    {formatCurrency(adjustmentResult.weekBudgetTotal)}
                  </p>
                </div>

                <div className={`rounded-lg p-4 border ${
                  adjustmentResult.projectedPercentage >= 100
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <p className={`text-xs mb-1 ${
                    adjustmentResult.projectedPercentage >= 100 ? 'text-green-600' : 'text-amber-600'
                  }`}>Proyección de Cierre</p>
                  <p className={`text-xl font-bold ${
                    adjustmentResult.projectedPercentage >= 100 ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {formatCurrency(adjustmentResult.projectedSales)}
                  </p>
                  <p className={`text-xs mt-1 ${
                    adjustmentResult.projectedPercentage >= 100 ? 'text-green-500' : 'text-amber-500'
                  }`}>
                    {adjustmentResult.projectedPercentage}% del presupuesto
                  </p>
                </div>

                {adjustmentResult.adjusted && (
                  <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                    <p className="text-xs text-pink-600 mb-1">Nuevo Presupuesto Semanal</p>
                    <p className="text-xl font-bold text-pink-700">
                      {formatCurrency(adjustmentResult.newWeekBudget)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-pink-500" />
                      <p className="text-xs text-pink-500">
                        +{adjustmentResult.incrementPercentage}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Detalles de Ajuste */}
              {adjustmentResult.adjusted ? (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Presupuestos Diarios Ajustados
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {adjustmentResult.updatedBudgets?.map((budget, idx) => (
                      <motion.div
                        key={budget.date}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between bg-white rounded-lg p-3 text-sm"
                      >
                        <span className="font-medium text-gray-700">{budget.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{formatCurrency(budget.old)}</span>
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="font-bold text-green-600">{formatCurrency(budget.new)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600 mt-3 text-center">
                    ✨ Los presupuestos de los días restantes fueron ajustados automáticamente
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Razón:</strong> {adjustmentResult.reason}
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    La tienda está proyectando cerrar en <strong>{adjustmentResult.projectedPercentage}%</strong> del presupuesto, 
                    por lo que no se requiere incremento automático.
                  </p>
                </div>
              )}

              {/* Consejos */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>💡 Consejo:</strong> El ajuste automático solo incrementa el presupuesto cuando la tienda 
                  proyecta superar el 100%. Esto asegura metas realistas y alcanzables basadas en el desempeño real.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setShowResultModal(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}