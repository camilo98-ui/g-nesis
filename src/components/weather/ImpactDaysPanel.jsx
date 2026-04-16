import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function ImpactDaysPanel({ chartData, stats, formatCurrency }) {
  if (!stats || !chartData?.length) return null;

  const withSales = chartData.filter(d => d.sales > 0 && !d.isForecast);
  const ranked = withSales
    .map(d => ({
      ...d,
      deviation: stats.avgTotal > 0 ? ((d.sales - stats.avgTotal) / stats.avgTotal * 100) : 0,
    }))
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
    .slice(0, 8);

  const pos = ranked.filter(d => d.deviation >= 0).slice(0, 3);
  const neg = ranked.filter(d => d.deviation < 0).slice(0, 3);

  const weatherIcon = (type) =>
    type === 'sunny' ? '☀️' : type === 'rainy' ? '🌧️' : '☁️';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-slate-500" />
        <h3 className="font-black text-slate-800 text-sm">Días con Mayor Impacto Climático</h3>
        <span className="text-[10px] text-slate-400">
          · vs promedio {formatCurrency(Math.round(stats.avgTotal))}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Mejores días */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Mejores días
          </p>
          <div className="space-y-1.5">
            {pos.length === 0 && (
              <p className="text-xs text-slate-400 py-2">Sin días sobre el promedio</p>
            )}
            {pos.map((d, i) => (
              <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <span className="text-base flex-shrink-0">{weatherIcon(d.weatherType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate capitalize">{d.fullDate}</p>
                  <p className="text-[10px] text-slate-500">
                    {d.temperature}°C{d.precipitation > 0 ? ` · ${d.precipitation}mm` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-black text-slate-900">{formatCurrency(d.sales).slice(0, -3)}</p>
                  <p className="text-[10px] font-black text-emerald-600">+{d.deviation.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Días más afectados */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Días más afectados
          </p>
          <div className="space-y-1.5">
            {neg.length === 0 && (
              <p className="text-xs text-slate-400 py-2">Sin días bajo el promedio</p>
            )}
            {neg.map((d, i) => (
              <div key={i} className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                <span className="text-base flex-shrink-0">{weatherIcon(d.weatherType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate capitalize">{d.fullDate}</p>
                  <p className="text-[10px] text-slate-500">
                    {d.temperature}°C{d.precipitation > 0 ? ` · ${d.precipitation}mm` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-black text-slate-900">{formatCurrency(d.sales).slice(0, -3)}</p>
                  <p className="text-[10px] font-black text-rose-600">{d.deviation.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}