import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from 'recharts';
import { TrendingUp, Check, X as XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const fmt = (n) => {
  if (n == null) return '$0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs}`;
};

const fmtFull = (n) => {
  if (n == null) return '$0';
  const sign = n < 0 ? '-' : '';
  return `${sign}$ ${Math.abs(n).toLocaleString('es-CO')}`;
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const met = d.ventas >= d.ppt;
  const pct = d.ppt > 0 ? Math.round(d.ventas / d.ppt * 100) : 0;
  const diff = d.ventas - d.ppt;

  let label;
  try {
    const dateObj = new Date(d.fullDate || d.day);
    label = format(dateObj, "EEEE dd/MM", { locale: es });
  } catch {
    label = d.day;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3" style={{ minWidth: 180 }}>
      <p className="text-[11px] font-bold text-slate-800 mb-2 capitalize">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-3 h-3 text-slate-400" />
        <span className="text-[10px] text-slate-500">Venta:</span>
        <span className="text-[10px] font-bold text-slate-800 ml-auto">{fmtFull(d.ventas)}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-sm" style={{ background: '#6366f1' }} />
        <span className="text-[10px] text-slate-500">Meta:</span>
        <span className="text-[10px] font-bold text-slate-800 ml-auto">{fmtFull(d.ppt)}</span>
      </div>
      <div className="border-t border-slate-100 my-2" />
      <div className="flex items-center gap-2 mb-1">
        {met ? <Check className="w-4 h-4 text-emerald-500" /> : <XIcon className="w-4 h-4 text-rose-500" />}
        <span className="text-[11px] font-bold" style={{ color: met ? '#10b981' : '#f56565' }}>
          {met ? 'Cumplido' : 'No cumplido'}: {pct}%
        </span>
      </div>
      <p className="text-[10px] font-semibold" style={{ color: diff >= 0 ? '#10b981' : '#f56565' }}>
        Diferencia: {fmtFull(diff)}
      </p>
    </div>
  );
}

export default function DailyTrendChart({ data = [] }) {
  if (data.length < 2) {
    return <div className="h-40 flex items-center justify-center text-[11px] text-slate-300">Sin suficientes datos históricos</div>;
  }

  const maxVal = Math.max(...data.map(d => d.brecha || 0), 0);
  const minVal = Math.min(...data.map(d => d.brecha || 0), 0);
  const domain = [
    Math.min(minVal * 1.15, 0),
    Math.max(maxVal * 1.15, 0)
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-[11px] font-bold text-slate-700">Tendencia Diaria del Período</p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis
            domain={domain}
            tick={{ fontSize: 8, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmt(v)}
            width={40}
          />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="brecha" radius={[4, 4, 4, 4]} maxBarSize={28}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.brecha >= 0 ? '#b2f5ea' : '#feb2b2'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#b2f5ea' }} />
          <span className="text-[9px] text-slate-500 font-medium">Meta superada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#feb2b2' }} />
          <span className="text-[9px] text-slate-500 font-medium">Meta no alcanzada</span>
        </div>
      </div>
    </div>
  );
}