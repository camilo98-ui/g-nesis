import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart,
  PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

// ── CONTINUOUS ANIMATED BACKGROUND ────────────────────────────────────────────
function FuturisticBackground() {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Animated ambient blobs */}
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #FF4D8D 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <motion.div
        className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, #64748b 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      
      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            background: `rgba(255, 77, 141, ${Math.random() * 0.4 + 0.1})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 60 - 30, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}

      {/* Light leaks */}
      <motion.div
        className="absolute top-0 right-0 w-1/3 h-1/3 opacity-5"
        style={{
          background: 'radial-gradient(circle, rgba(255,200,221,1), transparent)',
          filter: 'blur(60px)',
        }}
        animate={{
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
    </div>
  );
}

// ── ANIMATED CHART LINE ────────────────────────────────────────────────────────
function LiveChartArea({ dataKey, fill, stroke, animated = true }) {
  return (
    <motion.g>
      {animated && (
        <defs>
          <linearGradient id={`${dataKey}Grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${dataKey}Stroke`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.5" />
            <stop offset="50%" stopColor={stroke} stopOpacity="1" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.5" />
          </linearGradient>
          <filter id={`${dataKey}Glow`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
    </motion.g>
  );
}

// ── CUSTOM ANIMATED TOOLTIP ────────────────────────────────────────────────────
function PremiumLiveTooltip(formatter) {
  return function Tooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="rounded-2xl px-4 py-3 shadow-2xl relative overflow-hidden"
        style={{
          background: 'rgba(15,17,48,0.95)',
          border: '1px solid rgba(255, 77, 141, 0.4)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 20px 60px rgba(255, 77, 141, 0.2), inset 0 1px 1px rgba(255, 77, 141, 0.2)'
        }}>
        {/* Glow underlay */}
        <motion.div
          className="absolute inset-0"
          animate={{ boxShadow: ['inset 0 0 20px rgba(255, 77, 141, 0.1)', 'inset 0 0 30px rgba(255, 77, 141, 0.15)', 'inset 0 0 20px rgba(255, 77, 141, 0.1)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <p className="text-[11px] font-bold text-[#FF7FA5] mb-2 tracking-wide relative z-10">{label}</p>
        {payload.map((p, i) =>
        <motion.p
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="text-[13px] font-semibold relative z-10"
          style={{ color: p.color || '#FF4D8D' }}>
          {formatter ? formatter(p.value) : p.value}
        </motion.p>
        )}
      </motion.div>
    );
  };
}

const SalesTooltip = PremiumLiveTooltip((v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
});

// ── ANIMATED PREMIUM CARD ────────────────────────────────────────────────────
function AnimatedGlassCard({ title, subtitle, children, delay = 0, colSpan = '' }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.165, 0.84, 0.44, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8, transition: { duration: 0.5 } }}
      className={`rounded-3xl p-7 ${colSpan} group relative overflow-hidden`}>
      
      {/* Base glassmorphic background */}
      <div
        className="absolute inset-0 rounded-3xl opacity-40 group-hover:opacity-50 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 77, 141, 0.15)',
        }}
      />

      {/* Animated glow border pulse */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        animate={isHovered ? { opacity: [0.2, 0.5, 0.2] } : { opacity: 0.08 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'linear-gradient(90deg, rgba(255, 77, 141, 0.08), rgba(255, 182, 201, 0.12), rgba(255, 77, 141, 0.08))',
          boxShadow: isHovered
            ? '0 0 40px rgba(255, 77, 141, 0.3), inset 0 0 30px rgba(255, 77, 141, 0.1)'
            : '0 0 20px rgba(255, 77, 141, 0.08), inset 0 0 15px rgba(255, 77, 141, 0.05)',
          border: '1px solid rgba(255, 77, 141, 0.2)',
        }}
      />

      {/* Dynamic shadow enhancement */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        animate={isHovered ? { opacity: 1 } : { opacity: 0.6 }}
        transition={{ duration: 0.5 }}
        style={{
          boxShadow: isHovered
            ? '0 30px 60px rgba(255, 77, 141, 0.25), 0 0 60px rgba(255, 77, 141, 0.1)'
            : '0 8px 32px rgba(255, 77, 141, 0.12)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <motion.div className="mb-6">
          <motion.p
            className="text-[11px] font-bold text-[#8F96A3] uppercase tracking-widest"
            animate={isHovered ? { letterSpacing: '0.3em', color: '#FF7FA5' } : { letterSpacing: '0.2em', color: '#8F96A3' }}
            transition={{ duration: 0.4 }}>
            {title}
          </motion.p>
          {subtitle && (
            <motion.p
              className="text-[13px] text-[#6B7280] mt-2 font-medium"
              animate={isHovered ? { color: '#FF4D8D' } : { color: '#6B7280' }}
              transition={{ duration: 0.4 }}>
              {subtitle}
            </motion.p>
          )}
        </motion.div>
        {children}
      </div>
    </motion.div>
  );
}

// ── LIVE CHART WRAPPER ────────────────────────────────────────────────────────
function LiveChart({ data, type = 'area', height = 120, dataKey, stroke, fill }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
          <defs>
            {/* Multiple stroke gradients for living effect */}
            <linearGradient id={`${dataKey}Fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${dataKey}Stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
              <stop offset="50%" stopColor={stroke} stopOpacity="1" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.4" />
            </linearGradient>
            <filter id={`${dataKey}Blur`}>
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          
          <CartesianGrid strokeDasharray="0" stroke="rgba(255, 77, 141, 0.08)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 7, fill: '#8F96A3', fontWeight: 500 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<SalesTooltip />} />
          
          <Area
            type="natural"
            dataKey={dataKey}
            stroke={`url(#${dataKey}Stroke)`}
            strokeWidth={isHovered ? 4 : 3}
            fill={`url(#${dataKey}Fill)`}
            dot={false}
            isAnimationActive={true}
            animationDuration={1500}
            filter={`url(#${dataKey}Blur)`}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// ── ANIMATED DONUT ────────────────────────────────────────────────────────────
