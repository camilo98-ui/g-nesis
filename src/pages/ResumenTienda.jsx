import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, MoreHorizontal, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";
const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

export default function ResumenTienda({ selectedStore = 'BTA 11' }) {
  const [selectedMenu, setSelectedMenu] = useState('Resumen');

  // KPI data
  const kpiData = [
    { label: 'VENTAS HOY', value: '$2.2M', change: '-81%', trend: 'down', color: '#FF6B9D', chart: [1.2, 1.5, 1.8, 2.0, 1.9, 2.1, 2.2] },
    { label: 'TICKET PROMEDIO', value: '$18K', change: '+12%', trend: 'up', color: '#B19CD9', chart: [15, 16, 17, 18, 17, 18, 18] },
    { label: 'EBITDA (HOY)', value: '$652K', change: '+18%', trend: 'up', color: '#7FDBCA', chart: [450, 500, 550, 600, 620, 640, 652] },
    { label: 'TXC POR HORA', value: '120', change: '-70%', trend: 'down', color: '#8ECBF5', chart: [80, 90, 100, 110, 115, 120, 120] },
  ];

  const ventasProyeccion = [
    { time: '12 AM', ventas: 500, proyeccion: 600 },
    { time: '4 AM', ventas: 300, proyeccion: 400 },
    { time: '8 AM', ventas: 1000, proyeccion: 1200 },
    { time: '12 PM', ventas: 2200, proyeccion: 2400 },
    { time: '4 PM', ventas: 1800, proyeccion: 2000 },
    { time: '8 PM', ventas: 2500, proyeccion: 2800 },
    { time: '12 AM', ventas: 1500, proyeccion: 1700 },
  ];

  const participacion = [
    { name: 'Conos', value: 38, color: '#FF6B9D' },
    { name: 'Sundaes', value: 27, color: '#B19CD9' },
    { name: 'Malteadas', value: 21, color: '#FFD89B' },
    { name: 'Postres', value: 14, color: '#D4A5FF' },
  ];

  const txcPorHora = [
    { day: 'LUN', values: [20, 25, 30, 28, 22, 25, 20] },
    { day: 'MAR', values: [22, 28, 32, 30, 24, 27, 22] },
    { day: 'MIE', values: [25, 30, 35, 32, 26, 29, 25] },
    { day: 'JUE', values: [24, 29, 34, 31, 25, 28, 24] },
    { day: 'VIE', values: [28, 35, 42, 38, 30, 33, 28] },
    { day: 'SAB', values: [30, 38, 45, 42, 32, 36, 30] },
    { day: 'DOM', values: [26, 32, 38, 36, 28, 31, 26] },
  ];

  const heatmapData = txcPorHora.flatMap((day, dayIdx) =>
    day.values.map((val, hourIdx) => ({
      day: day.day,
      dayIdx,
      hour: hourIdx,
      value: val,
      intensity: Math.round((val / 45) * 100)
    }))
  );

  const ebitdaData = [
    { time: '12 AM', ebitda: 200, margin: 29.7 },
    { time: '4 AM', ebitda: 120, margin: 25.0 },
    { time: '8 AM', ebitda: 450, margin: 30.2 },
    { time: '12 PM', ebitda: 652, margin: 29.7 },
  ];

  const resumenPyG = [
    { label: 'EBITDA', value: '$652K', color: '#7FDBCA' },
    { label: 'Utilidad Neta', value: '$312K', color: '#FFB84D' },
    { label: 'Margen Neto', value: '14.2%', subtext: '+2.1pp', color: '#FF6B9D' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Popsy" className="h-6" />
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-gray-800">¡Hola, Camila! 👋</h1>
              <p className="text-xs text-gray-400">Aquí tienes el resumen de tu tienda hoy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-sm text-gray-600">📍 CC Plaza Imperial 2</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold">1</div>
          </div>
        </div>
      </div>

      {/* Left Sidebar Navigation */}
      <div className="flex">
        <div className="w-48 border-r border-gray-100 p-4 bg-gray-50 min-h-[calc(100vh-73px)]">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">TIENDA ACTIVA</p>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-100 text-pink-600 text-sm font-semibold mb-6">
            <div className="w-2 h-2 rounded-full bg-pink-600"></div>
            CC Plaza Imperial 2
          </button>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">NAVEGACIÓN</p>
          <nav className="space-y-1">
            {['Resumen', 'Tienda', 'P&G Tienda', 'Informe', 'Txn por hora', 'Participación', 'Mapa Nevera'].map(item => (
              <button
                key={item}
                onClick={() => setSelectedMenu(item)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMenu === item
                    ? 'bg-pink-50 text-pink-600 border-l-2 border-pink-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 mb-3">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-700">Nova AI</p>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-400"></div>
                  <p className="text-[10px] text-gray-400">Copiloto activo</p>
                </div>
              </div>
            </div>
            <button className="w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {kpiData.map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{kpi.label}</p>
                  <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-2xl font-black text-gray-900 mb-1">{kpi.value}</p>
                <p className={`text-xs font-bold mb-3 ${kpi.trend === 'down' ? 'text-red-500' : 'text-green-500'}`}>
                  {kpi.change} vs ayer
                </p>
                <div className="h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpi.chart.map((v, i) => ({ value: v }))}>
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
                {kpi.label === 'VENTAS HOY' && <p className="text-[10px] text-gray-400 mt-2">Meta: $4.76M <span className="block">45%</span></p>}
                {kpi.label === 'TICKET PROMEDIO' && <p className="text-[10px] text-gray-400 mt-2">Ayer: $16K</p>}
                {kpi.label === 'EBITDA (HOY)' && <p className="text-[10px] text-gray-400 mt-2">Margen: 29.7%</p>}
                {kpi.label === 'TXC POR HORA' && <p className="text-[10px] text-gray-400 mt-2">Pico: 2PM - 3PM</p>}
              </motion.div>
            ))}
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Ventas vs Proyección */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">VENTAS VS PROYECCIÓN</h3>
                <div className="flex items-center gap-3">
                  <button className="text-pink-600 text-xs font-bold hover:underline">Ver detalle →</button>
                  <MoreHorizontal className="w-4 h-4 text-gray-300" />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-pink-500"></div>
                  <span className="text-xs font-medium text-gray-600">Ventas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-gray-300 rounded-sm"></div>
                  <span className="text-xs font-medium text-gray-600">Proyección</span>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={ventasProyeccion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#999" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#999" />
                    <Tooltip />
                    <Bar dataKey="ventas" fill="#FF6B9D" />
                    <Line type="monotone" dataKey="proyeccion" stroke="#999" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 p-3 bg-pink-50 rounded-lg">
                <p className="text-sm font-bold text-gray-900">$2.2M <span className="text-gray-500 font-normal">ventas actuales</span></p>
                <p className="text-[11px] text-gray-600">Meta: $4.76M</p>
              </div>
            </motion.div>

            {/* Participación de Tienda */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">PARTICIPACIÓN DE TIENDA 🎯</h3>
                <MoreHorizontal className="w-4 h-4 text-gray-300" />
              </div>
              <div className="flex items-center justify-between">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={participacion}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {participacion.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 ml-4 space-y-2">
                  {participacion.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }}></div>
                        <span className="text-xs font-medium text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{item.value}%</span>
                      <span className="text-xs text-gray-400">${item.value === 38 ? '$856K' : item.value === 27 ? '$594K' : item.value === 21 ? '$462K' : '$308K'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full mt-4 text-pink-600 text-xs font-bold hover:underline">Ver detalle →</button>
            </motion.div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* TXC Por Hora Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">TXC POR HORA</h3>
                <MoreHorizontal className="w-4 h-4 text-gray-300" />
              </div>
              <div className="space-y-1">
                {txcPorHora.map((day, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-500 w-8">{day.day}</span>
                    <div className="flex gap-0.5">
                      {day.values.map((val, i) => {
                        const intensity = Math.round((val / 45) * 100);
                        const bg = intensity < 25 ? '#F0F0F0' : intensity < 50 ? '#FFE0E8' : intensity < 75 ? '#FFB8D1' : '#FF6B9D';
                        return <div key={i} className="w-2 h-5 rounded-[1px]" style={{ background: bg }}></div>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Bajo</span>
                <span className="text-gray-500 text-pink-600">Alto</span>
              </div>
              <button className="w-full mt-3 text-pink-600 text-xs font-bold hover:underline">Ver detalle →</button>
            </motion.div>

            {/* EBITDA Acumulado */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">EBITDA (ACUMULADO) 📊</h3>
                <MoreHorizontal className="w-4 h-4 text-gray-300" />
              </div>
              <div className="h-36 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ebitdaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#999" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#999" />
                    <Tooltip />
                    <Line type="monotone" dataKey="ebitda" stroke="#FF6B9D" fill="#FFE0E8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">$652K <span className="text-gray-500 text-xs font-normal">+18% vs ayer</span></p>
              <p className="text-[11px] text-gray-600">Margen: 29.7%</p>
              <button className="w-full mt-3 text-pink-600 text-xs font-bold hover:underline">Ver detalle →</button>
            </motion.div>

            {/* Resumen P&G */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">RESUMEN P&G</h3>
                <MoreHorizontal className="w-4 h-4 text-gray-300" />
              </div>
              <div className="space-y-3">
                {resumenPyG.map((item, i) => (
                  <div key={i}>
                    <p className="text-[11px] text-gray-500 font-medium mb-1">{item.label}</p>
                    <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                    {item.subtext && <p className="text-[10px] text-gray-400 mt-0.5">{item.subtext}</p>}
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-pink-600 text-xs font-bold hover:underline">Ver detalle →</button>
            </motion.div>
          </div>

          {/* Nova AI Insight */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100 p-6 flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center flex-shrink-0">
              <img src={MASCOT_IMG} alt="Nova" className="w-full h-full rounded-full" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900 mb-1">INSIGHT DE NOVA AI</h3>
              <p className="text-sm text-gray-700">
                Las ventas van <span className="font-bold text-pink-600">81% por debajo de ayer</span>, pero el ticket promedio ha aumentado <span className="font-bold">12%</span>. Los conos están impulsando el crecimiento.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 transition-colors flex-shrink-0">
              Ver análisis completo <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}