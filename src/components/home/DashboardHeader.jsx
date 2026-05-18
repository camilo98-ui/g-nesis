import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import StoreSelector from '@/components/StoreSelector';

const LEADERS = {
  'TUNJA 1': 'Andrea', 'BTA 21': 'Nai', 'BTA 71': 'Mafe', 'BTA 66': 'Nidia',
  'BTA 52': 'Zai', 'BTA 62': 'Angie', 'BTA 18': 'Ruth', 'BTA 78': 'Brandon',
  'TUNJA 2': 'Isa', 'BTA 85': 'Edna', 'BTA 56': 'Cris', 'BTA 27': 'Andre'
};

const AVATAR_COLORS = {
  'Andrea':'#8B5CF6','Nai':'#FF4FA2','Mafe':'#06B6D4','Nidia':'#10B981',
  'Zai':'#F59E0B','Angie':'#EF4444','Ruth':'#8B5CF6','Brandon':'#3B82F6',
  'Isa':'#EC4899','Edna':'#14B8A6','Cris':'#F97316','Andre':'#6366F1'
};

function Sparkline({ data = [], color = '#FF4FA2', width = 80, height = 32 }) {
  if (!data || data.length < 2) return null;
  const vals = data.filter(v => v != null && !isNaN(v));
  if (vals.length < 2) return null;
  const W = 80, H = 32, pad = 3;
  const max = Math.max(...vals), min = Math.min(...vals);
  const range = max - min || 1;
  const toX = (i) => pad + (i / (vals.length - 1)) * (W - pad * 2);
  const toY = (v) => H - pad - ((v - min) / range) * (H - pad * 2);
  const coords = vals.map((v, i) => [toX(i), toY(v)]);
  let d = `M${coords[0][0]},${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const [lx, ly] = coords[coords.length - 1];
  const areaD = `${d} L${lx},${H} L${coords[0][0]},${H} Z`;
  const gId = `spark-${color.replace(/[^a-z0-9]/gi, '')}-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" preserveAspectRatio="none" style={{ width, height }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gId})`} />
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2" fill={color} />
    </svg>
  );
}

