import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react';

// ── ANIMATED COUNTER ──
function AnimatedValue({ value, format = (v) => v, duration = 1.5 }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.floor(value * progress));
      if (progress === 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [value, duration]);
  
  return format(display);
}

// ── FORMAT HELPERS ──
function fmt(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// ── PREMIUM KPI CARD ──
function KPICard({ label, value, trend, icon: Icon, color, bgColor, isAlert = false }) {
  const trendUp = trend > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl border ${
        isAlert 
          ? 'border-orange-400/30 bg-orange-400/5' 
          : 'border-white/10 bg-white/5'
      }`}
      style={{
        boxShadow: isAlert 
          ? '0 0 20px rgba(255, 140, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 0 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}>
      
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-0"
        animate={{ opacity: [0, 0.03, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent)` }} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColor}`}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        
        <p className="text-2xl font-black tracking-tight mb-2" style={{ color }}>
          {typeof value === 'number' ? fmt(value) : value}
        </p>
        
        {trend !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-0.5 text-xs font-bold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
            <span className="text-xs text-slate-500">vs ayer</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── ADVANCED INSIGHT CARD ──
function InsightCard({ title, message, type = 'info', icon: Icon }) {
  const bgMap = {
    success: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300',
    warning: 'bg-amber-400/10 border-amber-400/30 text-amber-300',
    alert: 'bg-rose-400/10 border-rose-400/30 text-rose-300',
    info: 'bg-blue-400/10 border-blue-400/30 text-blue-300'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl p-4 border backdrop-blur-sm flex items-start gap-3 ${bgMap[type]}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs font-bold mb-1">{title}</p>
        <p className="text-xs opacity-80">{message}</p>
      </div>
    </motion.div>
  );
}

// ── MAIN PANEL ──
export default function ClosureProjectionPanel({ todaySales = [], budget = [], cashiers = [] }) {
  const [selectedMetric, setSelectedMetric] = useState('sales');
  
  // Calculate projections and analytics
  const analytics = useMemo(() => {
    if (!todaySales.length) return null;
    
    const today = new Date();
    const currentHour = today.getHours();
    
    // Current day data
    const todayData = todaySales.find(d => {
      const dDate = new Date(d.date);
      return dDate.toDateString() === today.toDateString();
    }) || { total_sales: 0, total_tickets: 0, total_transactions: 0 };
    
    // Yesterday comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayData = todaySales.find(d => {
      const dDate = new Date(d.date);
      return dDate.toDateString() === yesterday.toDateString();
    }) || { total_sales: 0 };
    
    // Weekly average
    const weekData = todaySales.filter(d => {
      const dDate = new Date(d.date);
      return dDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    });
    const weekAvg = weekData.length > 0 ? weekData.reduce((s, d) => s + (d.total_sales || 0), 0) / weekData.length : 0;
    
    // Hourly sales rate
    const hourlyRate = currentHour > 0 ? todayData.total_sales / currentHour : 0;
    
    // Projection
    const hoursLeft = 24 - currentHour;
    const projectedClosing = todayData.total_sales + (hourlyRate * hoursLeft);
    
    // Budget compliance
    const activeBudget = budget.find(b => b.is_active) || budget[0];
    const budgetTarget = activeBudget?.sales_budget || 5000000;
    const currentCompliance = (todayData.total_sales / budgetTarget) * 100;
    const projectedCompliance = (projectedClosing / budgetTarget) * 100;
    
    // Trend calculations
    const trendYesterday = todayData.total_sales > 0 && yesterdayData.total_sales > 0
      ? Math.round(((todayData.total_sales - yesterdayData.total_sales) / yesterdayData.total_sales) * 100)
      : 0;
    
    const trendWeekAvg = todayData.total_sales > 0 && weekAvg > 0
      ? Math.round(((todayData.total_sales - weekAvg) / weekAvg) * 100)
      : 0;
    
    return {
      currentSales: todayData.total_sales,
      budget: budgetTarget,
      missing: Math.max(0, budgetTarget - todayData.total_sales),
      projection: projectedClosing,
      currentCompliance,
      projectedCompliance,
      hourlyRate,
      trendYesterday,
      trendWeekAvg,
      hoursElapsed: currentHour,
      hoursLeft,
      riskLevel: projectedCompliance < 70 ? 'high' : projectedCompliance < 85 ? 'medium' : 'low',
      bestHour: '6PM',
      insight: (() => {
        if (projectedCompliance > 110) return { type: 'success', title: '🎯 Excelente ritmo', message: `Cerrarías en ${Math.round(projectedCompliance)}% si mantienes el ritmo actual.` };
        if (projectedCompliance > 90) return { type: 'info', title: '📈 Buen comportamiento', message: `Proyección sólida al ${Math.round(projectedCompliance)}% de meta.` };
        if (projectedCompliance > 70) return { type: 'warning', title: '⚠️ Acelera las ventas', message: `Necesitas ${Math.round(100 - currentCompliance)}% más para alcanzar la meta hoy.` };
        return { type: 'alert', title: '🚨 Riesgo de no cumplir', message: `Faltan $${fmt(budgetTarget - projectedClosing)} para cerrar en meta.` };
      })()
    };
  }, [todaySales, budget]);
  
  // Generate hourly trend data
  const trendData = useMemo(() => {
    if (!analytics) return [];
    const data = [];
    const currentHour = new Date().getHours();
    const projectedDailyRate = (analytics.currentSales / Math.max(currentHour, 1)) * 24;
    
    for (let h = 8; h <= 21; h++) {
      const actualHours = Math.min(h, currentHour);
      const actual = (analytics.currentSales / Math.max(currentHour, 1)) * actualHours;
      const budget = (analytics.budget / 14) * (h - 7);
      const projected = h <= currentHour ? actual : actual + (analytics.hourlyRate * (h - currentHour));
      
      data.push({
        hour: `${h}h`,
        actual: Math.round(actual),
        budget: Math.round(budget),
        projected: Math.round(projected),
        isPast: h <= currentHour
      });
    }
    return data;
  }, [analytics]);
  
  if (!analytics) {
    return <div className="text-slate-400 text-center py-8">Cargando análisis...</div>;
  }
  
  const riskColors = {
    high: { color: '#ff4444', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    medium: { color: '#ffaa00', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    low: { color: '#00dd88', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className="space-y-6">
      
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Proyección de Cierre</h2>
        <p className="text-sm text-slate-400">Análisis inteligente de ventas en tiempo real</p>
      </div>
      
      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Venta Actual"
          value={analytics.currentSales}
          trend={analytics.trendYesterday}
          icon={Zap}
          color="#FF4D8D"
          bgColor="bg-pink-500/10" />
        
        <KPICard
          label="Meta Total"
          value={analytics.budget}
          icon={Target}
          color="#00D9FF"
          bgColor="bg-cyan-500/10" />
        
        <KPICard
          label="Proyección EOD"
          value={analytics.projection}
          trend={analytics.trendWeekAvg}
          icon={TrendingUp}
          color="#00DD88"
          bgColor="bg-emerald-500/10" />
        
        <KPICard
          label="Diferencia"
          value={analytics.missing > 0 ? `-$${fmt(analytics.missing)}` : `+$${fmt(Math.abs(analytics.missing))}`}
          icon={AlertCircle}
          color={analytics.missing > 0 ? '#ffaa00' : '#00DD88'}
          bgColor={analytics.missing > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}
          isAlert={analytics.missing > 0} />
      </div>
      
      {/* COMPLIANCE METER */}
      <motion.div
        className="rounded-2xl p-6 backdrop-blur-xl border border-white/10 bg-white/5"
        style={{ boxShadow: '0 0 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Compliance */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-4">Cumplimiento Actual</p>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="54" fill="none" stroke="#FF4D8D" strokeWidth="8"
                  strokeDasharray={`${(analytics.currentCompliance / 100) * 339.3} 339.3`}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 339.3', rotate: -90 }}
                  animate={{ strokeDasharray: `${(analytics.currentCompliance / 100) * 339.3} 339.3` }}
                  transition={{ duration: 2, delay: 0.3 }}
                  style={{ transformOrigin: '60px 60px', rotate: -90 }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-white">
                  <AnimatedValue value={Math.round(analytics.currentCompliance)} format={(v) => `${v}%`} />
                </span>
              </div>
            </div>
          </div>
          
          {/* Projected Compliance */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-4">Proyección EOD</p>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="54" fill="none" stroke="#00DD88" strokeWidth="8"
                  strokeDasharray={`${Math.min((analytics.projectedCompliance / 100) * 339.3, 339.3)} 339.3`}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 339.3', rotate: -90 }}
                  animate={{ strokeDasharray: `${Math.min((analytics.projectedCompliance / 100) * 339.3, 339.3)} 339.3` }}
                  transition={{ duration: 2.5, delay: 0.5 }}
                  style={{ transformOrigin: '60px 60px', rotate: -90 }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-white">
                  <AnimatedValue value={Math.round(analytics.projectedCompliance)} format={(v) => `${v}%`} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* TREND CHART */}
      <motion.div
        className="rounded-2xl p-6 backdrop-blur-xl border border-white/10 bg-white/5"
        style={{ boxShadow: '0 0 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}>
        
        <p className="text-xs font-bold text-slate-400 uppercase mb-4">Tendencia de Ventas</p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 40, left: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4D8D" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FF4D8D" stopOpacity="0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis hide domain={['dataMin - 100000', 'dataMax + 100000']} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,15,35,0.95)',
                border: '1px solid rgba(255,77,141,0.3)',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(255,77,141,0.2)'
              }}
              formatter={(v) => fmt(v)}
              cursor={{ stroke: 'rgba(255,77,141,0.2)', strokeWidth: 2 }} />
            
            <ReferenceLine y={analytics.budget} stroke="rgba(0,217,255,0.4)" strokeDasharray="5,5" strokeWidth={2} name="Meta" />
            
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#FF4D8D"
              strokeWidth={3}
              fill="url(#areaGradient)"
              dot={false}
              isAnimationActive={true}
              name="Venta Actual"
              filter="url(#glow)" />
            
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#00DD88"
              strokeWidth={2.5}
              strokeDasharray="5,5"
              dot={false}
              isAnimationActive={true}
              name="Proyección"
              opacity={0.8} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
      
      {/* INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard
          title={analytics.insight.title}
          message={analytics.insight.message}
          type={analytics.insight.type}
          icon={analytics.insight.type === 'success' ? CheckCircle : AlertCircle} />
        
        <InsightCard
          title="📊 Ritmo de Venta"
          message={`$${fmt(analytics.hourlyRate)}/hora | ${analytics.hoursLeft} horas restantes`}
          type="info"
          icon={Zap} />
        
        <InsightCard
          title="⏱️ Tiempo Transcurrido"
          message={`${analytics.hoursElapsed}h de 24h | ${Math.round((analytics.hoursElapsed / 24) * 100)}% del día`}
          type="info"
          icon={TrendingUp} />
        
        <InsightCard
          title={`🎯 Nivel de Riesgo: ${analytics.riskLevel.toUpperCase()}`}
          message={analytics.riskLevel === 'low' ? '✅ Excelente progreso' : analytics.riskLevel === 'medium' ? '⚠️ Necesitas mantener el ritmo' : '🚨 Requiere acción inmediata'}
          type={analytics.riskLevel === 'low' ? 'success' : analytics.riskLevel === 'medium' ? 'warning' : 'alert'}
          icon={analytics.riskLevel === 'low' ? CheckCircle : AlertCircle} />
      </div>
      
      {/* METRICS COMPARISON */}
      <motion.div
        className="rounded-2xl p-6 backdrop-blur-xl border border-white/10 bg-white/5"
        style={{ boxShadow: '0 0 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        
        <p className="text-xs font-bold text-slate-400 uppercase mb-5">Comparativas</p>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">vs Ayer</span>
              <span className={`text-sm font-bold ${analytics.trendYesterday > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {analytics.trendYesterday > 0 ? '+' : ''}{analytics.trendYesterday}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.abs(analytics.trendYesterday) * 3, 100)}%` }}
                transition={{ delay: 0.5, duration: 1 }}
                className="h-full rounded-full"
                style={{ background: analytics.trendYesterday > 0 ? 'linear-gradient(90deg, #00DD88, #00FF99)' : 'linear-gradient(90deg, #ff4444, #ff8888)' }} />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">vs Promedio Semanal</span>
              <span className={`text-sm font-bold ${analytics.trendWeekAvg > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {analytics.trendWeekAvg > 0 ? '+' : ''}{analytics.trendWeekAvg}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.abs(analytics.trendWeekAvg) * 2.5, 100)}%` }}
                transition={{ delay: 0.6, duration: 1 }}
                className="h-full rounded-full"
                style={{ background: analytics.trendWeekAvg > 0 ? 'linear-gradient(90deg, #00D9FF, #00FFFF)' : 'linear-gradient(90deg, #ffaa00, #ffdd00)' }} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}