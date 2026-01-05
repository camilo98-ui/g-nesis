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

  // PEDIDO SEMANAL - Solo cubre desde que llega (JUEVES) hasta que llega el adicional (SÁBADO) = 2-3 días
  const weeklyOrder = useMemo(() => {
    const allFlavors = fullAnalysis.flavors;
    
    // Este pedido solo debe cubrir JUEVES y VIERNES (el adicional llega SÁBADO)
    const calculateNeeded = (flavor) => {
      // CASO 1: Con rotación histórica real
      if (flavor.timesRemoved > 0 && flavor.avgDaysPerRotation) {
        const diasHastaAdicional = 2.5; // Jueves a Sábado
        
        // Rotación muy rápida (< 3 días)
        if (flavor.avgDaysPerRotation <= 3) {
          const rotaciones = Math.ceil(diasHastaAdicional / flavor.avgDaysPerRotation);
          return Math.max(2, rotaciones + Math.ceil(flavor.emptyCount * 0.5));
        }
        
        // Rotación media (3-6 días)
        if (flavor.avgDaysPerRotacion <= 6) {
          // Cubrir los 2-3 días + reponer vacíos
          return Math.max(2, Math.ceil(flavor.totalCount * 0.5) + flavor.emptyCount);
        }
        
        // Rotación lenta: mínimo para mantener presencia
        return Math.max(1, Math.ceil(flavor.totalCount * 0.4));
      }
      
      // CASO 2: Sin historial
      const baseReposicion = flavor.totalCount;
      
      // Crítico: reponer para 3 días
      if (flavor.emptyCount > 0 || flavor.lowCount > 2) {
        return Math.ceil(baseReposicion * 0.6 + flavor.emptyCount);
      }
      
      // Medio: 50% del actual
      if (flavor.lowCount > 0 || flavor.coverageDays <= 4) {
        return Math.ceil(baseReposicion * 0.5);
      }
      
      // Bajo: 40%
      return Math.max(1, Math.ceil(baseReposicion * 0.4));
    };

    // Separar por línea y calcular
    const gourmetFlavors = allFlavors
      .filter(f => GOURMET_FLAVORS.includes(f.name))
      .map(f => ({
        ...f,
        needed: calculateNeeded(f),
        priority: f.coverageDays <= 2 ? 'CRÍTICO' : 
                  f.coverageDays <= 4 ? 'URGENTE' : 
                  f.rotationSpeed > 40 ? 'ALTA' : 'MEDIA'
      }))
      .filter(f => f.needed > 0)
      .sort((a, b) => {
        const priorityOrder = { 'CRÍTICO': 1, 'URGENTE': 2, 'ALTA': 3, 'MEDIA': 4 };
        return (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
      });

    const exclusivoFlavors = allFlavors
      .filter(f => EXCLUSIVO_FLAVORS.includes(f.name))
      .map(f => ({
        ...f,
        needed: calculateNeeded(f),
        priority: f.coverageDays <= 2 ? 'CRÍTICO' : 
                  f.coverageDays <= 4 ? 'URGENTE' : 
                  f.rotationSpeed > 40 ? 'ALTA' : 'MEDIA'
      }))
      .filter(f => f.needed > 0)
      .sort((a, b) => {
        const priorityOrder = { 'CRÍTICO': 1, 'URGENTE': 2, 'ALTA': 3, 'MEDIA': 4 };
        return (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
      });

    const totalGourmetCubetas = gourmetFlavors.reduce((sum, f) => sum + f.needed, 0);
    const totalExclusivoCubetas = exclusivoFlavors.reduce((sum, f) => sum + f.needed, 0);

    return {
      gourmet: gourmetFlavors,
      exclusivo: exclusivoFlavors,
      total: totalGourmetCubetas + totalExclusivoCubetas,
      totalGourmet: totalGourmetCubetas,
      totalExclusivo: totalExclusivoCubetas,
      config: storeConfig
    };
  }, [fullAnalysis, storeConfig]);

  // PEDIDO ADICIONAL - EL MÁS IMPORTANTE: cubre desde SÁBADO hasta JUEVES siguiente (5-6 días + FIN DE SEMANA)
  const additionalOrder = useMemo(() => {
    const allFlavors = fullAnalysis.flavors;
    
    const calculateAdditionalNeeded = (flavor) => {
      // Cuánto ya se pidió en el semanal
      const weeklyOrderAmount = weeklyOrder.gourmet.concat(weeklyOrder.exclusivo)
        .find(f => f.name === flavor.name)?.needed || 0;
      
      // Este pedido debe cubrir SÁBADO a JUEVES (5-6 días) INCLUYENDO FIN DE SEMANA
      const diasAdicional = 5.5; // Sábado a Jueves siguiente
      
      // CASO 1: Con rotación histórica real
      if (flavor.timesRemoved > 0 && flavor.avgDaysPerRotation) {
        // Total necesario para esos 5-6 días
        const rotacionesAdicional = Math.ceil(diasAdicional / flavor.avgDaysPerRotation);
        
        // Lo que ya tendrás después del pedido semanal
        const disponibleDespuesSemanal = flavor.totalCount + weeklyOrderAmount;
        
        // Consumo esperado en esos días
        const necesarioAdicional = rotacionesAdicional;
        
        // Faltante
        const faltante = necesarioAdicional - disponibleDespuesSemanal;
        
        if (faltante > 0) {
          // Buffer 40% porque incluye fin de semana (más ventas)
          return Math.ceil(faltante * 1.4);
        }
        
        // Rotación muy rápida siempre necesita refuerzo mid-week
        if (flavor.avgDaysPerRotation <= 3 && disponibleDespuesSemanal < 4) {
          return Math.ceil((4 - disponibleDespuesSemanal) * 1.3);
        }
        
        return 0;
      }
      
      // CASO 2: Sin historial
      const disponibleDespuesSemanal = flavor.totalCount + weeklyOrderAmount;
      const necesarioTotal = Math.ceil(flavor.totalCount * 1.5); // Estimar necesidad para 5-6 días
      
      // Crítico: necesita refuerzo fuerte
      if (flavor.emptyCount > 0 || flavor.lowCount > 2) {
        const faltante = Math.max(necesarioTotal - disponibleDespuesSemanal, flavor.emptyCount);
        return Math.ceil(faltante * 1.3);
      }
      
      // Medio: calcular faltante
      if (flavor.coverageDays <= 4 || flavor.rotationSpeed > 30) {
        const faltante = necesarioTotal - disponibleDespuesSemanal;
        if (faltante > 0) {
          return Math.ceil(faltante * 1.2);
        }
      }
      
      // Bajo: solo si hay déficit claro
      if (disponibleDespuesSemanal < flavor.totalCount) {
        return Math.ceil((flavor.totalCount - disponibleDespuesSemanal) * 0.8);
      }
      
      return 0;
    };

    const gourmetFlavors = allFlavors
      .filter(f => GOURMET_FLAVORS.includes(f.name))
      .map(f => {
        const needed = calculateAdditionalNeeded(f);
        const weeklyAmount = weeklyOrder.gourmet.find(wf => wf.name === f.name)?.needed || 0;
        return {
          ...f,
          needed,
          weeklyOrderAmount: weeklyAmount,
          reason: needed > 0 ? (
            f.avgDaysPerRotation && f.avgDaysPerRotation <= 3 
              ? `Rota cada ${f.avgDaysPerRotation.toFixed(1)}d - necesita más mid-week` 
              : f.coverageDays <= 2 
              ? 'Sigue crítico después del semanal' 
              : 'Alta demanda mid-week'
          ) : ''
        };
      })
      .filter(f => f.needed > 0)
      .sort((a, b) => (a.avgDaysPerRotation || 99) - (b.avgDaysPerRotation || 99));

    const exclusivoFlavors = allFlavors
      .filter(f => EXCLUSIVO_FLAVORS.includes(f.name))
      .map(f => {
        const needed = calculateAdditionalNeeded(f);
        const weeklyAmount = weeklyOrder.exclusivo.find(wf => wf.name === f.name)?.needed || 0;
        return {
          ...f,
          needed,
          weeklyOrderAmount: weeklyAmount,
          reason: needed > 0 ? (
            f.avgDaysPerRotation && f.avgDaysPerRotation <= 3 
              ? `Rota cada ${f.avgDaysPerRotation.toFixed(1)}d - necesita más mid-week` 
              : f.coverageDays <= 2 
              ? 'Sigue crítico después del semanal' 
              : 'Alta demanda mid-week'
          ) : ''
        };
      })
      .filter(f => f.needed > 0)
      .sort((a, b) => (a.avgDaysPerRotation || 99) - (b.avgDaysPerRotation || 99));

    const totalGourmetCubetas = gourmetFlavors.reduce((sum, f) => sum + f.needed, 0);
    const totalExclusivoCubetas = exclusivoFlavors.reduce((sum, f) => sum + f.needed, 0);

    return {
      gourmet: gourmetFlavors,
      exclusivo: exclusivoFlavors,
      total: totalGourmetCubetas + totalExclusivoCubetas,
      totalGourmet: totalGourmetCubetas,
      totalExclusivo: totalExclusivoCubetas,
      config: storeConfig
    };
  }, [fullAnalysis, storeConfig, weeklyOrder]);

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
          {/* Resumen Simple */}
          <div className={`rounded-xl p-4 border-2 ${
            activeTab === 'semanal' 
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
              : 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-300'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-black text-gray-900">
                  {activeTab === 'semanal' ? '📦 Pedido Semanal' : '⚡ Pedido Adicional'}
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {activeTab === 'semanal' 
                    ? `Montar ${storeConfig.semanal} para recibir ${storeConfig.entregaSemanal}`
                    : `Montar ${storeConfig.adicional1} para recibir ${storeConfig.entregaAdicional1}`
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-gray-900">{currentOrder.total}</p>
                <p className="text-[10px] text-gray-500">cubetas</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/60 rounded-lg p-2.5 text-center border border-blue-200">
                <p className="text-blue-900 font-black text-xl">{currentOrder.totalGourmet || 0}</p>
                <p className="text-blue-700 text-[10px] font-bold">🍦 Gourmet</p>
              </div>
              <div className="bg-white/60 rounded-lg p-2.5 text-center border border-pink-200">
                <p className="text-pink-900 font-black text-xl">{currentOrder.totalExclusivo || 0}</p>
                <p className="text-pink-700 text-[10px] font-bold">✨ Exclusivo</p>
              </div>
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

                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-blue-900 text-sm">{flavor.name}</span>
                          <span className="font-black text-blue-700 text-2xl">{flavor.needed}x</span>
                        </div>
                        
                        <div className="space-y-1.5">
                          <p className="text-[11px] text-gray-700 leading-relaxed">
                            📍 Está en Nevera {Array.from(flavor.freezers).join(', ')}, Bajada {Array.from(flavor.rows).join(', ')}
                          </p>
                          
                          {flavor.avgDaysPerRotation ? (
                            <p className="text-[11px] text-gray-700 leading-relaxed">
                              🔄 Se agota cada <span className="font-bold text-red-600">{flavor.avgDaysPerRotation.toFixed(1)} días</span>
                              {flavor.timesRemoved > 0 && ` (se ha cambiado ${flavor.timesRemoved} veces)`}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-700 leading-relaxed">
                              ⚠️ Stock {flavor.coverageDays <= 2 ? 'crítico' : 'bajo'} - dura solo {flavor.coverageDays} días
                            </p>
                          )}
                          
                          {activeTab === 'adicional' && flavor.weeklyOrderAmount > 0 && (
                            <p className="text-[11px] text-blue-700 font-medium bg-blue-50 rounded px-2 py-1">
                              ℹ️ Ya pediste {flavor.weeklyOrderAmount}x en el pedido semanal. Esto es adicional.
                            </p>
                          )}
                        </div>
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
                        {activeTab === 'adicional' && flavor.weeklyOrderAmount > 0 && (
                          <div className="mt-1.5 p-1.5 bg-blue-50 rounded border border-blue-200">
                            <p className="text-[9px] text-blue-700 font-medium">
                              ℹ️ Ya pediste <span className="font-black">{flavor.weeklyOrderAmount}x</span> en pedido semanal
                            </p>
                          </div>
                        )}
                        {flavor.reason &&
                      <p className="text-[9px] text-gray-500 mt-1 italic">💡 {flavor.reason}</p>
                      }
                      </motion.div>
                  )}
                  </div>
                </div>
              }

              {currentOrder.total === 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-700 mb-1">
                    ✅ Stock Óptimo
                  </p>
                  <p className="text-xs text-emerald-600">
                    {activeTab === 'semanal' 
                      ? 'Todos los sabores tienen buena cobertura para esta semana' 
                      : 'No se requiere pedido adicional mid-week'}
                  </p>
                  <p className="text-[10px] text-emerald-500 mt-2">
                    💡 Continúa monitoreando la rotación diariamente
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Explicación Simple */}
          <div className={`rounded-xl p-4 border-2 ${
            activeTab === 'semanal' 
              ? 'bg-blue-50/70 border-blue-300'
              : 'bg-pink-50/70 border-pink-300'
          }`}>
            <p className="text-sm text-gray-900 leading-relaxed font-medium mb-2">
              {activeTab === 'semanal' ? (
                <>
                  <span className="font-black text-blue-700">📦 Pedido Semanal:</span> Incluye todos los sabores que están en tus neveras, calculado para que duren toda la semana.
                </>
              ) : (
                <>
                  <span className="font-black text-pink-700">⚡ Pedido Adicional:</span> Solo los sabores más rápidos que necesitan refuerzo mid-week.
                </>
              )}
            </p>
            <div className="space-y-1.5 text-xs text-gray-700">
              {activeTab === 'semanal' ? (
                <>
                  <p>• Montas el <span className="font-bold text-blue-700">{storeConfig.semanal}</span> • Llega <span className="font-bold text-blue-700">{storeConfig.entregaSemanal}</span></p>
                  <p>• Solo cubre <span className="font-bold">{storeConfig.entregaSemanal}</span> y día siguiente (~2-3 días)</p>
                  <p className="pt-1 text-blue-700 font-semibold">⚠️ No intentes que dure toda la semana, el adicional es el importante</p>
                </>
              ) : (
                <>
                  <p>• Montas el <span className="font-bold text-pink-700">{storeConfig.adicional1}</span> • Llega <span className="font-bold text-pink-700">{storeConfig.entregaAdicional1}</span></p>
                  <p>• <span className="font-black">Debe durar hasta el próximo {storeConfig.entregaSemanal}</span> (5-6 días)</p>
                  <p>• Incluye TODO EL FIN DE SEMANA (cuando más vendes)</p>
                  <p className="pt-1 text-pink-700 font-semibold">🔥 Este es el pedido principal - debe ser más grande</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>);

}