const PARTICIPATION_COLORS = ['#FF4D8D', '#FF7FA5', '#d97706', '#059669', '#6366f1'];
const SEGMENTS = [
  { name: 'Helados', value: 42 },
  { name: 'Bebidas', value: 23 },
  { name: 'Combos', value: 18 },
  { name: 'Postres', value: 11 },
  { name: 'Otros', value: 6 }
];

function AnimatedDonut({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div className="flex items-center gap-6">
      <motion.div
        className="flex-shrink-0 relative"
        initial={{ opacity: 0, scale: 0.7, rotateZ: -20 }}
        animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
        transition={{ duration: 1, ease: [0.165, 0.84, 0.44, 1] }}
        style={{ width: 120, height: 120 }}>
        
        {/* Pulsing halo */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 20px rgba(255, 77, 141, 0.1)',
              '0 0 40px rgba(255, 77, 141, 0.25)',
              '0 0 20px rgba(255, 77, 141, 0.1)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={55}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              animationDuration={1000}
              animationEasing="ease-out">
              {data.map((_, i) =>
              <Cell key={i} fill={PARTICIPATION_COLORS[i % PARTICIPATION_COLORS.length]} />
              )}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div className="flex-1 space-y-2.5">
        {data.map((item, i) =>
        <motion.div
          key={item.name}
          className="flex items-center gap-3 group cursor-pointer px-3 py-2 rounded-lg"
          onHoverStart={() => setHoveredIdx(i)}
          onHoverEnd={() => setHoveredIdx(null)}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.1, ease: [0.165, 0.84, 0.44, 1] }}
          whileHover={{ x: 6, backgroundColor: 'rgba(255, 77, 141, 0.05)' }}>
          
          <motion.div
            className="w-3 h-3 rounded-full flex-shrink-0"
            animate={{
              scale: hoveredIdx === i ? 1.6 : 1,
              boxShadow: hoveredIdx === i
                ? `0 0 20px ${PARTICIPATION_COLORS[i]}`
                : `0 0 8px ${PARTICIPATION_COLORS[i]}40`
            }}
            transition={{ duration: 0.3 }}
            style={{ background: PARTICIPATION_COLORS[i] }}
          />
          
          <span className="text-[12px] text-[#8F96A3] flex-1 font-medium group-hover:text-[#FF4D8D] transition-colors duration-300">
            {item.name}
          </span>
          
          <motion.span
            className="text-[12px] font-bold text-[#FF4D8D] tabular-nums"
            animate={{ scale: hoveredIdx === i ? 1.15 : 1 }}
            transition={{ duration: 0.2 }}>
            {item.value}%
          </motion.span>
        </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ExecutiveAnalyticsPanelFuturistic({ todaySales = [], budget = [], cashiers = [] }) {
  const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  const sorted30 = useMemo(() => {
    const daily = [...todaySales].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-30);
    const baseSales = daily.length > 0 ? daily[0].total_sales || 2000000 : 2000000;
    const growthRate = 0.015;
    return daily.map((d, i) => ({
      date: new Date(d.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      ventas: d.total_sales || baseSales,
      txn: d.total_transactions || 0
    }));
  }, [todaySales]);

  const sortedDesc = [...todaySales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const today = sortedDesc[0];
  const yesterday = sortedDesc[1];

  return (
    <>
      <FuturisticBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.165, 0.84, 0.44, 1] }}
        className="relative z-10 mb-8">
        
        {/* ROW 1 */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, staggerChildren: 0.12, delayChildren: 0.1 }}>
          
          {/* Sales vs Projection */}
          <AnimatedGlassCard
            title="Sales Intelligence"
            subtitle="Last 30 days performance"
            delay={0.2}
            colSpan="lg:col-span-3">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.08, y: -4 }}
                className="p-5 rounded-2xl group cursor-pointer relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 77, 141, 0.12) 0%, rgba(255, 182, 201, 0.08) 100%)',
                  border: '1px solid rgba(255, 77, 141, 0.25)',
                  backdropFilter: 'blur(10px)',
                }}>
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 77, 141, 0.15), transparent)',
                  }}
                />
                <p className="text-[10px] text-[#8F96A3] font-bold uppercase tracking-wider mb-2 relative z-10">Today Sales</p>
                <p className="text-[24px] font-black tabular-nums relative z-10" style={{ color: '#FF4D8D' }}>
                  {fmt(today?.total_sales)}
                </p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.08, y: -4 }}
                className="p-5 rounded-2xl group cursor-pointer relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 127, 165, 0.1) 0%, rgba(255, 182, 201, 0.06) 100%)',
                  border: '1px solid rgba(255, 182, 201, 0.2)',
                  backdropFilter: 'blur(10px)',
                }}>
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 127, 165, 0.15), transparent)',
                  }}
                />
                <p className="text-[10px] text-[#8F96A3] font-bold uppercase tracking-wider mb-2 relative z-10">Projection</p>
                <p className="text-[24px] font-black tabular-nums relative z-10" style={{ color: '#FF7FA5' }}>
                  {fmt(Math.round(today?.total_sales * 1.05) || 0)}
                </p>
              </motion.div>
            </div>

            {/* Live chart */}
            {sorted30.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}>
                <LiveChart
                  data={sorted30}
                  dataKey="ventas"
                  stroke="#FF4D8D"
                  height={140}
                />
              </motion.div>
            )}
          </AnimatedGlassCard>

          {/* EBITDA Card */}
          <AnimatedGlassCard
            title="Financial Health"
            subtitle="Margin analysis"
            delay={0.3}
            colSpan="lg:col-span-2">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}>
              <p className="text-[32px] font-black tabular-nums mb-3" style={{ color: '#FF4D8D' }}>
                34%
              </p>
              <p className="text-[12px] text-[#8F96A3] mb-6 font-medium">Average margin</p>
              
              <motion.div
                className="flex items-center gap-2 px-3 py-2 rounded-lg w-fit"
                style={{
                  background: 'rgba(255, 77, 141, 0.1)',
                  border: '1px solid rgba(255, 77, 141, 0.2)',
                }}
                animate={{ boxShadow: ['inset 0 0 0 rgba(255,77,141,0)', 'inset 0 0 12px rgba(255,77,141,0.2)', 'inset 0 0 0 rgba(255,77,141,0)'] }}
                transition={{ duration: 3, repeat: Infinity }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#FF4D8D' }} />
                <span className="text-[12px] font-bold" style={{ color: '#FF4D8D' }}>+2.1%</span>
              </motion.div>
            </motion.div>
          </AnimatedGlassCard>
        </motion.div>

        {/* ROW 2 */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, staggerChildren: 0.12, delayChildren: 0.3 }}>
          
          {/* Participation Donut */}
          <AnimatedGlassCard
            title="Mix Analysis"
            subtitle="Category distribution"
            delay={0.4}>
            <AnimatedDonut data={SEGMENTS} />
          </AnimatedGlassCard>

          {/* Top Days */}
          <AnimatedGlassCard
            title="Peak Performance"
            subtitle="Best sales days"
            delay={0.5}
            colSpan="lg:col-span-2">
            
            {todaySales.length > 0 && (() => {
              const topDays = [...todaySales]
                .sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))
                .slice(0, 5);
              const maxSales = Math.max(...topDays.map(d => d.total_sales || 0), 1);

              return (
                <motion.div className="space-y-4">
                  {topDays.map((d, i) => {
                    const salesPct = (d.total_sales / maxSales) * 100;
                    return (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className="group">
                        
                        <div className="flex items-center gap-4 mb-2">
                          <motion.div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 group-hover:scale-110 transition-transform"
                            style={{
                              background: i === 0 ? 'linear-gradient(135deg, #FF4D8D, #FF7FA5)' : `rgba(255, 77, 141, ${0.1 + i * 0.08})`,
                              color: i === 0 ? '#fff' : '#FF4D8D',
                              boxShadow: i === 0 ? '0 0 16px rgba(255, 77, 141, 0.5)' : 'none',
                            }}>
                            {i + 1}
                          </motion.div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-white">
                              {new Date(d.date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-[10px] text-[#8F96A3]">{(d.total_transactions || 0).toLocaleString()} txn</p>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className="text-[12px] font-black" style={{ color: '#FF4D8D' }}>
                              {fmt(d.total_sales)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Animated progress bar */}
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 77, 141, 0.1)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${salesPct}%` }}
                            transition={{ delay: 0.6 + i * 0.1, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                            className="h-full rounded-full"
                            style={{
                              background: i === 0
                                ? 'linear-gradient(90deg, #FF4D8D, #FF7FA5)'
                                : `linear-gradient(90deg, rgba(255, 77, 141, ${0.6 - i * 0.1}), rgba(255, 182, 201, ${0.4 - i * 0.08}))`,
                              boxShadow: i === 0 ? '0 0 16px rgba(255, 77, 141, 0.5)' : 'none',
                            }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              );
            })()}
          </AnimatedGlassCard>
        </motion.div>
      </motion.div>
    </>
  );
}