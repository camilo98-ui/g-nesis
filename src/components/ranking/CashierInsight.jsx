import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Zap } from 'lucide-react';

// Genera insights automáticos basados en datos del cajero vs equipo
export default function CashierInsight({ cashierStats, teamAvg, allRecords = [] }) {
  const insight = useMemo(() => {
    if (!cashierStats || !teamAvg) return null;

    const salesVsTeam = teamAvg.sales > 0 ? ((cashierStats.totalSales - teamAvg.sales) / teamAvg.sales) * 100 : 0;
    const ticketVsTeam = teamAvg.avgTicket > 0 ? ((cashierStats.avgTicket - teamAvg.avgTicket) / teamAvg.avgTicket) * 100 : 0;
    const suggestedVsTeam = teamAvg.suggested > 0 ? ((cashierStats.totalSuggested - teamAvg.suggested) / teamAvg.suggested) * 100 : 0;

    // Análisis de patrones
    const strongestMetric = Math.max(salesVsTeam, ticketVsTeam, suggestedVsTeam);
    const weakestMetric = Math.min(salesVsTeam, ticketVsTeam, suggestedVsTeam);
    
    let primaryInsight = '';
    let secondaryInsight = '';
    let recommendation = '';
    let type = 'neutral';

    // Detección de patrones
    if (salesVsTeam > 25 && ticketVsTeam > 20) {
      primaryInsight = `Este cajero es un TOP PERFORMER: vende ${Math.abs(salesVsTeam).toFixed(0)}% más que el equipo con un ticket ${Math.abs(ticketVsTeam).toFixed(0)}% superior.`;
      recommendation = 'Reconocer públicamente y usarlo como mentor del equipo.';
      type = 'success';
    } else if (ticketVsTeam > 15 && salesVsTeam < 0) {
      primaryInsight = `Alto ticket promedio (+${ticketVsTeam.toFixed(0)}%) pero ventas bajas. Tiene potencial de upselling no aprovechado.`;
      recommendation = 'Aumentar frecuencia de turnos para capitalizar su habilidad de venta cruzada.';
      type = 'opportunity';
    } else if (salesVsTeam > 10 && ticketVsTeam < -10) {
      primaryInsight = `Vende mucho (+${salesVsTeam.toFixed(0)}%) pero con ticket bajo (${ticketVsTeam.toFixed(0)}%). Procesa alto volumen pero sin optimizar valor.`;
      recommendation = 'Capacitar en técnicas de upselling y cross-selling.';
      type = 'warning';
    } else if (suggestedVsTeam > 30) {
      primaryInsight = `Maestro de sugeridos: ${Math.abs(suggestedVsTeam).toFixed(0)}% sobre el equipo. Su conversación de venta es superior.`;
      recommendation = 'Ideal para entrenar a otros en técnicas de sugerencia.';
      type = 'success';
    } else if (salesVsTeam < -20 && ticketVsTeam < -15) {
      primaryInsight = `Rendimiento general bajo: ventas ${salesVsTeam.toFixed(0)}% y ticket ${ticketVsTeam.toFixed(0)}% vs equipo.`;
      recommendation = 'Requiere coaching urgente y revisión de asignación de turnos.';
      type = 'critical';
    } else if (Math.abs(salesVsTeam) < 10 && Math.abs(ticketVsTeam) < 10) {
      primaryInsight = `Desempeño consistente y balanceado, en línea con el promedio del equipo.`;
      recommendation = 'Mantener estabilidad y buscar oportunidades de crecimiento incremental.';
      type = 'neutral';
    } else {
      primaryInsight = `Rendimiento variable: destacando en ${strongestMetric === salesVsTeam ? 'ventas' : strongestMetric === ticketVsTeam ? 'ticket promedio' : 'sugeridos'}.`;
      recommendation = `Fortalecer ${weakestMetric === salesVsTeam ? 'volumen de ventas' : weakestMetric === ticketVsTeam ? 'valor por transacción' : 'técnicas de sugerencia'}.`;
      type = 'neutral';
    }

    return { primaryInsight, recommendation, type, salesVsTeam, ticketVsTeam, suggestedVsTeam };
  }, [cashierStats, teamAvg]);

  if (!insight) return null;

  const typeConfig = {
    success: { icon: TrendingUp, color: 'emerald', emoji: '🎯' },
    warning: { icon: TrendingDown, color: 'amber', emoji: '⚠️' },
    critical: { icon: TrendingDown, color: 'red', emoji: '🚨' },
    opportunity: { icon: Zap, color: 'blue', emoji: '💡' },
    neutral: { icon: Brain, color: 'gray', emoji: '📊' }
  };

  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-${config.color}-50 to-white border-2 border-${config.color}-200 rounded-2xl p-4 shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${config.color}-400 to-${config.color}-600 flex items-center justify-center flex-shrink-0 shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{config.emoji}</span>
            <p className={`text-xs font-bold text-${config.color}-700 uppercase tracking-wide`}>Insight Semanal</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed font-medium">
            {insight.primaryInsight}
          </p>
          <div className={`bg-white/60 rounded-lg p-2.5 border border-${config.color}-200`}>
            <p className="text-xs font-semibold text-gray-600 mb-1">💼 Acción Recomendada:</p>
            <p className="text-xs text-gray-700 leading-relaxed">{insight.recommendation}</p>
          </div>

          {/* Comparativa rápida */}
          <div className="flex gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
              insight.salesVsTeam >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              Ventas: {insight.salesVsTeam >= 0 ? '+' : ''}{insight.salesVsTeam.toFixed(0)}%
            </span>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
              insight.ticketVsTeam >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
            }`}>
              Ticket: {insight.ticketVsTeam >= 0 ? '+' : ''}{insight.ticketVsTeam.toFixed(0)}%
            </span>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
              insight.suggestedVsTeam >= 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
            }`}>
              Sugeridos: {insight.suggestedVsTeam >= 0 ? '+' : ''}{insight.suggestedVsTeam.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}