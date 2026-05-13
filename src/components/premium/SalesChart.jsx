import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesChart() {
  const data = useMemo(() => {
    const hours = ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm', '12am'];
    return hours.map((h, i) => ({
      hour: h,
      ventas: Math.floor(100000 + Math.sin(i / 3) * 200000 + Math.random() * 100000),
      proyeccion: Math.floor(150000 + (i / 13) * 300000),
    }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-8 border border-slate-200 h-full flex flex-col"
    >
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900">Ventas vs Proyección</h3>
        <p className="text-sm text-slate-500 mt-1">Análisis del desempeño del día</p>
      </div>

      {/* Chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c21875" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#c21875" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="ventas" stroke="#c21875" fill="url(#salesGrad)" strokeWidth={2.5} />
            <Line type="monotone" dataKey="proyeccion" stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-8 mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-pink-500 rounded-full" />
          <span className="text-sm text-slate-600">Ventas reales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-gray-400 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0px, currentColor 5px, transparent 5px, transparent 10px)' }} />
          <span className="text-sm text-slate-600">Proyección</span>
        </div>
      </div>
    </motion.div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-slate-900 text-white rounded-lg p-3 shadow-lg border border-slate-700">
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium">
          {p.name}: ${(p.value / 1000).toFixed(0)}K
        </p>
      ))}
    </div>
  );
}