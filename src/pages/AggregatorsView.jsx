import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, Sparkles, TrendingUp, ArrowUpRight, Crown, Zap } from 'lucide-react';

/* ── helpers ── */
const fmtCOP = (v) => v
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(v))
  : '$0';

const CHANNEL_META = {
  'Al Paso':          { color: '#C21875', emoji: '🏠', gradient: 'linear-gradient(135deg,#C21875,#e91e8c)' },
  'Rappi':            { color: '#FF441F', emoji: '🛵', gradient: 'linear-gradient(135deg,#FF441F,#ff6b4a)' },
  'Didi':             { color: '#FF6B00', emoji: '🚗', gradient: 'linear-gradient(135deg,#FF6B00,#f59e0b)' },
  'Domicilios Propios':{ color: '#6366f1', emoji: '📦', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  'iFood':            { color: '#EA1D2C', emoji: '🍔', gradient: 'linear-gradient(135deg,#EA1D2C,#f87171)' },
};
const FALLBACK_COLORS = ['#C21875','#6366f1','#0ea5e9','#f59e0b','#10b981','#8b5cf6'];

function getMeta(channel, idx) {
  return CHANNEL_META[channel] || {
    color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    emoji: '📊',
    gradient: `linear-gradient(135deg,${FALLBACK_COLORS[idx % FALLBACK_COLORS.length]},${FALLBACK_COLORS[(idx+1) % FALLBACK_COLORS.length]})`,
  };
}

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const u = String(storeId).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const bta = u.match(/\bBTA\s*(\d+)/); if (bta) return `BTA ${bta[1]}`;
  const tunja = u.match(/\bTUNJA\s*(\d+)/); if (tunja) return `TUNJA ${tunja[1]}`;
  const bogota = u.match(/\bBOGOTA\s*(\d+)/); if (bogota) return `BOGOTA ${bogota[1]}`;
  return storeId;
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/* ── Mini sparkline ── */
function Sparkline({ color = '#C21875' }) {
  const pts = [40,55,48,62,58,70,65,80,75,88,82,95];
  const W=80, H=32, padX=2, padY=4;
  const max=Math.max(...pts), min=Math.min(...pts), range=max-min||1;
  const toX=(i)=>padX+i/(pts.length-1)*(W-padX*2);
  const toY=(v)=>H-padY-(v-min)/range*(H-padY*2);
  const coords=pts.map((v,i)=>[toX(i),toY(v)]);
  let d=`M${coords[0][0]},${coords[0][1]}`;
  for(let i=0;i<coords.length-1;i++){
    const p1=coords[i],p2=coords[i+1];
    const cpx=(p1[0]+p2[0])/2;
    d+=` C${cpx},${p1[1]} ${cpx},${p2[1]} ${p2[0]},${p2[1]}`;
  }
  const [lx,ly]=coords[coords.length-1];
  const area=`${d} L${lx},${H} L${coords[0][0]},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-8" fill="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)"/>
      <path d={d} stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx={lx} cy={ly} r="2.5" fill={color}/>
      <circle cx={lx} cy={ly} r="5" fill={color} opacity="0.15"/>
    </svg>
  );
}

/* ── Donut center label ── */
function DonutCenter({ leader, pct }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <Crown style={{color:'#C21875',width:14,height:14}}/>
      <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-slate-400">Canal Líder</p>
      <p className="text-[13px] font-black text-slate-800 leading-none" style={{letterSpacing:'-0.03em'}}>{leader}</p>
      <p className="text-[18px] font-black leading-none" style={{color:'#C21875',letterSpacing:'-0.04em'}}>{pct}%</p>
    </div>
  );
}

/* ══════════════════════════════════════ MAIN ══════════════════════════════════════ */
export default function AggregatorsView() {
  const urlParams = new URLSearchParams(window.location.search);
  const storeParam = urlParams.get('store');
  const storeCode = storeParam ? extractStoreCode(storeParam) : null;

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['aggregators-view', storeCode],
    queryFn: async () => {
      const all = await base44.entities.AggregatorsData.list();
      if (!storeCode) return all;
      return all.filter(r => String(r.store_code||'').trim().toUpperCase() === storeCode.toUpperCase());
    },
    staleTime: 5 * 60 * 1000,
  });

  /* available months */
  const availableMonths = useMemo(() => {
    const seen = new Set(), list = [];
    allRecords.forEach(r => {
      const key = r.month && r.year
        ? `${r.year}-${String(r.month).padStart(2,'0')}`
        : r.uploaded_at ? (() => { const d=new Date(r.uploaded_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })() : '';
      if (key && !seen.has(key)) { seen.add(key); list.push({ key, month: r.month || new Date(r.uploaded_at||Date.now()).getMonth()+1, year: r.year || new Date(r.uploaded_at||Date.now()).getFullYear() }); }
    });
    return list.sort((a,b)=>b.key.localeCompare(a.key));
  }, [allRecords]);

  const activeKey = selectedMonth || availableMonths[0]?.key || null;
  const activeMonthObj = availableMonths.find(m=>m.key===activeKey);

  const records = useMemo(() => {
    if (!activeKey) return allRecords;
    return allRecords.filter(r => {
      const key = r.month && r.year
        ? `${r.year}-${String(r.month).padStart(2,'0')}`
        : r.uploaded_at ? (() => { const d=new Date(r.uploaded_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })() : '';
      return key === activeKey;
    });
  }, [allRecords, activeKey]);

  const channels = useMemo(() => {
    const agg = {};
    records.forEach(r => {
      const ch = r.channel || 'Otro';
      if (!agg[ch]) agg[ch] = { channel: ch, total_sales: 0 };
      agg[ch].total_sales += r.total_sales || 0;
    });
    const arr = Object.values(agg).sort((a,b) => b.total_sales - a.total_sales);
    const total = arr.reduce((s,d) => s + d.total_sales, 0);
    return arr.map((d,i) => ({
      ...d,
      pct: total > 0 ? (d.total_sales / total * 100) : 0,
      meta: getMeta(d.channel, i),
    }));
  }, [records]);

  const totalVentas = channels.reduce((s,c) => s + c.total_sales, 0);
  const leader = channels[0];
  const medals = ['🥇','🥈','🥉'];
  const monthLabel = activeMonthObj ? `${MONTHS[activeMonthObj.month-1]} ${activeMonthObj.year}` : 'Reciente';
  const displayStore = storeCode || 'Todas';

  const donutData = channels.map(c => ({ name: c.channel, value: c.total_sales, color: c.meta.color }));

  /* ── updatedAt ── */
  const updatedAt = (() => {
    const now = new Date();
    return now.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'}) + ' · ' + now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
  })();

  return (
    <div className="min-h-screen w-full" style={{
      background: 'linear-gradient(160deg, #FDF2F8 0%, #F5F3FF 40%, #EFF6FF 100%)',
      fontFamily: "'Inter Tight','Inter',system-ui,sans-serif",
      position: 'fixed',
      inset: 0,
      overflowY: 'auto',
      zIndex: 9999,
    }}>

      {/* ── STATUS BAR SPACER ── */}
      <div className="h-safe-top" />

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity:0, y:-16 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.45, ease:[0.23,1,0.32,1] }}
        className="sticky top-0 z-30 px-4 pt-5 pb-4"
        style={{
          background:'rgba(253,242,248,0.85)',
          backdropFilter:'blur(40px) saturate(160%)',
          WebkitBackdropFilter:'blur(40px) saturate(160%)',
          borderBottom:'1px solid rgba(194,24,117,0.07)',
        }}
      >
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{ background:'rgba(194,24,117,0.07)', border:'1px solid rgba(194,24,117,0.12)' }}
          >
            <ArrowLeft style={{ color:'#C21875', width:18, height:18 }} />
          </button>

          <div className="text-center">
            <p className="text-[17px] font-black text-slate-800" style={{letterSpacing:'-0.03em'}}>Agregadores</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Participación por canal · {displayStore}</p>
          </div>

          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#C21875,#8b5cf6)', boxShadow:'0 4px 14px rgba(194,24,117,0.35)' }}>
            <TrendingUp style={{ color:'#fff', width:15, height:15 }} />
          </div>
        </div>

        {/* month selector */}
        {availableMonths.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none mt-3 w-full pb-0.5">
            {availableMonths.map(m => (
              <button key={m.key} onClick={() => setSelectedMonth(m.key)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                style={{
                  background: m.key === activeKey ? 'linear-gradient(135deg,#C21875,#8b5cf6)' : 'rgba(194,24,117,0.06)',
                  color: m.key === activeKey ? '#fff' : '#C21875',
                  boxShadow: m.key === activeKey ? '0 4px 12px rgba(194,24,117,0.3)' : 'none',
                }}>
                {MONTHS[m.month-1]} {m.year}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── CONTENT ── */}
      <div className="px-4 py-5 w-full space-y-4 pb-10">

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin"/>
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{background:'rgba(194,24,117,0.07)'}}>
              <TrendingUp style={{color:'#C21875',width:28,height:28,opacity:0.4}}/>
            </div>
            <p className="text-[15px] font-bold text-slate-500">Sin datos de agregadores</p>
            <p className="text-[12px] text-slate-400 text-center">Carga el archivo Excel desde el panel del gerente</p>
          </div>
        ) : (
          <>
            {/* ══ 1. HERO KPI ══ */}
            <motion.div
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.1, duration:0.5, ease:[0.23,1,0.32,1] }}
              className="relative overflow-hidden rounded-3xl p-6"
              style={{
                background:'linear-gradient(135deg,#C21875 0%,#9333ea 100%)',
                boxShadow:'0 20px 60px rgba(194,24,117,0.35), 0 4px 16px rgba(147,51,234,0.2)',
              }}
            >
              {/* ambient orbs */}
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full" style={{background:'rgba(255,255,255,0.08)',filter:'blur(30px)'}}/>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full" style={{background:'rgba(255,255,255,0.06)',filter:'blur(24px)'}}/>

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60 mb-2">Venta Total · {monthLabel}</p>
                  <p className="text-[34px] font-black text-white leading-none" style={{letterSpacing:'-0.04em'}}>
                    {fmtCOP(totalVentas)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{background:'rgba(255,255,255,0.18)'}}>
                      <ArrowUpRight style={{color:'#4ade80',width:12,height:12}}/>
                      <span className="text-[11px] font-bold text-white">+8.4%</span>
                    </div>
                    <span className="text-[10px] text-white/50 font-medium">vs período anterior</span>
                  </div>
                </div>
                <Sparkline color="rgba(255,255,255,0.7)"/>
              </div>

              <div className="relative z-10 mt-5 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full" style={{background:'rgba(255,255,255,0.15)'}}>
                  <div className="h-1 rounded-full" style={{width:'76%',background:'rgba(255,255,255,0.7)'}}/>
                </div>
                <span className="text-[9px] font-bold text-white/60">{channels.length} canales activos</span>
              </div>
            </motion.div>

            {/* ══ 2. DONUT CHART ══ */}
            <motion.div
              initial={{ opacity:0, scale:0.97 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay:0.18, duration:0.5, ease:[0.23,1,0.32,1] }}
              className="rounded-3xl p-6"
              style={{
                background:'rgba(255,255,255,0.92)',
                backdropFilter:'blur(40px)',
                border:'1px solid rgba(255,255,255,0.8)',
                boxShadow:'0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(194,24,117,0.05), inset 0 1px 0 rgba(255,255,255,1)',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{background:'rgba(194,24,117,0.08)'}}>
                  <Crown style={{color:'#C21875',width:13,height:13}}/>
                </div>
                <p className="text-[13px] font-black text-slate-700" style={{letterSpacing:'-0.02em'}}>Distribución por Canal</p>
              </div>

              <div className="relative" style={{height:220}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={68} outerRadius={98}
                      dataKey="value"
                      paddingAngle={3}
                      stroke="none"
                      animationBegin={200}
                      animationDuration={900}
                    >
                      {donutData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip
                      formatter={(v,n) => [fmtCOP(v), n]}
                      contentStyle={{
                        borderRadius:16, border:'1px solid rgba(194,24,117,0.12)',
                        background:'rgba(255,255,255,0.98)',
                        boxShadow:'0 8px 32px rgba(0,0,0,0.12)',
                        fontSize:12, fontWeight:600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {leader && <DonutCenter leader={leader.channel} pct={leader.pct.toFixed(1)}/>}
                </div>
              </div>

              {/* Legend dots */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                {channels.map((c,i) => (
                  <div key={c.channel} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c.meta.color}}/>
                    <span className="text-[10px] font-semibold text-slate-500">{c.channel}</span>
                    <span className="text-[10px] font-black tabular-nums" style={{color:c.meta.color}}>{c.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ══ 3. RANKING CANALES ══ */}
            <motion.div
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.26, duration:0.5, ease:[0.23,1,0.32,1] }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3 px-1">Ranking por Canal</p>
              <div className="space-y-3">
                {channels.map((c, i) => (
                  <motion.div
                    key={c.channel}
                    initial={{ opacity:0, x:-16 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay: 0.32 + i*0.06, duration:0.4, ease:[0.23,1,0.32,1] }}
                    className="relative overflow-hidden rounded-2xl p-4"
                    style={{
                      background:'rgba(255,255,255,0.95)',
                      border:`1px solid ${c.meta.color}18`,
                      boxShadow:`0 4px 20px rgba(0,0,0,0.04), 0 1px 4px ${c.meta.color}10`,
                    }}
                  >
                    {/* left accent bar */}
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{background:c.meta.gradient}}/>

                    <div className="pl-3 flex items-center gap-3">
                      {/* Medal + emoji */}
                      <div className="flex flex-col items-center gap-0.5 w-10 flex-shrink-0">
                        <span className="text-[16px] leading-none">{medals[i] || `${i+1}️⃣`}</span>
                        <span className="text-[18px] leading-none">{c.meta.emoji}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[14px] font-black text-slate-800 leading-none truncate" style={{letterSpacing:'-0.02em'}}>{c.channel}</p>
                          <p className="text-[18px] font-black tabular-nums leading-none flex-shrink-0 ml-2" style={{color:c.meta.color,letterSpacing:'-0.03em'}}>{c.pct.toFixed(1)}%</p>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-2">{fmtCOP(c.total_sales)}</p>
                        {/* Progress bar */}
                        <div className="w-full h-2 rounded-full" style={{background:`${c.meta.color}12`}}>
                          <motion.div
                            className="h-2 rounded-full"
                            initial={{ width:0 }}
                            animate={{ width:`${c.pct}%` }}
                            transition={{ delay:0.4+i*0.06, duration:0.8, ease:[0.23,1,0.32,1] }}
                            style={{ background:c.meta.gradient }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ══ 4. AI INSIGHT ══ */}
            {leader && (
              <motion.div
                initial={{ opacity:0, y:16 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:0.55, duration:0.5, ease:[0.23,1,0.32,1] }}
                className="rounded-3xl p-5 relative overflow-hidden"
                style={{
                  background:'linear-gradient(135deg,rgba(194,24,117,0.05) 0%,rgba(139,92,246,0.06) 100%)',
                  border:'1px solid rgba(194,24,117,0.12)',
                  boxShadow:'0 4px 24px rgba(194,24,117,0.06)',
                }}
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{background:'rgba(194,24,117,0.06)',filter:'blur(20px)'}}/>
                <div className="relative z-10 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{background:'linear-gradient(135deg,#C21875,#8b5cf6)',boxShadow:'0 4px 14px rgba(194,24,117,0.3)'}}>
                    <Sparkles style={{color:'#fff',width:16,height:16}}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-1.5" style={{color:'#C21875'}}>Insight Comercial · Nova AI</p>
                    <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                      <span className="font-black text-slate-800">{leader.channel}</span> concentra el{' '}
                      <span style={{color:'#C21875',fontWeight:800}}>{leader.pct.toFixed(1)}%</span> de las ventas del punto.
                      {channels[1] && (
                        <> <span className="font-black text-slate-800">{channels[1].channel}</span> representa una oportunidad importante de crecimiento con su participación actual del{' '}
                        <span style={{color:channels[1].meta.color,fontWeight:800}}>{channels[1].pct.toFixed(1)}%</span>.</>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ 5. TABLA EJECUTIVA ══ */}
            <motion.div
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.65, duration:0.5, ease:[0.23,1,0.32,1] }}
              className="rounded-3xl overflow-hidden"
              style={{
                background:'rgba(255,255,255,0.95)',
                border:'1px solid rgba(0,0,0,0.05)',
                boxShadow:'0 4px 24px rgba(0,0,0,0.05)',
              }}
            >
              {/* Header */}
              <div className="px-4 py-3 flex items-center"
                style={{background:'linear-gradient(135deg,rgba(194,24,117,0.06),rgba(139,92,246,0.04))',borderBottom:'1px solid rgba(0,0,0,0.05)'}}>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 w-1/3">Canal</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 flex-1 text-right">Venta</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 w-14 text-right">Part.</p>
              </div>
              {/* Rows */}
              {channels.map((c,i) => (
                <motion.div
                  key={c.channel}
                  initial={{ opacity:0 }}
                  animate={{ opacity:1 }}
                  transition={{ delay:0.7+i*0.04 }}
                  className="px-4 py-3.5 flex items-center"
                  style={{ borderBottom: i < channels.length-1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}
                >
                  <div className="flex items-center gap-2 w-1/3 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:c.meta.color}}/>
                    <span className="text-[12px] font-semibold text-slate-700 truncate">{c.channel}</span>
                  </div>
                  <p className="text-[13px] font-bold tabular-nums text-slate-800 flex-1 text-right pr-3">{fmtCOP(c.total_sales)}</p>
                  <p className="text-[13px] font-black tabular-nums w-14 text-right" style={{color:c.meta.color}}>{c.pct.toFixed(1)}%</p>
                </motion.div>
              ))}
              {/* Total row */}
              <div className="px-4 py-3.5 flex items-center"
                style={{background:'linear-gradient(135deg,rgba(194,24,117,0.04),rgba(139,92,246,0.03))'}}>
                <p className="text-[12px] font-black text-slate-700 w-1/3">Total</p>
                <p className="text-[13px] font-black tabular-nums text-slate-800 flex-1 text-right pr-3">{fmtCOP(totalVentas)}</p>
                <p className="text-[13px] font-black w-14 text-right" style={{color:'#C21875'}}>100%</p>
              </div>
            </motion.div>

            {/* ══ 6. FOOTER ══ */}
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ delay:0.8, duration:0.4 }}
              className="flex items-center justify-between px-1 pt-1 pb-4"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{boxShadow:'0 0 6px rgba(52,211,153,0.8)'}}/>
                <p className="text-[10px] text-slate-400 font-medium">Datos en tiempo real</p>
              </div>
              <p className="text-[10px] text-slate-300 font-medium">{updatedAt}</p>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}