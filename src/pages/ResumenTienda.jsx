import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, MoreHorizontal, ArrowRight, Grid2X2, Users, TrendingUp, FileText, Clock, BarChart3, Snowflake, LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";
const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

export default function ResumenTienda() {
  const [selectedMenu, setSelectedMenu] = useState('Resumen');

  const NAV_ITEMS = [
    { icon: Grid2X2, label: 'Resumen' },
    { icon: TrendingUp, label: 'Tienda' },
    { icon: TrendingUp, label: 'P&G Tienda' },
    { icon: FileText, label: 'Informe' },
    { icon: Clock, label: 'Txn por hora' },
    { icon: BarChart3, label: 'Participación' },
    { icon: Snowflake, label: 'Mapa Nevera' },
  ];

  const kpiData = [
    { label: 'VENTAS HOY', value: '$2.2M', change: '-81%', trend: 'down', color: '#FF6B9D', chart: [1.2, 1.5, 1.8, 2.0, 1.9, 2.1, 2.2], meta: '$4.76M', percent: '45%' },
    { label: 'TICKET PROMEDIO', value: '$18K', change: '+12%', trend: 'up', color: '#B19CD9', chart: [15, 16, 17, 18, 17, 18, 18], meta: 'Ayer: $16K' },
    { label: 'EBITDA (HOY)', value: '$652K', change: '+18%', trend: 'up', color: '#7FDBCA', chart: [450, 500, 550, 600, 620, 640, 652], meta: 'Margen: 29.7%' },
    { label: 'TXC POR HORA', value: '120', change: '-70%', trend: 'down', color: '#8ECBF5', chart: [80, 90, 100, 110, 115, 120, 120], meta: 'Pico: 2PM - 3PM' },
  ];

  const ventasData = [
    { time: '12 AM', ventas: 500, proyeccion: 600 },
    { time: '4 AM', ventas: 300, proyeccion: 400 },
    { time: '8 AM', ventas: 1000, proyeccion: 1200 },
    { time: '12 PM', ventas: 2200, proyeccion: 2400 },
    { time: '4 PM', ventas: 1800, proyeccion: 2000 },
    { time: '8 PM', ventas: 2500, proyeccion: 2800 },
    { time: '12 AM', ventas: 1500, proyeccion: 1700 },
  ];

  const participacionData = [
    { name: 'Conos', value: 38, color: '#FF6B9D' },
    { name: 'Sundaes', value: 27, color: '#B19CD9' },
    { name: 'Malteadas', value: 21, color: '#FFD89B' },
    { name: 'Postres', value: 14, color: '#D4A5FF' },
  ];

  const ebitdaData = [
    { time: '12 AM', ebitda: 200 },
    { time: '4 AM', ebitda: 120 },
    { time: '8 AM', ebitda: 450 },
    { time: '12 PM', ebitda: 652 },
  ];

  const txcHeatmap = [
    { day: '12 PM', values: [20, 25, 30, 28, 22, 25, 20] },
    { day: '6 PM', values: [22, 28, 32, 30, 24, 27, 22] },
    { day: '12 AM', values: [25, 30, 35, 32, 26, 29, 25] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-4 sticky top-0 h-screen overflow-y-auto"
        >
          <img src={LOGO_URL} alt="Popsy" className="h-6 mb-8" />

          <div className="mb-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">TIENDA ACTIVA</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-pink-50 border border-pink-200">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-semibold text-gray-700">CC Plaza Imperial 2</span>
              <ChevronDown className="w-3 h-3 text-gray-400 ml-auto" />
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">NAVEGACIÓN</p>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = selectedMenu === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => setSelectedMenu(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-pink-100 text-pink-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 px-2 py-2.5 rounded-lg bg-pink-50 border border-pink-100 mb-4">
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-700">Nova AI</p>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                  <p className="text-[9px] text-gray-400">Copiloto activo</p>
                </div>
              </div>
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Top Header */}
          <div className="sticky top-0 z-40 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-100 px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">¡Hola, Camila! 👋</h1>
                <p className="text-xs text-gray-500 mt-1">Aquí tienes el resumen de tu tienda hoy</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">📍 CC Plaza Imperial 2</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs font-bold">1</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-4 gap-4 mb-7">
              {kpiData.map((kpi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{kpi.label}</p>
                    <MoreHorizontal className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                  <p className="text-[28px] font-black text-gray-900 mb-0.5">{kpi.value}</p>
                  <p className={`text-[11px] font-bold mb-3 ${kpi.trend === 'down' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {kpi.change} vs ayer
                  </p>
                  <div className="h-10 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={kpi.chart.map((v) => ({ value: v }))}>
                        <defs>
                          <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={kpi.color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={kpi.color} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={kpi.color}
                          dot={false}
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 text-[10px] text-gray-600">
                    {kpi.percent && (
                      <>
                        <p><span className="font-medium">Meta:</span> {kpi.meta}</p>
                        <p className="font-bold text-gray-700">{kpi.percent}</p>
                      </>
                    )}
                    {kpi.meta && !kpi.percent && <p><span className="font-medium">{kpi.label.includes('TICKET') ? 'Ayer:' : 'Margen:'}</span> {kpi.meta}</p>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-2 gap-6 mb-7">
              {/* Ventas vs Proyección */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-800">VENTAS VS PROYECCIÓN</h3>
                  <div className="flex items-center gap-3">
                    <button className="text-pink-600 text-xs font-bold flex items-center gap-1 hover:underline">Ver detalle <ArrowRight className="w-3 h-3" /></button>
                    <MoreHorizontal className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-pink-500"></div>
                    <span className="font-medium text-gray-700">Ventas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-px border-t-2 border-dashed border-gray-400"></div>
                    <span className="font-medium text-gray-700">Proyección</span>
                  </div>
                </div>
                <div className="h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={ventasData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <Tooltip />
                      <Bar dataKey="ventas" fill="#FF6B9D" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="proyeccion" stroke="#999" strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                  <p className="text-sm font-bold text-gray-900">$2.2M <span className="text-gray-600 font-normal text-[11px]">ventas actuales</span></p>
                </div>
              </motion.div>

              {/* Participación de Tienda */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.44 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-800">PARTICIPACIÓN DE TIENDA 🎯</h3>
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={participacionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          dataKey="value"
                        >
                          {participacionData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 ml-6 space-y-2.5">
                    {participacionData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }}></div>
                          <span className="text-xs font-medium text-gray-600">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-900">{item.value}%</span>
                          <span className="text-xs text-gray-400 ml-2">${Math.round(item.value * 22.5)}K</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full mt-4 text-pink-600 text-xs font-bold flex items-center justify-center gap-1 hover:underline">Ver detalle <ArrowRight className="w-3 h-3" /></button>
              </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-3 gap-6 mb-7">
              {/* TXC Por Hora */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-800">TXC POR HORA</h3>
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <div className="space-y-2">
                  {txcHeatmap.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-500 w-10">{row.day}</span>
                      <div className="flex gap-0.5">
                        {row.values.map((val, i) => {
                          const intensity = Math.round((val / 35) * 100);
                          const colors = ['#F5E6E8', '#FFB8D1', '#FF8AB8', '#FF6B9D', '#E74C8C'];
                          const bg = intensity < 25 ? colors[0] : intensity < 50 ? colors[1] : intensity < 75 ? colors[2] : colors[3];
                          return <div key={i} className="w-2 h-6 rounded-[1px]" style={{ background: bg }}></div>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-[1px] bg-pink-100"></div>
                    <span className="text-gray-500">Bajo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-[1px] bg-pink-600"></div>
                    <span className="text-gray-500">Alto</span>
                  </div>
                </div>
                <button className="w-full mt-3 text-pink-600 text-xs font-bold flex items-center justify-center gap-1 hover:underline">Ver detalle <ArrowRight className="w-3 h-3" /></button>
              </motion.div>

              {/* EBITDA Acumulado */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-800">EBITDA (ACUMULADO) 📊</h3>
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <div className="h-32 mb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ebitdaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" />
                      <Tooltip />
                      <defs>
                        <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF6B9D" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#FF6B9D" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <Line type="monotone" dataKey="ebitda" stroke="#FF6B9D" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">$652K <span className="text-gray-600 text-[11px] font-normal">+18% vs ayer</span></p>
                <p className="text-[10px] text-gray-600">Margen: 29.7%</p>
                <button className="w-full mt-3 text-pink-600 text-xs font-bold flex items-center justify-center gap-1 hover:underline">Ver detalle <ArrowRight className="w-3 h-3" /></button>
              </motion.div>

              {/* Resumen P&G */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.68 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-800">RESUMEN P&G</h3>
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium mb-1">EBITDA</p>
                    <p className="text-lg font-black text-pink-600">$652K</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium mb-1">Utilidad Neta</p>
                    <p className="text-lg font-black text-orange-400">$312K</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">+15%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium mb-1">Margen Neto</p>
                    <p className="text-lg font-black text-pink-600">14.2%</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">+2.1pp</p>
                  </div>
                </div>
                <button className="w-full mt-4 text-pink-600 text-xs font-bold flex items-center justify-center gap-1 hover:underline">Ver detalle <ArrowRight className="w-3 h-3" /></button>
              </motion.div>
            </div>

            {/* Nova AI Insight */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.76 }}
              className="bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 rounded-xl border border-pink-200 p-6 flex items-start gap-4 relative overflow-hidden"
            >
              <div className="absolute top-4 right-6 text-pink-200 text-4xl opacity-50">✨</div>
              <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-pink-600 mb-2">INSIGHT DE NOVA AI</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Las ventas van <span className="font-bold text-pink-600">81% por debajo de ayer</span>, pero el ticket promedio ha aumentado <span className="font-bold text-pink-600">12%</span>. Los conos están impulsando el crecimiento.
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 transition-colors flex-shrink-0 whitespace-nowrap">
                Ver análisis completo <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}