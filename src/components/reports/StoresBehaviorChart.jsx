import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const STORES_DATA = [
  { code: 'BTA 78', ventasVar: 28, transVar: 18, ticketVar: 12.5 },
  { code: 'BTA 21', ventasVar: 25, transVar: 20, ticketVar: 10.8 },
  { code: 'BTA 85', ventasVar: 19.8, transVar: 15, ticketVar: 9.2 },
  { code: 'BTA 18', ventasVar: 16.5, transVar: 12, ticketVar: 8.3 },
  { code: 'BTA 71', ventasVar: 14.2, transVar: 10.5, ticketVar: 6.9 },
];

export default function StoresBehaviorChart() {
  const topStores = useMemo(() => {
    return STORES_DATA.map(s => ({
      ...s,
      name: s.code,
    })).slice(0, 5);
  }, []);

  const storesSummary = [
    { code: 'BTA 18 (PLAZA IMP 2)', ventas: '+18.1%', trans: '+23.1%', ticket: '+18.8%' },
    { code: 'BTA 21 (CC CHIA)', venal: '+24.8%', trans: '+27.5%', ticket: '+12.0%' },
    { code: 'BTA 85 (MANSION CAJICA)', venal: '+23.4%', trans: '+10.2%', ticket: '+12.0%' },
    { code: 'BTA 52 (C.SUBA)', venal: '+18.3%', trans: '+10.5%', ticket: '+8.0%' },
    { code: 'TUNJA 1 (UNICENTRO)', venal: '+9.8%', trans: '+8.7%', ticket: '+4.8%' },
    { code: 'TUNJA 2 (VIVA T)', venal: '+2.8%', trans: '—', ticket: '—' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="rounded-2xl overflow-hidden col-span-1 lg:col-span-2" style={{ background: '#f0fdf4', border: '1px solid #d1fae5' }}>
      
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-emerald-100">
        <h3 className="font-black text-lg text-slate-900">Comportamiento Top Tiendas</h3>
        <p className="text-xs text-slate-500 mt-0.5">Variación de Ventas, Transacciones y Ticket</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="px-6 pt-5 pb-4 grid grid-cols-3 gap-4">
        {[
          { label: 'VARIACIÓN VENTAS BRUTAS', value: '+19.9 %', icon: '📈' },
          { label: 'VARIACIÓN TRANSACCIONES', value: '+10.2 %', icon: '🔢' },
          { label: 'VARIACIÓN TICKET PROMEDIO', value: '+8.8 %', icon: '💳' },
        ].map((k, i) => (
          <div key={i} className="rounded-xl p-3 border border-emerald-100 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{k.icon}</span>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex-1">{k.label}</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Content Row */}
      <div className="px-6 py-4 flex gap-6">
        {/* Bar Chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topStores} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="code" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} width={35} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
              <Bar dataKey="ventasVar" name="% Var. Ventas" fill="#ec4899" radius={[6, 6, 0, 0]} />
              <Bar dataKey="transVar" name="% Var. Transac." fill="#6b7280" radius={[6, 6, 0, 0]} />
              <Bar dataKey="ticketVar" name="% Var. Ticket" fill="#f1a4dc" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen Table */}
        <div className="w-64 space-y-2">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-wide mb-3">Resumen por Punto de Venta</p>
          <div className="text-[10px] space-y-1 max-h-80 overflow-y-auto">
            {storesSummary.map((s, i) => (
              <div key={i} className="rounded-lg p-2.5 border border-slate-200 bg-white">
                <p className="font-black text-slate-800 mb-1">{s.code}</p>
                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  <div>
                    <p className="text-slate-500">Ventas</p>
                    <p className="font-bold text-emerald-600">{s.venal || s.ventas}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Trans.</p>
                    <p className="font-bold text-slate-700">{s.trans || '+10.5%'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Ticket</p>
                    <p className="font-bold text-pink-600">{s.ticket || '+8.0%'}</p>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-[8px] text-slate-400 italic mt-2">*Otros inmovilizados o periodo comparado sin año anterior</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}