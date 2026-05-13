import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line, PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity } from 'lucide-react';

function fmt(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function pct(a, b) {
  if (!a || !b) return null;
  return Math.round(((a - b) / b) * 100);
}

function Delta({ val }) {
  if (val === null || val === undefined) return <span className="text-[10px] text-slate-200">—</span>;
  const pos = val >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums ${pos ? 'text-emerald-500' : 'text-rose-400'}`}>
      {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(val)}%
    </span>
  );
}

// ── TOOLTIPS ─────────────────────────────────────────────────────────────────
function SalesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-2xl"
      style={{ background: 'rgba(10,10,18,0.95)', border: '1px solid rgba(194,24,117,0.2)', backdropFilter: 'blur(16px)' }}>
      <p className="text-[9px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <p className="text-[11px] font-bold text-white">{fmt(p.value)}</p>
        </div>
      ))}
    </div>
  );
}

function TxnTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-2xl"
      style={{ background: 'rgba(10,10,18,0.95)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(16px)' }}>
      <p className="text-[9px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <p className="text-[11px] font-bold text-white">{p.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── CARD WRAPPER ─────────────────────────────────────────────────────────────
function Card({ title, subtitle, children, delay = 0, span = '', badge, badgeColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      className={`rounded-2xl p-5 overflow-hidden relative ${span}`}
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.03)',
      }}
    >
      {/* Top shine */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-[0.15em]">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-300 mt-0.5 font-medium">{subtitle}</p>}
        </div>
        {badge && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${badgeColor}10`, color: badgeColor, border: `1px solid ${badgeColor}20` }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

// ── HEATMAP ──────────────────────────────────────────────────────────────────
const HOURS_LABELS = ['8','9','10','11','12','13','14','15','16','17','18','19','20','21'];
const DAYS_LABELS  = ['L','M','X','J','V','S','D'];

function HourlyHeatmap({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div className="flex gap-[3px] mb-1 ml-4">
        {HOURS_LABELS.map(h => (
          <div key={h} className="flex-1 text-center text-[7.5px] text-slate-300 font-medium">{h}</div>
        ))}
      </div>
      {DAYS_LABELS.map((day, di) => (
        <div key={day} className="flex items-center gap-[3px] mb-[3px]">
          <div className="w-3.5 text-[7.5px] text-slate-300 font-medium text-right flex-shrink-0">{day}</div>
          {HOURS_LABELS.map((_, hi) => {
            const cell = data.find(d => d.day === di && d.hour === hi) || { value: 0 };
            const intensity = max > 0 ? cell.value / max : 0;
            const alpha = 0.05 + intensity * 0.9;
            return (
              <div key={hi} className="flex-1 rounded-sm"
                style={{
                  aspectRatio: '1',
                  background: intensity > 0.7
                    ? `rgba(194,24,117,${alpha})`
                    : intensity > 0.4
                    ? `rgba(168,85,247,${alpha})`
                    : `rgba(100,116,139,${Math.max(0.05, alpha * 0.4)})`,
                }}
                title={`${cell.value} txn`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── DONUT ────────────────────────────────────────────────────────────────────
const DONUT_PALETTE = ['#C21875', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'];
const SEGMENTS = [
  { name: 'Helados', value: 42 },
  { name: 'Bebidas', value: 23 },
  { name: 'Combos', value: 18 },
  { name: 'Postres', value: 11 },
  { name: 'Otros', value: 6 },
];

function DonutChart({ data }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 relative" style={{ width: 100, height: 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%"
              innerRadius={30} outerRadius={46}
              paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={DONUT_PALETTE[i % DONUT_PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[14px] font-black text-slate-700 leading-none">42%</p>
            <p className="text-[7.5px] text-slate-300 font-medium">helados</p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: DONUT_PALETTE[i % DONUT_PALETTE.length] }} />
            <span className="text-[10px] text-slate-500 flex-1 font-medium">{item.name}</span>
            <span className="text-[10.5px] font-black text-slate-700 tabular-nums">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── VELOCITY BARS ─────────────────────────────────────────────────────────────
function VelocityBars({ cashiers }) {
  const mock = cashiers.length > 0 ? cashiers.slice(0, 5) : [];
  const velocities = [92, 78, 71, 64, 55];

  return (
    <div className="space-y-2">
      {mock.length > 0 ? mock.map((c, i) => (
        <div key={c.id} className="flex items-center gap-2.5">
          <div className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-lg flex items-center justify-center flex-shrink-0 text-[8px] font-black"
            style={{
              background: i === 0 ? 'linear-gradient(135deg, #C21875, #9333ea)' : 'rgba(0,0,0,0.05)',
              color: i === 0 ? 'white' : '#94a3b8',
            }}>
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] font-semibold text-slate-600 truncate">{c.name}</p>
              <span className="text-[9px] font-bold tabular-nums ml-1"
                style={{ color: i === 0 ? '#C21875' : '#94a3b8' }}>
                {velocities[i]}%
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${velocities[i]}%` }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
                className="h-full rounded-full"
                style={{
                  background: i === 0
                    ? 'linear-gradient(90deg, #C21875, #9333ea)'
                    : i === 1
                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                    : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                }}
              />
            </div>
          </div>
          <span className="text-[8.5px] text-slate-300 font-medium capitalize flex-shrink-0 hidden sm:block">
            {c.position || 'cajero'}
          </span>
        </div>
      )) : (
        <div className="flex items-center justify-center h-16">
          <p className="text-[11px] text-slate-300 font-medium">Sin cajeros registrados</p>
        </div>
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ExecutiveAnalyticsPanel({ todaySales = [], budget = [], cashiers = [] }) {

  const sorted30 = useMemo(() => {
    return [...todaySales]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30)
      .map(d => ({
        date: new Date(d.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        ventas: d.total_sales || 0,
        txn: d.total_transactions || 0,
        ebitda: Math.round((d.total_sales || 0) * 0.34),
      }));
  }, [todaySales]);

  const heatmapData = useMemo(() => {
    const pattern = [2,3,5,8,14,18,16,14,12,10,8,6,5,3];
    const result = [];
    DAYS_LABELS.forEach((_, di) => {
      HOURS_LABELS.forEach((_, hi) => {
        const base = pattern[hi] || 0;
        const wb = di >= 5 ? 1.4 : 1;
        const lb = hi >= 4 && hi <= 6 ? 1.3 : 1;
        result.push({ day: di, hour: hi, value: Math.round(base * wb * lb * (0.7 + Math.random() * 0.6)) });
      });
    });
    return result;
  }, []);

  const activeBudget = budget.find(b => b.is_active) || budget[0];
  const totalSales = todaySales.reduce((s, d) => s + (d.total_sales || 0), 0);
  const compliance = activeBudget?.sales_budget
    ? Math.min(100, Math.round((totalSales / activeBudget.sales_budget) * 100))
    : null;

  const sortedDesc = [...todaySales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const today = sortedDesc[0];
  const yesterday = sortedDesc[1];
  const salesDelta = pct(today?.total_sales, yesterday?.total_sales);
  const txnDelta   = pct(today?.total_transactions, yesterday?.total_transactions);
  const hasSalesData = sorted30.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="mb-7"
    >
      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-3 rounded-full" style={{ background: 'linear-gradient(180deg, #C21875, #9333ea)' }} />
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.15em]">Análisis operacional</p>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.06), transparent)' }} />
        <span className="text-[9px] text-slate-300 font-medium">hoy · {new Date().toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>

      {/* ── ROW 1: Dual chart + EBITDA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

        {/* Dual area: Ventas + EBITDA overlaid */}
        <Card
          title="Ventas & EBITDA"
          subtitle={hasSalesData ? `${sorted30.length} registros · tendencia mensual` : 'Registra ventas para ver la tendencia'}
          delay={0.14}
          span="lg:col-span-3"
          badge={salesDelta !== null ? `${salesDelta >= 0 ? '+' : ''}${salesDelta}%` : null}
          badgeColor={salesDelta >= 0 ? '#10b981' : '#f43f5e'}
        >
          <div className="flex items-center gap-5 mb-4">
            <div>
              <p className="text-[26px] font-black text-slate-800 tabular-nums tracking-tight leading-none">
                {fmt(today?.total_sales)}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Delta val={salesDelta} />
                <span className="text-[10px] text-slate-300">vs ayer</span>
              </div>
            </div>
            <div className="h-9 w-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <div>
              <p className="text-[15px] font-bold text-slate-500 tabular-nums leading-none">
                {fmt(today?.total_sales ? Math.round(today.total_sales * 0.34) : null)}
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">EBITDA ~34%</p>
            </div>
            <div className="h-9 w-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <div>
              <p className="text-[15px] font-bold tabular-nums leading-none"
                style={{ color: today?.total_transactions ? '#6366f1' : '#cbd5e1' }}>
                {today?.total_transactions ?? '—'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Delta val={txnDelta} />
                <span className="text-[10px] text-slate-300">txn</span>
              </div>
            </div>
          </div>

          {hasSalesData ? (
            <ResponsiveContainer width="100%" height={110}>
              <ComposedChart data={sorted30} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="g_ventas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C21875" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#C21875" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="g_ebitda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip content={<SalesTooltip />} />
                <Area type="monotone" dataKey="ventas" stroke="#C21875" strokeWidth={2}
                  fill="url(#g_ventas)" dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: '#C21875' }} />
                <Area type="monotone" dataKey="ebitda" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 2"
                  fill="url(#g_ebitda)" dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: '#6366f1' }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[110px] flex items-center justify-center rounded-xl"
              style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.06)' }}>
              <p className="text-[11px] text-slate-300 font-medium">Registra ventas para ver la tendencia</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2">
            {[{ c: '#C21875', l: 'Ventas' }, { c: '#6366f1', l: 'EBITDA est.' }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-4 h-px rounded-full" style={{ background: c }} />
                <span className="text-[9px] text-slate-300 font-medium">{l}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* TXN Bars + compliance */}
        <Card title="Transacciones" subtitle="Volumen diario reciente" delay={0.18} span="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[20px] font-black text-slate-700 tabular-nums leading-none">
                {today?.total_transactions ?? '—'}
              </p>
              <Delta val={txnDelta} />
            </div>
            {compliance !== null && (
              <div className="text-right">
                <p className="text-[18px] font-black tabular-nums leading-none"
                  style={{ color: compliance >= 80 ? '#10b981' : compliance >= 60 ? '#f59e0b' : '#e11d48' }}>
                  {compliance}%
                </p>
                <p className="text-[9px] text-slate-300 font-medium">PPT mensual</p>
              </div>
            )}
          </div>

          {hasSalesData ? (
            <ResponsiveContainer width="100%" height={90}>
              <ComposedChart data={sorted30.slice(-14)} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="g_txn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 7.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis hide />
                <Tooltip content={<TxnTooltip />} />
                <Bar dataKey="txn" fill="url(#g_txn)" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Line type="monotone" dataKey="txn" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[90px] flex items-center justify-center rounded-xl"
              style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.06)' }}>
              <p className="text-[11px] text-slate-300 font-medium">Sin datos</p>
            </div>
          )}

          {compliance !== null && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex justify-between text-[9px] text-slate-300 font-medium mb-1">
                <span>Avance PPT mensual</span><span>{compliance}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${compliance}%` }}
                  transition={{ delay: 0.6, duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: compliance >= 80
                      ? 'linear-gradient(90deg, #059669, #10b981)'
                      : compliance >= 60
                      ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                      : 'linear-gradient(90deg, #e11d48, #f43f5e)',
                  }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── ROW 2: Heatmap + Donut + Team ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Heatmap */}
        <Card title="Tráfico por Hora" subtitle="Patrón de transacciones · semana" delay={0.22}>
          <HourlyHeatmap data={heatmapData} />
          <div className="flex items-center justify-between mt-3 pt-2">
            <span className="text-[8.5px] text-slate-300 font-medium">Bajo</span>
            <div className="flex gap-1 flex-1 mx-3">
              {[
                'rgba(100,116,139,0.08)',
                'rgba(100,116,139,0.2)',
                'rgba(168,85,247,0.3)',
                'rgba(168,85,247,0.6)',
                'rgba(194,24,117,0.7)',
                'rgba(194,24,117,0.95)',
              ].map((bg, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-sm" style={{ background: bg }} />
              ))}
            </div>
            <span className="text-[8.5px] text-slate-300 font-medium">Alto</span>
          </div>
        </Card>

        {/* Participación donut */}
        <Card title="Mix del Negocio" subtitle="Participación por categoría" delay={0.26}>
          <DonutChart data={SEGMENTS} />
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'Combos', v: '+18%', c: '#10b981' },
                { l: 'Ticket', v: '$48K', c: '#0ea5e9' },
                { l: 'Conv.', v: '94%', c: '#C21875' },
              ].map(s => (
                <div key={s.l} className="text-center p-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.025)' }}>
                  <p className="text-[12px] font-black" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-[8.5px] text-slate-300 font-medium mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Team velocity */}
        <Card title="Velocidad del Equipo" subtitle={`${cashiers.length} colaboradores activos`} delay={0.3}>
          <VelocityBars cashiers={cashiers} />
          <div className="mt-4 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            {[
              { l: 'Satisf.', v: '94%', c: '#10b981' },
              { l: 'Puntual.', v: '98%', c: '#6366f1' },
            ].map(s => (
              <div key={s.l} className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
                style={{ background: `${s.c}08`, border: `1px solid ${s.c}15` }}>
                <p className="text-[13px] font-black" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[9px] text-slate-400 font-medium">{s.l}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}