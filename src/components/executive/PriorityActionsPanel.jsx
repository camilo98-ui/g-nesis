import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  TrendingUp, AlertTriangle, Target, Zap, CheckCircle, ArrowRight,
  TrendingDown, Flame, Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PriorityActionsPanel({ storesAnalysis, formatCurrency, zoneTotals }) {
  const actions = useMemo(() => {
    const priorityActions = [];

    // 1. Tiendas críticas que requieren intervención inmediata
    const critical = storesAnalysis.filter(s => s.status === 'critical');
    if (critical.length > 0) {
      priorityActions.push({
        type: 'critical',
        icon: AlertTriangle,
        title: 'Intervención Inmediata',
        description: `${critical.length} tienda${critical.length > 1 ? 's' : ''} en riesgo crítico (<70%)`,
        stores: critical.slice(0, 3),
        action: 'Revisar hoy',
        color: 'red',
        gradient: 'from-red-50 to-rose-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        iconBg: 'bg-red-100'
      });
    }

    // 2. Tiendas con potencial de recuperación rápida (70-85%)
    const recoverable = storesAnalysis.filter(s => 
      s.salesCompliance >= 70 && s.salesCompliance < 85 && s.projectionCompliance >= 90
    );
    if (recoverable.length > 0) {
      priorityActions.push({
        type: 'recovery',
        icon: TrendingUp,
        title: 'Oportunidad de Recuperación',
        description: `${recoverable.length} tienda${recoverable.length > 1 ? 's pueden' : ' puede'} alcanzar meta con empuje`,
        stores: recoverable.slice(0, 3),
        action: 'Impulsar ventas',
        color: 'amber',
        gradient: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        iconBg: 'bg-amber-100'
      });
    }

    // 3. Tiendas destacadas para reconocer
    const topPerformers = storesAnalysis.filter(s => s.salesCompliance >= 110);
    if (topPerformers.length > 0) {
      priorityActions.push({
        type: 'recognition',
        icon: Award,
        title: 'Reconocer Excelencia',
        description: `${topPerformers.length} tienda${topPerformers.length > 1 ? 's superando' : ' superando'} meta en +10%`,
        stores: topPerformers.slice(0, 3),
        action: 'Reconocer equipo',
        color: 'emerald',
        gradient: 'from-emerald-50 to-green-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        iconBg: 'bg-emerald-100'
      });
    }

    // 4. Tiendas con mejor ticket promedio para replicar estrategia
    const topTicket = storesAnalysis
      .filter(s => s.avgTicket > 0)
      .sort((a, b) => b.avgTicket - a.avgTicket)
      .slice(0, 2);
    if (topTicket.length > 0 && topTicket[0].avgTicket > zoneTotals.totalSales / storesAnalysis.reduce((sum, s) => sum + s.totalTransactions, 0) * 1.15) {
      priorityActions.push({
        type: 'best_practice',
        icon: Target,
        title: 'Replicar Mejores Prácticas',
        description: `${topTicket[0].name} lidera con ticket ${formatCurrency(topTicket[0].avgTicket)}`,
        stores: topTicket,
        action: 'Analizar estrategia',
        color: 'blue',
        gradient: 'from-blue-50 to-cyan-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        iconBg: 'bg-blue-100'
      });
    }

    // 5. Ritmo insuficiente - necesitan acelerar
    const slowPace = storesAnalysis.filter(s => {
      const storeDaily = s.daysElapsed > 0 ? s.totalSales / s.daysElapsed : 0;
      const requiredDaily = s.daysInPeriod > 0 && s.salesBudget > 0 ? s.salesBudget / s.daysInPeriod : 0;
      return storeDaily > 0 && requiredDaily > 0 && storeDaily < requiredDaily * 0.9;
    });
    if (slowPace.length > 0) {
      priorityActions.push({
        type: 'pace',
        icon: Zap,
        title: 'Acelerar Ritmo Diario',
        description: `${slowPace.length} tienda${slowPace.length > 1 ? 's necesitan' : ' necesita'} aumentar ritmo diario`,
        stores: slowPace.slice(0, 3),
        action: 'Ajustar operación',
        color: 'orange',
        gradient: 'from-orange-50 to-amber-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-700',
        iconBg: 'bg-orange-100'
      });
    }

    return priorityActions.slice(0, 4); // Máximo 4 acciones prioritarias
  }, [storesAnalysis, formatCurrency, zoneTotals]);

  if (actions.length === 0) {
    return (
      <Card className="mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
        <CardContent className="pt-6 pb-6 text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl mb-3"
          >
            🎯
          </motion.div>
          <p className="text-lg font-bold text-emerald-900">Todo Bajo Control</p>
          <p className="text-sm text-emerald-700 mt-1">No hay acciones críticas pendientes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">⚡ ¿Qué Debo Hacer Hoy?</p>
          <h2 className="text-xl font-black text-gray-900">Acciones Prioritarias</h2>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {actions.length} acción{actions.length > 1 ? 'es' : ''} identificada{actions.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`border-2 ${action.borderColor} bg-gradient-to-br ${action.gradient} hover:shadow-lg transition-all`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={action.type === 'critical' ? { 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`p-3 rounded-xl ${action.iconBg} flex-shrink-0`}
                    >
                      <Icon className={`w-6 h-6 ${action.textColor}`} />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-gray-900 mb-1 text-sm`}>{action.title}</h3>
                      <p className="text-xs text-gray-600 mb-3">{action.description}</p>
                      
                      {/* Tiendas afectadas */}
                      <div className="space-y-1.5 mb-3">
                        {action.stores.map((store, i) => (
                          <Link 
                            key={store.code}
                            to={`${createPageUrl('Dashboard')}?store=${store.code}`}
                            onClick={() => localStorage.setItem('selectedStore', store.code)}
                          >
                            <motion.div
                              whileHover={{ x: 3 }}
                              className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 hover:bg-white transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-5 h-5 rounded-full ${action.iconBg} ${action.textColor} text-[10px] font-black flex items-center justify-center flex-shrink-0`}>
                                  {i + 1}
                                </span>
                                <span className="text-xs font-semibold text-gray-900 truncate">{store.name}</span>
                              </div>
                              <span className={`text-xs font-bold ${action.textColor}`}>
                                {action.type === 'best_practice' || action.type === 'recognition' 
                                  ? `${store.salesCompliance.toFixed(0)}%` 
                                  : formatCurrency(store.totalSales)}
                              </span>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                      
                      <div className={`text-xs font-bold ${action.textColor} flex items-center gap-2`}>
                        <span>{action.action}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}