import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import { ArrowLeft, TrendingUp, Crown, Sparkles } from 'lucide-react';

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

/* ════════════════════════════════════════ MAIN ════════════════════════════════════════ */
export default function AggregatorsView() {
  const urlParams = new URLSearchParams(window.location.search);
  const storeParam = urlParams.get('store');
  const storeCode = storeParam ? extractStoreCode(storeParam) : null;

  const [selectedMonth, setSelectedMonth] = useState(null);

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['aggregators-view', storeCode],
    queryFn: async () => {
      const all = await base44.entities.AggregatorsData.list();
      if (!storeCode) return all;
      return all.filter(r => String(r.store_code||'').trim().toUpperCase() === storeCode.toUpperCase());
    },
    staleTime: 5 * 60 * 1000,
  });

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
      if (!agg[ch]) agg[ch] = { channel: ch, total_sales: 0, participation: 0, count: 0 };
      agg[ch].total_sales += r.total_sales || 0;
      const rawPart = r.participation || 0;
      agg[ch].participation += rawPart > 1 ? rawPart : rawPart * 100;
      agg[ch].count += 1;
    });

    const arr = Object.values(agg);
    const totalSalesSum = arr.reduce((s,d) => s + d.total_sales, 0);
    const hasSalesData = totalSalesSum > arr.length;

    if (hasSalesData) {
      arr.sort((a,b) => b.total_sales - a.total_sales);
      return arr.map((d,i) => ({
        ...d,
        pct: totalSalesSum > 0 ? (d.total_sales / totalSalesSum * 100) : 0,
        meta: getMeta(d.channel, i),
      }));
    } else {
      arr.forEach(d => { d.participation = d.participation / d.count; });
      const totalPart = arr.reduce((s,d) => s + d.participation, 0);
      arr.sort((a,b) => b.participation - a.participation);
      return arr.map((d,i) => ({
        ...d,
        total_sales: 0,
        pct: totalPart > 0 ? (d.participation / totalPart * 100) : d.participation,
        meta: getMeta(d.channel, i),
      }));
    }
  }, [records]);

  const totalVentas = channels.reduce((s,c) => s + c.total_sales, 0);
  const leader = channels[0];
  const monthLabel = activeMonthObj ? `${MONTHS[activeMonthObj.month-1]} ${activeMonthObj.year}` : 'Reciente';
  const displayStore = storeCode || 'Todas';
  const donutData = channels.map(c => ({ name: c.channel, value: c.total_sales > 1 ? c.total_sales : c.pct, color: c.meta.color }));

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

        {/* Month selector */}
        {availableMonths.length > 1 && (
          <div style={{ display:'flex', gap:8, overflowX:'auto', marginTop:12, paddingBottom:2 }}>
            {availableMonths.map(m => (
              <button key={m.key} onClick={() => setSelectedMonth(m.key)}
                style={{
                  flexShrink: 0,
                  padding: '6px 14px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: m.key === activeKey ? 'linear-gradient(135deg,#E91E8C,#AF52DE)' : 'rgba(233,30,140,0.07)',
                  color: m.key === activeKey ? '#fff' : '#E91E8C',
                  boxShadow: m.key === activeKey ? '0 4px 12px rgba(233,30,140,0.3)' : 'none',
                }}>
                {MONTHS[m.month-1]} {m.year}
              </button>
            ))}
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
                      formatter={(v,n) => [totalVentas > 1 ? fmtCOP(v) : `${v.toFixed(1)}%`, n]}
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
                    <span style={{ fontSize:14, fontWeight:900, color:c.meta.color, fontVariantNumeric:'tabular-nums', minWidth:48, textAlign:'right' }}>{c.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

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