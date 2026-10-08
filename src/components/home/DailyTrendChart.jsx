import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, Legend } from 'recharts';
import { TrendingUp, Check, X as XIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

const POPSY_MAGENTA = '#C21875';
const PPT_COLOR = 'rgba(148, 163, 184, 0.45)'; // gris translúcido

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const met = d.ventas >= d.ppt;
  const pct = d.ppt > 0 ? Math.round(d.ventas / d.ppt * 100) : 0;
  const diff = d.ventas - d.ppt;

  let label;
  try {
    const dateObj = parseISO(d.fullDate || d.day);
    label = format(dateObj, "EEEE dd/MM", { locale: es });
  } catch {
    label = d.day;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3" style={{ minWidth: 180 }}>
      <p className="text-[11px] font-bold text-slate-800 mb-2 capitalize">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-sm" style={{ background: POPSY_MAGENTA }} />
        <span className="text-[10px] text-slate-500">Venta:</span>
        <span className="text-[10px] font-bold text-slate-800 ml-auto">{fmtFull(d.ventas)}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-sm" style={{ background: '#94a3b8' }} />
        <span className="text-[10px] text-slate-500">PPT:</span>
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
  if (!data || data.length < 1) {
    return <div className="h-40 flex items-center justify-center text-[11px] text-slate-300">Sin datos del mes actual</div>;
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.ventas || 0, d.ppt || 0), 0));
  const domain = [0, Math.max(maxVal * 1.12, 0)];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-[11px] font-bold text-slate-700">Ventas vs PPT del Día</p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={1} barCategoryGap="18%">
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
          <ReferenceLine y={0} stroke="#cbd5e1" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="ppt" name="PPT" fill={PPT_COLOR} radius={[3, 3, 0, 0]} maxBarSize={14} />
          <Bar dataKey="ventas" name="Ventas" radius={[3, 3, 0, 0]} maxBarSize={14}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.ventas >= entry.ppt ? POPSY_MAGENTA : '#f9a8d4'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: POPSY_MAGENTA }} />
          <span className="text-[9px] text-slate-500 font-medium">Ventas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#94a3b8', opacity: 0.5 }} />
          <span className="text-[9px] text-slate-500 font-medium">PPT (Excel)</span>
        </div>
      </div>
    </div>
  );
}