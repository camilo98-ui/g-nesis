import React from 'react';
import { startOfWeek, isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

const WMO = {
  0: { e: '☀️', l: 'Despejado' },
  1: { e: '🌤️', l: 'Mayor. despejado' },
  2: { e: '⛅', l: 'Parc. nublado' },
  3: { e: '☁️', l: 'Nublado' },
  45: { e: '🌫️', l: 'Niebla' },
  48: { e: '🌫️', l: 'Niebla' },
  51: { e: '🌦️', l: 'Llovizna' },
  53: { e: '🌦️', l: 'Llovizna' },
  55: { e: '🌦️', l: 'Llovizna' },
  61: { e: '🌧️', l: 'Lluvia' },
  63: { e: '🌧️', l: 'Lluvia' },
  65: { e: '🌧️', l: 'Lluvia' },
  71: { e: '🌨️', l: 'Nieve' },
  73: { e: '🌨️', l: 'Nieve' },
  75: { e: '🌨️', l: 'Nieve' },
  80: { e: '🌧️', l: 'Chubascos' },
  81: { e: '🌧️', l: 'Chubascos' },
  82: { e: '🌧️', l: 'Chubascos' },
  95: { e: '⛈️', l: 'Tormenta' },
  96: { e: '⛈️', l: 'Tormenta' },
  99: { e: '⛈️', l: 'Tormenta' },
};
const wmo = (c) => WMO[c] || { e: '🌡️', l: '—' };

// Muestra el clima día por día de la semana actual (lunes a hoy).
export default function WeatherWeekCard({ weatherLast7 = [] }) {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });

  const days = weatherLast7
    .map((d) => ({ ...d, _dt: new Date(d.date + 'T00:00:00') }))
    .filter((d) => d._dt >= monday || isSameDay(d._dt, monday))
    .sort((a, b) => a._dt - b._dt);

  const avgTemp = days.length
    ? days.reduce((s, d) => s + (d.temperature_mean ?? d.temperature_max ?? 0), 0) / days.length
    : 0;

  return (
    <div
      className="rounded-2xl p-4 hover-lift flex flex-col"
      style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 2px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="label-premium">Clima · Semana actual</p>
        <span className="text-[8px] sm:text-[9px] font-semibold text-sky-500">
          {days.length ? `Prom ${Math.round(avgTemp)}°C` : '—'}
        </span>
      </div>

      {days.length === 0 ? (
        <div className="py-6 text-center text-[11px] text-slate-400">Sin datos de la semana</div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {days.map((d, i) => {
            const wd = format(d._dt, 'EEE', { locale: es });
            const w = wmo(d.weather_code);
            const temp = d.temperature_mean ?? d.temperature_max;
            const isToday = isSameDay(d._dt, today);
            const rain = (d.precipitation || 0) > 1;
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg"
                style={{ background: isToday ? 'rgba(56,189,248,0.08)' : 'transparent' }}
              >
                <span className="text-[9.5px] font-bold uppercase w-9" style={{ color: isToday ? '#0ea5e9' : '#94a3b8' }}>{wd}</span>
                <span className="text-[13px] w-5 text-center">{w.e}</span>
                <span className="flex-1 text-[9px] text-slate-400 truncate">{w.l}</span>
                {rain && <span className="text-[8.5px] text-sky-500 font-semibold">💧{d.precipitation.toFixed(1)}</span>}
                <span className="text-[11px] font-black tabular-nums text-slate-700 w-9 text-right">{temp != null ? `${Math.round(temp)}°` : '—'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}