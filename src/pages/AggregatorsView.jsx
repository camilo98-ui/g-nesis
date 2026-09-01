import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { ArrowLeft, TrendingUp, Crown, Sparkles, ChevronDown } from 'lucide-react';

/* ── helpers ── */
const fmtCOP = (v) => v
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(v))
  : '$0';

const CHANNEL_META = {
  'Al Paso':           { color: '#E91E8C', emoji: '🏠' },
  'Rappi':             { color: '#FF3B30', emoji: '🛵' },
  'Didi':              { color: '#FF9500', emoji: '🚗' },
  'Domicilios Propios':{ color: '#5856D6', emoji: '📦' },
  'iFood':             { color: '#EA1D2C', emoji: '🍔' },
};
const FALLBACK_COLORS = ['#E91E8C','#FF6CAB','#FF9500','#5856D6','#34C759','#AF52DE'];

function getMeta(channel, idx) {
  return CHANNEL_META[channel] || {
    color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    emoji: '📊',
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
const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function getMonthKey(r) {
  if (!r.month || !r.year) return null;
  return `${r.year}-${String(r.month).padStart(2,'0')}`;
}

/* ════════════════════════════════════════ MAIN ════════════════════════════════════════ */
export default function AggregatorsView() {
  const urlParams = new URLSearchParams(window.location.search);
  const storeParam = urlParams.get('store');
  const storeCode = storeParam ? extractStoreCode(storeParam) : null;

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['aggregators-view', storeCode],
    queryFn: async () => {
      const all = await base44.entities.AggregatorsData.list();
      if (!storeCode) return all;
      return all.filter(r => String(r.store_code||'').trim().toUpperCase() === storeCode.toUpperCase());
    },
    staleTime: 5 * 60 * 1000,
  });

  /* Solo meses con month/year explícitos (ignora registros viejos sin mes) */
  const availableMonths = useMemo(() => {
    const seen = new Set(), list = [];
    allRecords.forEach(r => {
      const key = getMonthKey(r);
      if (!key) return;
      if (!seen.has(key)) { seen.add(key); list.push({ key, month: r.month, year: r.year }); }
    });
    return list.sort((a,b)=>b.key.localeCompare(a.key));
  }, [allRecords]);

  const activeKey = selectedMonth || availableMonths[0]?.key || null;
  const activeMonthObj = availableMonths.find(m=>m.key===activeKey);

  const records = useMemo(() => {
    if (!activeKey) return [];
    return allRecords.filter(r => getMonthKey(r) === activeKey);
  }, [allRecords, activeKey]);

  /* Participación: usa el % del archivo, promediado si hay múltiples tiendas */
  const channels = useMemo(() => {
    const agg = {};
    records.forEach(r => {
      const ch = r.channel || 'Otro';
      if (!agg[ch]) agg[ch] = { channel: ch, total_sales: 0, participation: 0, count: 0 };
      agg[ch].total_sales += r.total_sales || 0;
      const rawPart = r.participation || 0;
      agg[ch].participation += rawPart > 1 ? rawPart : rawPart * 100;
      agg[ch].count += 1;
    });

    const arr = Object.values(agg);
    arr.forEach(d => { d.participation = d.count > 0 ? d.participation / d.count : 0; });
    arr.sort((a,b) => b.participation - a.participation);
    return arr.map((d,i) => ({
      ...d,
      pct: d.participation,
      meta: getMeta(d.channel, i),
    }));
  }, [records]);

  /* ── Trend data: total sales per channel per month (oldest → newest) ── */
  const trendData = useMemo(() => {
    return [...availableMonths].reverse().map(m => {
      const monthRecs = allRecords.filter(r => getMonthKey(r) === m.key);
      const channelMap = {};
      monthRecs.forEach(r => {
        const ch = r.channel || 'Otro';
        if (!channelMap[ch]) channelMap[ch] = 0;
        channelMap[ch] += r.total_sales || 0;
      });
      return { monthLabel: `${MONTHS[m.month-1]} ${String(m.year).slice(2)}`, ...channelMap };
    });
  }, [allRecords, availableMonths]);

  const trendChannels = useMemo(() => {
    const chSet = new Set();
    trendData.forEach(d => Object.keys(d).forEach(k => { if (k !== 'monthLabel') chSet.add(k); }));
    return [...chSet];
  }, [trendData]);

  /* ── Previous month sales for growth comparison ── */
  const prevMonthKey = useMemo(() => {
    if (!activeKey) return null;
    const idx = availableMonths.findIndex(m => m.key === activeKey);
    if (idx < 0 || idx + 1 >= availableMonths.length) return null;
    return availableMonths[idx + 1].key;
  }, [activeKey, availableMonths]);

  const prevMonthSales = useMemo(() => {
    if (!prevMonthKey) return {};
    const prevRecs = allRecords.filter(r => getMonthKey(r) === prevMonthKey);
    const agg = {};
    prevRecs.forEach(r => {
      const ch = r.channel || 'Otro';
      if (!agg[ch]) agg[ch] = 0;
      agg[ch] += r.total_sales || 0;
    });
    return agg;
  }, [allRecords, prevMonthKey]);

  const totalVentas = channels.reduce((s,c) => s + c.total_sales, 0);
  const leader = channels[0];
  const monthLabel = activeMonthObj ? `${MONTHS_FULL[activeMonthObj.month-1]} ${activeMonthObj.year}` : 'Reciente';
  const displayStore = storeCode || 'Todas';
  const donutData = channels.map(c => ({ name: c.channel, value: c.pct, color: c.meta.color }));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#FFFFFF',
      fontFamily: "'Inter Tight','Inter',system-ui,sans-serif",
      overflowY: 'auto',
      zIndex: 9999,
    }}>

      {/* ── HEADER ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: '18px 16px 14px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderBottom: '1px solid rgba(233,30,140,0.08)',
      }}>
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => window.history.back()}
            style={{
              width: 36, height: 36,
              borderRadius: 14,
              background: 'rgba(233,30,140,0.08)',
              border: '1px solid rgba(233,30,140,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ color:'#E91E8C', width:18, height:18 }} />
          </button>

          <div className="text-center">
            <p style={{ fontSize: 17, fontWeight: 900, color: '#1C1C1E', letterSpacing: '-0.03em', margin: 0 }}>Agregadores</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', marginTop: 2 }}>Participación por canal · {displayStore}</p>
          </div>

          <div style={{
            width: 36, height: 36,
            borderRadius: 14,
            background: 'linear-gradient(135deg,#E91E8C,#AF52DE)',
            boxShadow: '0 4px 16px rgba(233,30,140,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp style={{ color:'#fff', width:16, height:16 }} />
          </div>
        </div>

        {/* Month selector — dropdown */}
        {availableMonths.length > 0 && (
          <div ref={dropdownRef} style={{ position: 'relative', marginTop: 12 }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: 14,
                background: dropdownOpen ? 'rgba(233,30,140,0.1)' : 'rgba(233,30,140,0.06)',
                border: '1px solid rgba(233,30,140,0.12)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 8,
                  background: 'linear-gradient(135deg,rgba(233,30,140,0.15),rgba(175,82,222,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp style={{ color:'#E91E8C', width:12, height:12 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1E', letterSpacing: '-0.02em' }}>
                  {activeMonthObj ? `${MONTHS_FULL[activeMonthObj.month-1]} ${activeMonthObj.year}` : 'Seleccionar mes'}
                </span>
              </div>
              <ChevronDown style={{
                color:'#E91E8C', width:16, height:16,
                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }} />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0, right: 0,
                    borderRadius: 14,
                    background: '#FFFFFF',
                    border: '1px solid rgba(233,30,140,0.12)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(233,30,140,0.08)',
                    overflow: 'hidden',
                    zIndex: 50,
                    maxHeight: 280,
                    overflowY: 'auto',
                  }}
                >
                  {availableMonths.map(m => (
                    <button
                      key={m.key}
                      onClick={() => { setSelectedMonth(m.key); setDropdownOpen(false); }}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '11px 16px',
                        border: 'none',
                        background: m.key === activeKey ? 'rgba(233,30,140,0.06)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{
                        fontSize: 13, fontWeight: m.key === activeKey ? 800 : 600,
                        color: m.key === activeKey ? '#E91E8C' : '#3C3C43',
                      }}>
                        {MONTHS_FULL[m.month-1]} {m.year}
                      </span>
                      {m.key === activeKey && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E91E8C' }} />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {isLoading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding: '120px 0' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '2.5px solid #FFB3D9',
              borderTopColor: '#E91E8C',
              animation: 'spin 0.8s linear infinite',
            }}/>
          </div>
        ) : channels.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 0', gap:12 }}>
            <div style={{ width:64, height:64, borderRadius:24, background:'rgba(233,30,140,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp style={{color:'#E91E8C',width:28,height:28,opacity:0.4}}/>
            </div>
            <p style={{ fontSize:15, fontWeight:700, color:'#636366' }}>Sin datos de agregadores</p>
            <p style={{ fontSize:12, color:'#AEAEB2', textAlign:'center' }}>Carga el archivo Excel desde el panel del gerente</p>
          </div>
        ) : (
          <>
            {/* ══ DONUT + LEADER ══ */}
            <motion.div
              initial={{ opacity:0, scale:0.97 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay:0.05, duration:0.5, ease:[0.23,1,0.32,1] }}
              style={{
                borderRadius: 24,
                padding: '22px 20px 20px',
                background: '#FFFFFF',
                border: '1px solid rgba(233,30,140,0.1)',
                boxShadow: '0 4px 24px rgba(233,30,140,0.08), 0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{
                  width:30, height:30, borderRadius:10,
                  background:'rgba(233,30,140,0.09)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Crown style={{color:'#E91E8C',width:14,height:14}}/>
                </div>
                <p style={{ fontSize:14, fontWeight:900, color:'#1C1C1E', letterSpacing:'-0.02em', margin:0 }}>Distribución · {monthLabel}</p>
              </div>

              {/* Donut */}
              <div style={{ position:'relative', height:200 }}>
                <div style={{
                  position:'absolute', top:'50%', left:'50%',
                  transform:'translate(-50%,-50%)',
                  width:180, height:180, borderRadius:'50%',
                  background:'radial-gradient(circle,rgba(233,30,140,0.18) 30%,transparent 70%)',
                  filter:'blur(24px)',
                  pointerEvents:'none',
                }}/>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={62} outerRadius={88}
                      dataKey="value"
                      paddingAngle={2}
                      stroke="none"
                      animationBegin={200}
                      animationDuration={900}
                    >
                      {donutData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip
                      formatter={(v,n) => [`${v.toFixed(1)}%`, n]}
                      contentStyle={{
                        borderRadius:14, border:'1px solid rgba(233,30,140,0.12)',
                        background:'rgba(255,255,255,0.98)',
                        boxShadow:'0 8px 32px rgba(0,0,0,0.12)',
                        fontSize:12, fontWeight:600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                  position:'absolute', inset:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  pointerEvents:'none',
                }}>
                  {leader && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                      <Crown style={{color:'#E91E8C',width:14,height:14}}/>
                      <p style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'#8E8E93', margin:0 }}>Canal Líder</p>
                      <p style={{ fontSize:12, fontWeight:900, color:'#1C1C1E', margin:0, letterSpacing:'-0.02em' }}>{leader.channel}</p>
                      <p style={{ fontSize:20, fontWeight:900, color:'#E91E8C', margin:0, letterSpacing:'-0.04em' }}>{leader.pct.toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Channel legend with % */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:12 }}>
                {channels.map((c, i) => (
                  <div key={c.channel} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:10, background:`${c.meta.color}12`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                      {c.meta.emoji}
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:'#3C3C43', flex:1 }}>{c.channel}</span>
                    {c.total_sales > 1 && (
                      <span style={{ fontSize:10, fontWeight:600, color:'#8E8E93', fontVariantNumeric:'tabular-nums' }}>{fmtCOP(c.total_sales)}</span>
                    )}
                    {(() => {
                      const prevVal = prevMonthSales[c.channel] || 0;
                      if (prevVal <= 0 || c.total_sales <= 1) return null;
                      const growth = ((c.total_sales - prevVal) / prevVal) * 100;
                      const isUp = growth > 0.5;
                      const isDown = growth < -0.5;
                      if (!isUp && !isDown) return <span style={{ fontSize:9, fontWeight:700, color:'#8E8E93', padding:'2px 6px' }}>≈</span>;
                      return (
                        <span style={{
                          fontSize:9, fontWeight:800,
                          color: isUp ? '#34C759' : '#FF3B30',
                          display:'inline-flex', alignItems:'center', gap:1,
                          background: isUp ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                          padding: '2px 6px', borderRadius: 6,
                        }}>
                          {isUp ? '↑' : '↓'} {Math.abs(growth).toFixed(0)}%
                        </span>
                      );
                    })()}
                    <span style={{ fontSize:14, fontWeight:900, color:c.meta.color, fontVariantNumeric:'tabular-nums', minWidth:48, textAlign:'right' }}>{c.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ══ TREND CHART (Line Chart) ══ */}
            {trendData.length >= 2 && (
              <motion.div
                initial={{ opacity:0, y:12 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:0.2, duration:0.45 }}
                style={{
                  borderRadius: 24,
                  padding: '20px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(233,30,140,0.1)',
                  boxShadow: '0 4px 24px rgba(233,30,140,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{
                    width:30, height:30, borderRadius:10,
                    background:'rgba(233,30,140,0.09)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <TrendingUp style={{color:'#E91E8C',width:14,height:14}}/>
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:900, color:'#1C1C1E', letterSpacing:'-0.02em', margin:0 }}>Tendencia por Canal</p>
                    <p style={{ fontSize:10, fontWeight:600, color:'#8E8E93', margin:'2px 0 0 0' }}>Venta bruta mensual por agregador</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      {trendChannels.map((ch, i) => {
                        const meta = getMeta(ch, i);
                        return (
                          <linearGradient key={ch} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={meta.color} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={meta.color} stopOpacity={0} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                    <XAxis dataKey="monthLabel" tick={{ fontSize:10, fontWeight:700, fill:'#8E8E93' }} axisLine={false} tickLine={false} dy={8} />
                    <YAxis tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} tick={{ fontSize:10, fill:'#8E8E93' }} axisLine={false} tickLine={false} width={42} />
                    <Tooltip
                      formatter={(v, name) => [fmtCOP(v), name]}
                      contentStyle={{
                        borderRadius:14, border:'1px solid rgba(233,30,140,0.12)',
                        background:'rgba(255,255,255,0.98)',
                        boxShadow:'0 8px 32px rgba(0,0,0,0.12)',
                        fontSize:11, fontWeight:600,
                      }}
                      cursor={{ stroke: 'rgba(233,30,140,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    {trendChannels.map((ch, i) => {
                      const meta = getMeta(ch, i);
                      return (
                        <Line
                          key={ch}
                          type="monotone"
                          dataKey={ch}
                          stroke={meta.color}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#fff', stroke: meta.color, strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: meta.color, stroke: '#fff', strokeWidth: 2 }}
                          animationDuration={800}
                          animationBegin={100 * i}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* ══ TOTAL + CANALES KPI ══ */}
            {totalVentas > 1 && (
              <motion.div
                initial={{ opacity:0, y:12 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:0.15, duration:0.45 }}
                style={{
                  borderRadius: 20,
                  padding: '18px 20px',
                  background: 'radial-gradient(ellipse 120% 100% at 50% -10%, #FFD6EC 0%, #FFF0F9 45%, #F8F0FF 80%, #EEF0FF 100%)',
                  border: '1px solid rgba(233,30,140,0.15)',
                  boxShadow: '0 4px 24px rgba(233,30,140,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(233,30,140,0.55)', margin:0, marginBottom:4 }}>
                    Venta Total
                  </p>
                  <p style={{ fontSize:28, fontWeight:900, color:'#1C1C1E', lineHeight:1.1, letterSpacing:'-0.04em', margin:0 }}>
                    {fmtCOP(totalVentas)}
                  </p>
                  <p style={{ fontSize:11, color:'#8E8E93', fontWeight:500, margin:'4px 0 0 0' }}>{channels.length} canales activos</p>
                </div>
                <div style={{
                  width:48, height:48, borderRadius:16,
                  background:'linear-gradient(135deg,#E91E8C,#AF52DE)',
                  boxShadow:'0 4px 16px rgba(233,30,140,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <TrendingUp style={{color:'#fff',width:20,height:20}}/>
                </div>
              </motion.div>
            )}

            {/* ══ AI INSIGHT ══ */}
            {leader && (
              <motion.div
                initial={{ opacity:0, y:16 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:0.25, duration:0.5 }}
                style={{
                  borderRadius: 20,
                  padding: '16px 18px',
                  background: 'linear-gradient(135deg,rgba(233,30,140,0.05) 0%,rgba(175,82,222,0.06) 100%)',
                  border: '1px solid rgba(233,30,140,0.12)',
                  boxShadow: '0 4px 20px rgba(233,30,140,0.06)',
                  display:'flex', alignItems:'flex-start', gap:12,
                }}
              >
                <div style={{
                  width:36, height:36, borderRadius:12, flexShrink:0,
                  background:'linear-gradient(135deg,#E91E8C,#AF52DE)',
                  boxShadow:'0 4px 14px rgba(233,30,140,0.35)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Sparkles style={{color:'#fff',width:16,height:16}}/>
                </div>
                <div>
                  <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.16em', color:'#E91E8C', margin:'0 0 4px 0' }}>
                    Insight · Nova AI
                  </p>
                  <p style={{ fontSize:13, fontWeight:500, color:'#3C3C43', lineHeight:1.55, margin:0 }}>
                    <span style={{ fontWeight:900, color:'#1C1C1E' }}>{leader.channel}</span> concentra el{' '}
                    <span style={{ color:'#E91E8C', fontWeight:800 }}>{leader.pct.toFixed(1)}%</span> de las ventas.
                    {channels[1] && (
                      <> <span style={{ fontWeight:900, color:'#1C1C1E' }}>{channels[1].channel}</span> le sigue con{' '}
                      <span style={{ color:channels[1].meta.color, fontWeight:800 }}>{channels[1].pct.toFixed(1)}%</span>.</>
                    )}
                  </p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}