export function KPICardPremium({ label, value, sub, accent, spark, prefix, delay = 0, onClick }) {
  const fmt = (v) => {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className="relative rounded-2xl p-5 cursor-pointer group overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid #EFEFF3',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease',
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        transition: { duration: 0.18 }
      }}>

      {/* Subtle top line */}
      <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />

      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF' }}>
          {label}
        </p>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${accent}10` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        </div>
      </div>

      {/* Value + Sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#151515', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {prefix && <span style={{ fontSize: 14, marginRight: 2, color: accent }}>{prefix}</span>}
            {value}
          </p>
          <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 6 }}>{sub}</p>
        </div>
        <div className="flex-shrink-0 opacity-80">
          <Sparkline data={spark} color={accent} width={72} height={32} />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardHeader({
  selectedStore, onStoreChange, selectedRole, isGerente,
  latestWeather, budgetData, todaySales, kpiModal, setKpiModal,
  onShowBudgetImporter, onShowKpisUploader, onShowPYGUploader,
  onShowStoreSales, onLogout
}) {
  const leaderName = LEADERS[selectedStore] || 'Usuario';
  const avatarColor = AVATAR_COLORS[leaderName] || '#8B5CF6';
  const initials = leaderName.slice(0, 2).toUpperCase();

  const temp = latestWeather?.temperature_mean ?? latestWeather?.temperature_max;
  const precip = latestWeather?.precipitation ?? 0;
  const isHot = temp > 26;
  const isRainy = precip >= 3;
  const isCold = temp < 18;
  const salesImpact = isHot && !isRainy ? '+18%' : isRainy ? '−15%' : isCold ? '−10%' : '+7%';
  const impactPositive = isHot && !isRainy;
  const weatherIcon = isRainy ? '🌧' : isHot ? '☀️' : isCold ? '❄️' : '🌤';

  const fmt = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val || 0));

  const pptVal = budgetData ? (budgetData.excelBudgetForToday > 0 ? budgetData.excelBudgetForToday : budgetData.monthlyBudget ? budgetData.monthlyBudget / 30 : 0) : null;
  const gap = budgetData ? ((budgetData.salesUntilYesterday || 0) - (budgetData.budgetUntilYesterday || 0)) : null;
  const isPos = gap != null && gap >= 0;
  const projPct = budgetData?.monthProjectionCompliance ?? null;

  const sorted14 = [...(todaySales || [])].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);
  const dailyBudgetBase = budgetData?.monthlyBudget > 0 ? budgetData.monthlyBudget / 30 : 1;
  const sparkPPT = sorted14.map(d => dailyBudgetBase > 0 ? (d.total_sales || 0) / dailyBudgetBase * 100 : 0);
  const sparkGap = sorted14.map((d, i, arr) => {
    const accSales = arr.slice(0, i + 1).reduce((s, x) => s + (x.total_sales || 0), 0);
    const accBudget = dailyBudgetBase * (i + 1);
    return accSales - accBudget;
  });
  const sparkProj = sorted14.map((d, i, arr) => {
    const accSales = arr.slice(0, i + 1).reduce((s, x) => s + (x.total_sales || 0), 0);
    const accBudget = dailyBudgetBase * (i + 1);
    return accBudget > 0 ? accSales / accBudget * 100 : 0;
  });

  const kpiCards = pptVal != null ? [
    {
      key: 'ppt', label: 'PPT del Día', value: fmt(pptVal),
      sub: budgetData?.gapRecoveryIncrement > 0 ? `+${budgetData.incrementPct}% recuperación` : 'Meta diaria',
      accent: '#FF4FA2', spark: sparkPPT, delay: 0.05
    },
    {
      key: 'gap', label: 'Brecha del Mes', value: fmt(Math.abs(gap)),
      sub: budgetData?.monthlyBudget > 0 ? `${isPos ? 'Sobre' : 'Bajo'} meta · ${Math.abs(gap / budgetData.monthlyBudget * 100).toFixed(0)}%` : '—',
      accent: isPos ? '#10B981' : '#EF4444', spark: sparkGap, delay: 0.1,
      prefix: isPos ? '↑' : '↓'
    },
    {
      key: 'proj', label: 'Proyección Cierre', value: projPct != null ? `${projPct.toFixed(0)}%` : '—',
      sub: budgetData ? `${fmt(budgetData.monthProjection)} / ${fmt(budgetData.monthlyBudget)}` : '—',
      accent: '#8B5CF6', spark: sparkProj, delay: 0.15
    }
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-6">

      {/* ── TOP NAV BAR ── */}
      <div className="flex items-center justify-between mb-8 gap-4">

        {/* Left: Title block */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF4FA2, #8B5CF6)', boxShadow: '0 2px 8px rgba(255,79,162,0.3)' }}>
              <Sparkles style={{ width: 10, height: 10, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF' }}>
              Popsy Analytics
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#151515', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Dashboard Comercial
          </h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400, marginTop: 3 }}>
            Bienvenida de nuevo, <span style={{ color: '#6B7280', fontWeight: 500 }}>{leaderName}</span>
          </p>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">

          {/* Climate pill — compact */}
          {temp != null && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: '#F9FAFB',
                border: '1px solid #EFEFF3',
                fontSize: 11,
                color: '#6B7280',
                fontWeight: 500
              }}>
              <span>{weatherIcon}</span>
              <span>{Math.round(temp)}°C</span>
              <span style={{ color: '#D1D5DB' }}>·</span>
              <span style={{ color: impactPositive ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                {salesImpact} est.
              </span>
            </div>
          )}

          {/* Store selector */}
          <div className="w-36 sm:w-44">
            <StoreSelector selectedStore={selectedStore} onStoreChange={onStoreChange} />
          </div>

          {/* Quick actions for gerente */}
          {isGerente && (
            <div className="hidden sm:flex items-center gap-1">
              {[
                { label: 'PPT', onClick: onShowBudgetImporter },
                { label: 'KPIs', onClick: onShowKpisUploader },
                { label: 'P&G', onClick: onShowPYGUploader }
              ].map(({ label, onClick }) => (
                <button key={label} onClick={onClick}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{ color: '#6B7280', border: '1px solid #EFEFF3', background: '#fff' }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* + Venta */}
          {!isGerente && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShowStoreSales}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-medium"
              style={{
                background: 'linear-gradient(135deg, #FF4FA2, #E0388B)',
                color: '#fff',
                boxShadow: '0 2px 12px rgba(255,79,162,0.25)',
                border: 'none'
              }}>
              <span style={{ fontSize: 14, fontWeight: 300, lineHeight: 1 }}>+</span>
              <span>Venta</span>
            </motion.button>
          )}

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${avatarColor}20, ${avatarColor}10)`, border: `1.5px solid ${avatarColor}30` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: avatarColor }}>{initials}</span>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS GRID ── */}
      {kpiCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-0">
          {kpiCards.map(c => (
            <KPICardPremium
              key={c.key}
              label={c.label}
              value={c.value}
              sub={c.sub}
              accent={c.accent}
              spark={c.spark}
              prefix={c.prefix}
              delay={c.delay}
              onClick={() => setKpiModal?.(c.key)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}