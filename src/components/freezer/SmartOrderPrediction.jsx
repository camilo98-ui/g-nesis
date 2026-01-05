import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, TrendingUp, AlertCircle, CheckCircle, Calendar, Zap, BarChart3, Sparkles, ShoppingCart, Brain, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { parseISO, differenceInDays, subDays } from 'date-fns';

const GOURMET_FLAVORS = ['Limón N.', 'Maracuyá N.', 'Mandarina N.', 'Vainilla', 'V. Francesa', 'V. Chips', 'Chocolate', 'Belga', 'Frutos', 'Fresa', 'Arequipe', 'Ron'];
const EXCLUSIVO_FLAVORS = ['Cherry', 'Arroz', 'Chicle', 'Brownie', 'Crema Limón', 'M&M', 'Milky', 'Oreo', 'Macadamia', 'Café', 'Yogurt C.'];

// Configuración de frecuencias de pedido por tienda
const STORE_ORDER_CONFIG = {
  'BTA 11': { semanal: 'MAR', adicional1: 'JUE', entregaSemanal: 'JUE', entregaAdicional1: 'SAB' },
  'BTA 37': { semanal: 'VIE', adicional1: 'MAR', entregaSemanal: 'MAR', entregaAdicional1: 'JUE' },
  'BTA 62': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'BTA 49': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'BTA 42': { semanal: 'VIE', adicional1: 'MIE', entregaSemanal: 'MAR', entregaAdicional1: 'VIE' },
  'BTA 52': { semanal: 'VIE', adicional1: 'MIE', entregaSemanal: 'MAR', entregaAdicional1: 'VIE' },
  'BTA 21': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'BTA 78': { semanal: 'LUN', adicional1: 'JUE', entregaSemanal: 'MIE', entregaAdicional1: 'SAB' },
  'BTA 18': { semanal: 'VIE', adicional1: 'MAR', entregaSemanal: 'MAR', entregaAdicional1: 'JUE' },
  'TUNJA 1': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'BTA 90': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'BTA 59': { semanal: 'MAR', adicional1: 'JUE', entregaSemanal: 'JUE', entregaAdicional1: 'SAB' },
  'BTA 14': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'BTA 28': { semanal: 'LUN', adicional1: 'JUE', entregaSemanal: 'MIE', entregaAdicional1: 'SAB' },
  'BTA 89': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'BTA 16': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'BTA 13': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'TUNJA 2': { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' },
  'BTA 85': { semanal: 'VIE', adicional2: 'JUE', entregaSemanal: 'MAR', entregaAdicional2: 'SAB' }
};

export default function SmartOrderPrediction({ allFreezersSlots = [], currentFreezer, storeCode, storeId }) {
  const [activeTab, setActiveTab] = useState('semanal'); // semanal o adicional

  // Obtener historial de neveras para análisis de rotación
  const { data: freezerHistory = [] } = useQuery({
    queryKey: ['freezerHistory', storeId],
    queryFn: () => base44.entities.FreezerHistory.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Obtener configuración de la tienda
  const storeConfig = useMemo(() => {
    return STORE_ORDER_CONFIG[storeCode] || { semanal: 'VIE', adicional1: 'JUE', entregaSemanal: 'MAR', entregaAdicional1: 'SAB' };
  }, [storeCode]);

  // ANÁLISIS DE ROTACIÓN HISTÓRICA
  const rotationAnalysis = useMemo(() => {
    if (!freezerHistory || freezerHistory.length < 2) return {};

    const flavorRotations = {};
    const sortedHistory = [...freezerHistory].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Analizar cambios entre snapshots consecutivos
    for (let i = 1; i < sortedHistory.length; i++) {
      const prevSnapshot = JSON.parse(sortedHistory[i - 1].snapshot || '[]');
      const currSnapshot = JSON.parse(sortedHistory[i].snapshot || '[]');
      const daysDiff = differenceInDays(parseISO(sortedHistory[i].date), parseISO(sortedHistory[i - 1].date));

      // Crear mapa de slots previos
      const prevMap = {};
      prevSnapshot.forEach(slot => {
        const key = `${slot.row}-${slot.position}-${slot.slot_type}`;
        prevMap[key] = slot;
      });

      // Detectar cambios
      currSnapshot.forEach(slot => {
        const key = `${slot.row}-${slot.position}-${slot.slot_type}`;
        const prevSlot = prevMap[key];

        if (prevSlot && prevSlot.flavor_name && !prevSlot.is_empty) {
          const flavorKey = prevSlot.flavor_name.toLowerCase().trim();
          
          if (!flavorRotations[flavorKey]) {
            flavorRotations[flavorKey] = {
              name: prevSlot.flavor_name,
              type: prevSlot.flavor_type,
              timesRemoved: 0,
              timesAdded: 0,
              totalDays: 0,
              avgDaysPerRotation: 0,
              freezers: new Set()
            };
          }

          // Si cambió a vacío o a otro sabor, se "removió"
          if (slot.is_empty || slot.flavor_name !== prevSlot.flavor_name) {
            flavorRotations[flavorKey].timesRemoved++;
            flavorRotations[flavorKey].totalDays += daysDiff;
            flavorRotations[flavorKey].freezers.add(slot.store_id?.split('_F')[1] || '1');
          }
        }

        // Detectar sabores nuevos agregados
        if (slot.flavor_name && !slot.is_empty) {
          const flavorKey = slot.flavor_name.toLowerCase().trim();
          if (!prevSlot || prevSlot.is_empty || prevSlot.flavor_name !== slot.flavor_name) {
            if (!flavorRotations[flavorKey]) {
              flavorRotations[flavorKey] = {
                name: slot.flavor_name,
                type: slot.flavor_type,
                timesRemoved: 0,
                timesAdded: 0,
                totalDays: 0,
                avgDaysPerRotation: 0,
                freezers: new Set()
              };
            }
            flavorRotations[flavorKey].timesAdded++;
            flavorRotations[flavorKey].freezers.add(slot.store_id?.split('_F')[1] || '1');
          }
        }
      });
    }

    // Calcular promedio de días por rotación
    Object.values(flavorRotations).forEach(flavor => {
      if (flavor.timesRemoved > 0) {
        flavor.avgDaysPerRotation = flavor.totalDays / flavor.timesRemoved;
        // Velocidad de rotación: menos días = más rápido
        flavor.rotationVelocity = flavor.avgDaysPerRotation > 0 ? (7 / flavor.avgDaysPerRotation) * 100 : 0;
      } else {
        flavor.avgDaysPerRotation = 99; // Sin datos
        flavor.rotationVelocity = 0;
      }
    });

    return flavorRotations;
  }, [freezerHistory]);

  // ANÁLISIS COMPLETO CON ROTACIÓN HISTÓRICA
  const fullAnalysis = useMemo(() => {
    if (!allFreezersSlots || allFreezersSlots.length === 0) return { 
      flavors: [], total: 0, low: 0, empty: 0, critical: 0, 
      averageRotation: 0, coverageDays: 0 
    };

    const analysis = {};
    let totalFilled = 0;
    let lowStock = 0;
    let emptyStock = 0;
    let criticalStock = 0;

    allFreezersSlots.forEach((slot) => {
      if (slot.is_empty || !slot.flavor_name) return;

      const key = slot.flavor_name.toLowerCase().trim();
      if (!analysis[key]) {
        analysis[key] = {
          name: slot.flavor_name,
          type: slot.flavor_type,
          totalCount: 0,
          fullCount: 0,
          mediumCount: 0,
          lowCount: 0,
          emptyCount: 0,
          freezers: new Set(),
          avgStock: 0,
          rows: new Set() // Bajadas donde está presente
        };
      }

      analysis[key].totalCount++;
      analysis[key].freezers.add(slot.store_id?.split('_F')[1] || '1');
      analysis[key].rows.add(slot.row);
      totalFilled++;

      // Análisis más detallado del stock
      if (slot.stock_level === 'full') {
        analysis[key].fullCount++;
      } else if (slot.stock_level === 'medium') {
        analysis[key].mediumCount++;
      } else if (slot.stock_level === 'low') {
        analysis[key].lowCount++;
        lowStock++;
      } else if (slot.stock_level === 'empty') {
        analysis[key].emptyCount++;
        emptyStock++;
      }
    });

    // Combinar con datos de rotación histórica
    Object.entries(analysis).forEach(([key, flavor]) => {
      const historicalData = rotationAnalysis[key];
      
      // Promedio de stock (full=100%, medium=60%, low=30%, empty=0%)
      const stockValue = (flavor.fullCount * 100 + flavor.mediumCount * 60 + flavor.lowCount * 30) / flavor.totalCount;
      flavor.avgStock = stockValue;
      
      // Si hay datos históricos, usar velocidad real
      if (historicalData && historicalData.timesRemoved > 0) {
        flavor.rotationSpeed = historicalData.rotationVelocity;
        flavor.avgDaysPerRotation = historicalData.avgDaysPerRotation;
        flavor.timesRemoved = historicalData.timesRemoved;
        flavor.timesAdded = historicalData.timesAdded;
        
        // Días de cobertura basados en rotación real
        const currentDaysLeft = Math.max(0, flavor.avgDaysPerRotation - 1);
        flavor.coverageDays = Math.ceil((stockValue / 100) * currentDaysLeft);
      } else {
        // Estimación básica sin historial
        flavor.rotationSpeed = ((flavor.lowCount + flavor.emptyCount * 2) / flavor.totalCount) * 100;
        flavor.coverageDays = Math.ceil((stockValue / 20) * (7 - (flavor.rotationSpeed / 20)));
        flavor.avgDaysPerRotation = null;
        flavor.timesRemoved = 0;
        flavor.timesAdded = 0;
      }
      
      // Marcar como crítico
      if (flavor.coverageDays < 3 || flavor.emptyCount > 0) {
        criticalStock++;
      }
    });

    const flavorsArray = Object.values(analysis);
    const avgRotation = flavorsArray.length > 0 
      ? flavorsArray.reduce((sum, f) => sum + f.rotationSpeed, 0) / flavorsArray.length 
      : 0;
    
    const avgCoverage = flavorsArray.length > 0
      ? flavorsArray.reduce((sum, f) => sum + f.coverageDays, 0) / flavorsArray.length
      : 7;

    return {
      flavors: flavorsArray,
      total: totalFilled,
      low: lowStock,
      empty: emptyStock,
      critical: criticalStock,
      averageRotation: avgRotation,
      coverageDays: Math.round(avgCoverage)
    };
  }, [allFreezersSlots, rotationAnalysis]);

  // Clasificación inteligente considerando días de cobertura y rotación
  const { critical, urgent, highRotation, mediumRotation, lowRotation } = useMemo(() => {
    const flavors = fullAnalysis.flavors;

    return {
      // CRÍTICO: < 2 días de cobertura o vacíos
      critical: flavors.filter((f) => f.coverageDays <= 2 || f.emptyCount > 0)
        .sort((a, b) => (a.coverageDays - b.coverageDays) || (b.emptyCount - a.emptyCount)),
      
      // URGENTE: 2-4 días de cobertura o más de 1 bajo
      urgent: flavors.filter((f) => (f.coverageDays > 2 && f.coverageDays <= 4) || f.lowCount >= 2)
        .sort((a, b) => (a.coverageDays - b.coverageDays)),
      
      // ALTA ROTACIÓN: buenos niveles pero rotación rápida (>40%)
      highRotation: flavors.filter((f) => 
        f.coverageDays > 4 && f.rotationSpeed > 40 && f.emptyCount === 0 && f.lowCount < 2
      ).sort((a, b) => b.rotationSpeed - a.rotationSpeed),
      
      // ROTACIÓN MEDIA: rotación 20-40%, cobertura adecuada
      mediumRotation: flavors.filter((f) => 
        f.coverageDays > 4 && f.rotationSpeed >= 20 && f.rotationSpeed <= 40
      ).sort((a, b) => b.rotationSpeed - a.rotationSpeed),
      
      // BAJA ROTACIÓN: rotación < 20%, buen stock
      lowRotation: flavors.filter((f) => 
        f.rotationSpeed < 20 && f.emptyCount === 0 && f.lowCount === 0
      ).sort((a, b) => a.rotationSpeed - b.rotationSpeed)
    };
  }, [fullAnalysis]);

  // PEDIDO SEMANAL - Análisis de demanda para cobertura 7 días
  const weeklyOrder = useMemo(() => {
    // Calcular necesidad basada en días de cobertura hasta próxima entrega
    const calculateNeeded = (flavor, isPriority = false) => {
      // Si es prioritario (crítico/urgente), pedir para cubrir 7 días completos
      if (isPriority) {
        // Proyección: si tiene baja cobertura, necesita reposición completa
        const neededSlots = Math.max(
          flavor.totalCount, // Mínimo: reponer lo que hay
          Math.ceil((flavor.lowCount + flavor.emptyCount) * 1.5) // Extra para críticos
        );
        return Math.min(neededSlots, flavor.totalCount + 2); // Límite: actual + 2 cubetas máximo
      }
      
      // Para alta rotación, reponer parcialmente según velocidad
      if (flavor.rotationSpeed > 40) {
        return Math.ceil(flavor.totalCount * 0.7); // 70% de reposición
      }
      
      // Para rotación media, reposición conservadora
      return Math.ceil(flavor.totalCount * 0.5); // 50% de reposición
    };

    // Construir pedido semanal con lógica de demanda
    const gourmetCritical = critical.filter(f => GOURMET_FLAVORS.includes(f.name));
    const gourmetUrgent = urgent.filter(f => GOURMET_FLAVORS.includes(f.name));
    const gourmetHigh = highRotation.filter(f => GOURMET_FLAVORS.includes(f.name)).slice(0, 3);
    const gourmetMedium = mediumRotation.filter(f => GOURMET_FLAVORS.includes(f.name)).slice(0, 2);

    const exclusivoCritical = critical.filter(f => EXCLUSIVO_FLAVORS.includes(f.name));
    const exclusivoUrgent = urgent.filter(f => EXCLUSIVO_FLAVORS.includes(f.name));
    const exclusivoHigh = highRotation.filter(f => EXCLUSIVO_FLAVORS.includes(f.name)).slice(0, 3);
    const exclusivoMedium = mediumRotation.filter(f => EXCLUSIVO_FLAVORS.includes(f.name)).slice(0, 2);

    // Aplicar cálculo de necesidad
    const allGourmet = [
      ...gourmetCritical.map(f => ({ ...f, needed: calculateNeeded(f, true), priority: 'CRÍTICO' })),
      ...gourmetUrgent.map(f => ({ ...f, needed: calculateNeeded(f, true), priority: 'URGENTE' })),
      ...gourmetHigh.map(f => ({ ...f, needed: calculateNeeded(f, false), priority: 'ALTA' })),
      ...gourmetMedium.map(f => ({ ...f, needed: calculateNeeded(f, false), priority: 'MEDIA' }))
    ];

    const allExclusivo = [
      ...exclusivoCritical.map(f => ({ ...f, needed: calculateNeeded(f, true), priority: 'CRÍTICO' })),
      ...exclusivoUrgent.map(f => ({ ...f, needed: calculateNeeded(f, true), priority: 'URGENTE' })),
      ...exclusivoHigh.map(f => ({ ...f, needed: calculateNeeded(f, false), priority: 'ALTA' })),
      ...exclusivoMedium.map(f => ({ ...f, needed: calculateNeeded(f, false), priority: 'MEDIA' }))
    ];

    const totalGourmetCubetas = allGourmet.reduce((sum, f) => sum + f.needed, 0);
    const totalExclusivoCubetas = allExclusivo.reduce((sum, f) => sum + f.needed, 0);

    return {
      gourmet: allGourmet,
      exclusivo: allExclusivo,
      total: totalGourmetCubetas + totalExclusivoCubetas,
      config: storeConfig
    };
  }, [critical, urgent, highRotation, mediumRotation, storeConfig]);

  // PEDIDO ADICIONAL - Reposición mid-week táctica
  const additionalOrder = useMemo(() => {
    // Lógica: reponer lo que está bajando después del pedido semanal
    // Enfoque conservador: solo lo que realmente necesita reposición urgente mid-week
    
    const calculateAdditionalNeeded = (flavor) => {
      // Si tiene < 3 días de cobertura, necesita reposición
      if (flavor.coverageDays <= 3) {
        return Math.ceil(flavor.totalCount * 0.6); // 60% de reposición
      }
      // Si solo 1-2 slots bajos, reponer mínimo
      if (flavor.lowCount >= 1 && flavor.lowCount <= 2) {
        return Math.min(flavor.lowCount + 1, flavor.totalCount);
      }
      return 0;
    };

    // Sabores que necesitan reposición mid-week
    const gourmetNeeded = [
      ...urgent.filter(f => GOURMET_FLAVORS.includes(f.name)),
      ...mediumRotation.filter(f => GOURMET_FLAVORS.includes(f.name) && f.coverageDays <= 4)
    ];

    const exclusivoNeeded = [
      ...urgent.filter(f => EXCLUSIVO_FLAVORS.includes(f.name)),
      ...mediumRotation.filter(f => EXCLUSIVO_FLAVORS.includes(f.name) && f.coverageDays <= 4)
    ];

    const allGourmet = gourmetNeeded.map(f => ({ 
      ...f, 
      needed: calculateAdditionalNeeded(f),
      reason: f.coverageDays <= 3 ? 'Cobertura baja' : 'Reposición preventiva'
    })).filter(f => f.needed > 0);

    const allExclusivo = exclusivoNeeded.map(f => ({ 
      ...f, 
      needed: calculateAdditionalNeeded(f),
      reason: f.coverageDays <= 3 ? 'Cobertura baja' : 'Reposición preventiva'
    })).filter(f => f.needed > 0);

    const totalGourmetCubetas = allGourmet.reduce((sum, f) => sum + f.needed, 0);
    const totalExclusivoCubetas = allExclusivo.reduce((sum, f) => sum + f.needed, 0);

    return {
      gourmet: allGourmet,
      exclusivo: allExclusivo,
      total: totalGourmetCubetas + totalExclusivoCubetas,
      config: storeConfig
    };
  }, [urgent, mediumRotation, storeConfig]);

  const currentOrder = activeTab === 'semanal' ? weeklyOrder : additionalOrder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4">

      {/* Header con pestañas */}
      <Card className="border-2 border-purple-200 shadow-lg overflow-hidden">
        <div className="bg-pink-700 p-4 from-purple-500 to-pink-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">📦 Pronóstico de Pedido</h3>
                <p className="text-xs text-white/80">
                  {storeCode ? `${storeCode} • ` : ''}
                  {fullAnalysis.flavors.length} sabores • 
                  Cobertura: {fullAnalysis.coverageDays} días
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">

              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('semanal')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'semanal' ?
              'bg-white text-purple-600 shadow-lg' :
              'bg-white/20 text-white hover:bg-white/30'}`
              }>

              <Calendar className="w-4 h-4 inline mr-1" />
              Pedido Semanal
            </button>
            <button
              onClick={() => setActiveTab('adicional')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'adicional' ?
              'bg-white text-pink-600 shadow-lg' :
              'bg-white/20 text-white hover:bg-white/30'}`
              }>

              <Zap className="w-4 h-4 inline mr-1" />
              Adicional
            </button>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Info de pedido y entrega */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-200 mb-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-indigo-600 font-bold mb-0.5">
                  📅 Montaje: {currentOrder.config?.[activeTab === 'semanal' ? 'semanal' : 'adicional1']}
                </p>
                <p className="text-indigo-500 text-[10px]">
                  🚚 Entrega: {currentOrder.config?.[activeTab === 'semanal' ? 'entregaSemanal' : 'entregaAdicional1']}
                </p>
              </div>
              <div className="text-right">
                <p className="text-indigo-900 font-black text-lg">{currentOrder.total}</p>
                <p className="text-indigo-600 text-[10px] font-medium">Cubetas totales</p>
              </div>
            </div>
          </div>

          {/* Métricas clave */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
              <p className="text-xs font-black text-red-700">{fullAnalysis.critical}</p>
              <p className="text-[9px] text-red-600">Críticos</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
              <p className="text-xs font-black text-amber-700">{fullAnalysis.empty + fullAnalysis.low}</p>
              <p className="text-[9px] text-amber-600">Bajos/Vacíos</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <p className="text-xs font-black text-blue-700">{fullAnalysis.averageRotation.toFixed(0)}%</p>
              <p className="text-[9px] text-blue-600">Rotación</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-xs font-black text-emerald-700">{fullAnalysis.coverageDays}d</p>
              <p className="text-[9px] text-emerald-600">Cobertura</p>
            </div>
          </div>

          {/* Descripción analítica del pedido */}
          <div className={`p-3 rounded-xl border-2 ${
          activeTab === 'semanal' ?
          'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300' :
          'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300'}`
          }>
            <p className="text-xs font-bold mb-1.5 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {activeTab === 'semanal' ? '🎯 Pedido Semanal - Cobertura 7 días' : '⚡ Pedido Adicional - Reposición Táctica'}
            </p>
            <p className="text-[10px] text-gray-700 leading-relaxed mb-2">
              {activeTab === 'semanal' ?
              `Pedido estratégico para ${storeConfig.entregaSemanal}. Incluye ${critical.length} críticos, ${urgent.length} urgentes y sabores de alta rotación. Calculado para mantener operación hasta próximo pedido.` :
              `Reposición mid-week para ${storeConfig.entregaAdicional1}. Enfocado en sabores con cobertura < 4 días. Evita quiebre de stock entre entregas principales.`}
            </p>
            <div className="flex items-center gap-2 text-[9px] text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                Monta: {activeTab === 'semanal' ? storeConfig.semanal : storeConfig.adicional1}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" />
                Llega: {activeTab === 'semanal' ? storeConfig.entregaSemanal : storeConfig.entregaAdicional1}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3">

              {/* Sabores Gourmet */}
              {currentOrder.gourmet.length > 0 &&
              <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-blue-700 flex items-center gap-1">
                      🍦 Gourmet ({currentOrder.gourmet.length})
                    </h4>
                    <Progress value={currentOrder.gourmet.length / GOURMET_FLAVORS.length * 100} className="h-1.5 w-24" />
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {currentOrder.gourmet.map((flavor, i) =>
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">

                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-blue-800 text-sm">{flavor.name}</span>
                          <div className="flex items-center gap-2">
                            {flavor.priority === 'CRÍTICO' &&
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                                CRÍTICO
                              </span>
                        }
                            {flavor.priority === 'URGENTE' &&
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full">
                                URGENTE
                              </span>
                        }
                            {flavor.priority === 'ALTA' &&
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                                ALTA
                              </span>
                        }
                            <span className="font-black text-blue-600 text-base">{flavor.needed || flavor.totalCount}x</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-600">
                          <span>🏪 N{Array.from(flavor.freezers).join(', ')} • 📍 B{Array.from(flavor.rows).join(', ')}</span>
                          <span className={`font-medium ${flavor.rotationSpeed > 50 ? 'text-red-600' : flavor.rotationSpeed > 30 ? 'text-amber-600' : 'text-green-600'}`}>
                              ⚡ {flavor.avgDaysPerRotation ? `${flavor.avgDaysPerRotation.toFixed(1)}d rot` : `${flavor.rotationSpeed.toFixed(0)}% rot`}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-500 mt-0.5">
                          <span>📊 {flavor.coverageDays}d cobertura</span>
                          {flavor.timesRemoved > 0 && (
                            <span className="flex items-center gap-1">
                              <ArrowDownCircle className="w-2.5 h-2.5 text-red-500" />
                              {flavor.timesRemoved}x
                              <ArrowUpCircle className="w-2.5 h-2.5 text-green-500 ml-1" />
                              {flavor.timesAdded}x
                            </span>
                          )}
                        </div>
                        {flavor.reason &&
                      <p className="text-[9px] text-gray-500 mt-1 italic">💡 {flavor.reason}</p>
                      }
                      </motion.div>
                  )}
                  </div>
                </div>
              }

              {/* Sabores Exclusivo */}
              {currentOrder.exclusivo.length > 0 &&
              <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-pink-700 flex items-center gap-1">
                      ✨ Exclusivo ({currentOrder.exclusivo.length})
                    </h4>
                    <Progress value={currentOrder.exclusivo.length / EXCLUSIVO_FLAVORS.length * 100} className="h-1.5 w-24" />
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {currentOrder.exclusivo.map((flavor, i) =>
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-2.5 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200 hover:shadow-md transition-shadow">

                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-pink-800 text-sm">{flavor.name}</span>
                          <div className="flex items-center gap-2">
                            {flavor.priority === 'CRÍTICO' &&
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                                CRÍTICO
                              </span>
                        }
                            {flavor.priority === 'URGENTE' &&
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full">
                                URGENTE
                              </span>
                        }
                            {flavor.priority === 'ALTA' &&
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                                ALTA
                              </span>
                        }
                            <span className="font-black text-pink-600 text-base">{flavor.needed || flavor.totalCount}x</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-600">
                          <span>🏪 N{Array.from(flavor.freezers).join(', ')} • 📍 B{Array.from(flavor.rows).join(', ')}</span>
                          <span className={`font-medium ${flavor.rotationSpeed > 50 ? 'text-red-600' : flavor.rotationSpeed > 30 ? 'text-amber-600' : 'text-green-600'}`}>
                              ⚡ {flavor.avgDaysPerRotation ? `${flavor.avgDaysPerRotation.toFixed(1)}d rot` : `${flavor.rotationSpeed.toFixed(0)}% rot`}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-500 mt-0.5">
                          <span>📊 {flavor.coverageDays}d cobertura</span>
                          {flavor.timesRemoved > 0 && (
                            <span className="flex items-center gap-1">
                              <ArrowDownCircle className="w-2.5 h-2.5 text-red-500" />
                              {flavor.timesRemoved}x
                              <ArrowUpCircle className="w-2.5 h-2.5 text-green-500 ml-1" />
                              {flavor.timesAdded}x
                            </span>
                          )}
                        </div>
                        {flavor.reason &&
                      <p className="text-[9px] text-gray-500 mt-1 italic">💡 {flavor.reason}</p>
                      }
                      </motion.div>
                  )}
                  </div>
                </div>
              }

              {currentOrder.total === 0 &&
              <div className="text-center py-6 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium text-green-600">
                    {activeTab === 'semanal' ? 'Stock completo' : 'No se requiere pedido adicional'}
                  </p>
                </div>
              }
            </motion.div>
          </AnimatePresence>

          {/* Inventario Actual */}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-[10px] font-bold text-emerald-900 mb-1.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                📦 Con Qué Puedo Continuar
              </p>
              <div className="grid grid-cols-3 gap-2 text-[9px]">
                <div className="text-center">
                  <div className="text-emerald-700 font-black text-base">{fullAnalysis.total}</div>
                  <div className="text-emerald-600">Cubetas Total</div>
                </div>
                <div className="text-center">
                  <div className="text-green-700 font-black text-base">
                    {fullAnalysis.flavors.filter(f => f.avgStock >= 60).length}
                  </div>
                  <div className="text-green-600">Stock OK</div>
                </div>
                <div className="text-center">
                  <div className="text-amber-700 font-black text-base">
                    {fullAnalysis.low + fullAnalysis.empty}
                  </div>
                  <div className="text-amber-600">Necesita</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-200">
              <p className="text-[10px] font-bold text-purple-900 mb-1.5 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                📊 Análisis de Rotación Histórica
              </p>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div>
                  <span className="text-red-700 font-bold">{critical.length} Críticos</span> ({"<"}2d)
                </div>
                <div>
                  <span className="text-orange-700 font-bold">{urgent.length} Urgentes</span> (2-4d)
                </div>
                <div>
                  <span className="text-amber-700 font-bold">{highRotation.length} Alta Rotación</span> ({">"}40%)
                </div>
                <div>
                  <span className="text-green-700 font-bold">
                    {fullAnalysis.flavors.filter(f => f.timesRemoved > 0).length} Con Historial
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-2.5 border border-blue-200">
              <p className="text-[9px] text-blue-900 leading-relaxed">
                <span className="font-bold">💡 Recomendación:</span>{' '}
                {activeTab === 'semanal' 
                  ? `Monta este pedido el ${storeConfig.semanal} para recibir ${storeConfig.entregaSemanal}. Prioriza sabores críticos y urgentes para evitar quiebres.`
                  : `Complementa mid-week el ${storeConfig.adicional1} para llegar ${storeConfig.entregaAdicional1}. Enfócate solo en sabores con cobertura crítica.`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>);

}