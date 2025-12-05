import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Sabores Gourmet y Exclusivos según la lista oficial
const GOURMET_FLAVORS = ['Limón N.', 'Maracuyá N.', 'Mandarina N.', 'Vainilla', 'V. Francesa', 'V. Chips', 'Chocolate', 'Belga', 'Frutos', 'Fresa', 'Arequipe', 'Ron'];
const EXCLUSIVO_FLAVORS = ['Cherry', 'Arroz', 'Chicle', 'Brownie', 'Crema Limón', 'M&M', 'Milky', 'Oreo', 'Macadamia', 'Café', 'Yogurt C.'];

export default function OrderPredictionPanel({ slots }) {
  // Calcular frecuencia de cada sabor y stock levels
  const flavorAnalysis = useMemo(() => {
    const analysis = {};
    
    slots.forEach(slot => {
      if (slot.is_empty || !slot.flavor_name) return;
      
      if (!analysis[slot.flavor_name]) {
        analysis[slot.flavor_name] = {
          name: slot.flavor_name,
          type: slot.flavor_type,
          count: 0,
          low_stock: 0,
          empty: 0
        };
      }
      
      analysis[slot.flavor_name].count++;
      if (slot.stock_level === 'low') analysis[slot.flavor_name].low_stock++;
      if (slot.stock_level === 'empty') analysis[slot.flavor_name].empty++;
    });
    
    return Object.values(analysis);
  }, [slots]);

  // Clasificar sabores por movimiento (alto/bajo)
  const highMovement = flavorAnalysis
    .filter(f => f.count >= 3 || f.low_stock > 0 || f.empty > 0)
    .sort((a, b) => (b.low_stock + b.empty) - (a.low_stock + a.empty));
    
  const lowMovement = flavorAnalysis
    .filter(f => f.count <= 1 && f.low_stock === 0 && f.empty === 0);

  // Generar sugerencia de pedido
  const orderSuggestion = useMemo(() => {
    const gourmetNeeded = highMovement.filter(f => GOURMET_FLAVORS.includes(f.name));
    const exclusivoNeeded = highMovement.filter(f => EXCLUSIVO_FLAVORS.includes(f.name));
    
    return {
      gourmet: gourmetNeeded,
      exclusivo: exclusivoNeeded,
      totalCubetas: gourmetNeeded.length + exclusivoNeeded.length
    };
  }, [highMovement]);

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
          <Package className="w-4 h-4" />
          📦 Pronóstico de Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen de pedido */}
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
          <p className="text-xs text-purple-700 font-medium mb-2">Sugerencia de Pedido Próximo</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-lg font-black text-purple-600">{orderSuggestion.gourmet.length}</p>
              <p className="text-[10px] text-gray-500">Cubetas Gourmet</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-lg font-black text-pink-600">{orderSuggestion.exclusivo.length}</p>
              <p className="text-[10px] text-gray-500">Cubetas Exclusivo</p>
            </div>
          </div>
          <p className="text-center mt-2 text-xs text-purple-600 font-bold">
            Total: {orderSuggestion.totalCubetas} cubetas
          </p>
        </div>

        {/* Sabores de alto movimiento */}
        <div>
          <h5 className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Alto Movimiento (Pedir Ya)
          </h5>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {highMovement.slice(0, 10).map((flavor, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">{flavor.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                      flavor.type === 'gourmet' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {flavor.type === 'gourmet' ? '🍦 G' : '✨ E'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {flavor.empty > 0 && <AlertCircle className="w-3 h-3 text-red-500" />}
                    {flavor.low_stock > 0 && <AlertCircle className="w-3 h-3 text-amber-500" />}
                    <span className="font-bold text-emerald-600">{flavor.count}x</span>
                  </div>
                </div>
                {(flavor.low_stock > 0 || flavor.empty > 0) && (
                  <p className="text-[9px] text-red-600 mt-1">
                    ⚠️ {flavor.empty > 0 ? `${flavor.empty} vacío(s)` : ''} {flavor.low_stock > 0 ? `${flavor.low_stock} bajo(s)` : ''}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sabores de bajo movimiento */}
        {lowMovement.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Bajo Movimiento (No Pedir)
            </h5>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {lowMovement.slice(0, 5).map((flavor, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded-lg text-xs flex items-center justify-between">
                  <span className="text-gray-600">{flavor.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                    flavor.type === 'gourmet' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {flavor.type === 'gourmet' ? '🍦 G' : '✨ E'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicador de cobertura */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Cobertura de Líneas</span>
            <span className="text-xs font-bold text-purple-600">
              {orderSuggestion.gourmet.length}/{GOURMET_FLAVORS.length} G • {orderSuggestion.exclusivo.length}/{EXCLUSIVO_FLAVORS.length} E
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 w-16">Gourmet</span>
              <Progress value={(orderSuggestion.gourmet.length / GOURMET_FLAVORS.length) * 100} className="h-1.5 flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 w-16">Exclusivo</span>
              <Progress value={(orderSuggestion.exclusivo.length / EXCLUSIVO_FLAVORS.length) * 100} className="h-1.5 flex-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}