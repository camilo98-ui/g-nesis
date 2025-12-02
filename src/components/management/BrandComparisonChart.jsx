import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Users, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';

// Datos de competencia en heladerías (estimados - estudios de mercado)
const BRAND_DATA = [
  { 
    name: 'Popsy', 
    marketShare: 32, 
    stores: 180, 
    avgTicket: 18500,
    satisfaction: 88,
    growth: 12,
    color: '#ec4899',
    logo: '🍦'
  },
  { 
    name: 'Crepes & Waffles', 
    marketShare: 28, 
    stores: 120, 
    avgTicket: 25000,
    satisfaction: 92,
    growth: 8,
    color: '#8b5cf6',
    logo: '🧇'
  },
  { 
    name: 'Mimos', 
    marketShare: 15, 
    stores: 95, 
    avgTicket: 12500,
    satisfaction: 78,
    growth: 5,
    color: '#3b82f6',
    logo: '🍨'
  },
  { 
    name: 'San Jerónimo', 
    marketShare: 12, 
    stores: 65, 
    avgTicket: 16000,
    satisfaction: 82,
    growth: 10,
    color: '#10b981',
    logo: '🥄'
  },
  { 
    name: 'La Campiña', 
    marketShare: 8, 
    stores: 45, 
    avgTicket: 14000,
    satisfaction: 75,
    growth: 3,
    color: '#f59e0b',
    logo: '🌿'
  },
  { 
    name: 'Otros', 
    marketShare: 5, 
    stores: 200, 
    avgTicket: 10000,
    satisfaction: 70,
    growth: 2,
    color: '#9ca3af',
    logo: '🍧'
  }
];

// Datos para radar chart
const RADAR_DATA = [
  { attribute: 'Calidad', Popsy: 90, 'Crepes & W': 95, Mimos: 75, 'San Jerónimo': 82 },
  { attribute: 'Precio', Popsy: 80, 'Crepes & W': 60, Mimos: 90, 'San Jerónimo': 75 },
  { attribute: 'Variedad', Popsy: 88, 'Crepes & W': 85, Mimos: 70, 'San Jerónimo': 78 },
  { attribute: 'Ubicaciones', Popsy: 92, 'Crepes & W': 80, Mimos: 75, 'San Jerónimo': 65 },
  { attribute: 'Servicio', Popsy: 85, 'Crepes & W': 90, Mimos: 72, 'San Jerónimo': 80 },
  { attribute: 'Innovación', Popsy: 88, 'Crepes & W': 82, Mimos: 65, 'San Jerónimo': 70 },
];

export default function BrandComparisonChart() {
  const [viewType, setViewType] = useState('share');

  const getDataKey = () => {
    switch (viewType) {
      case 'stores': return 'stores';
      case 'ticket': return 'avgTicket';
      case 'growth': return 'growth';
      default: return 'marketShare';
    }
  };

  const formatValue = (v) => {
    switch (viewType) {
      case 'stores': return `${v} tiendas`;
      case 'ticket': return `$${(v/1000).toFixed(0)}K`;
      case 'growth': return `+${v}%`;
      default: return `${v}%`;
    }
  };

  const popsyData = BRAND_DATA.find(b => b.name === 'Popsy');
  const topCompetitor = BRAND_DATA.filter(b => b.name !== 'Popsy').sort((a, b) => b.marketShare - a.marketShare)[0];

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Award className="w-4 h-4 text-amber-500" />
            </motion.div>
            Popsy vs Competencia
          </CardTitle>
          <Tabs value={viewType} onValueChange={setViewType} className="h-7">
            <TabsList className="h-7 p-0.5 bg-gray-100">
              <TabsTrigger value="share" className="text-[10px] h-6 px-2">Market Share</TabsTrigger>
              <TabsTrigger value="stores" className="text-[10px] h-6 px-2">Tiendas</TabsTrigger>
              <TabsTrigger value="growth" className="text-[10px] h-6 px-2">Crecimiento</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {/* Highlight Popsy */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-2 text-center border border-pink-200"
          >
            <p className="text-[10px] text-gray-500">Market Share</p>
            <p className="text-lg font-bold text-pink-600">{popsyData?.marketShare}%</p>
            <p className="text-[9px] text-pink-400">#1 en Colombia</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-2 text-center border border-green-200"
          >
            <p className="text-[10px] text-gray-500">Crecimiento</p>
            <p className="text-lg font-bold text-green-600">+{popsyData?.growth}%</p>
            <p className="text-[9px] text-green-400">vs año anterior</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-2 text-center border border-blue-200"
          >
            <p className="text-[10px] text-gray-500">Satisfacción</p>
            <p className="text-lg font-bold text-blue-600">{popsyData?.satisfaction}%</p>
            <p className="text-[9px] text-blue-400">NPS clientes</p>
          </motion.div>
        </div>

        {/* Bar Chart Comparison */}
        <div className="h-40 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={BRAND_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatValue} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={85} 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => {
                  const brand = BRAND_DATA.find(b => b.name === v);
                  return `${brand?.logo || ''} ${v}`;
                }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-lg border text-xs">
                      <p className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span className="text-lg">{data.logo}</span>
                        {data.name}
                      </p>
                      <p className="flex justify-between gap-4">
                        <span className="text-gray-500">Market Share:</span>
                        <span className="font-bold">{data.marketShare}%</span>
                      </p>
                      <p className="flex justify-between gap-4">
                        <span className="text-gray-500">Tiendas:</span>
                        <span className="font-bold">{data.stores}</span>
                      </p>
                      <p className="flex justify-between gap-4">
                        <span className="text-gray-500">Ticket promedio:</span>
                        <span className="font-bold">${(data.avgTicket/1000).toFixed(0)}K</span>
                      </p>
                      <p className="flex justify-between gap-4">
                        <span className="text-gray-500">Crecimiento:</span>
                        <span className="font-bold text-green-600">+{data.growth}%</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey={getDataKey()} radius={[0, 4, 4, 0]} barSize={14}>
                {BRAND_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar comparison */}
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] font-medium text-gray-600 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Análisis comparativo de atributos
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 8 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar name="Popsy" dataKey="Popsy" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} strokeWidth={2} />
                <Radar name="Crepes & W" dataKey="Crepes & W" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={1} />
                <Legend wrapperStyle={{ fontSize: '9px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-3 border border-pink-100"
        >
          <p className="text-xs text-pink-800">
            <span className="font-bold">💡 Insight:</span> Popsy lidera con <span className="font-bold">{popsyData?.marketShare}%</span> del mercado, 
            superando a {topCompetitor?.name} por <span className="font-bold text-green-600">{popsyData?.marketShare - topCompetitor?.marketShare}pp</span>.
            Ventaja competitiva en <span className="font-bold">ubicaciones</span> y <span className="font-bold">variedad de productos</span>.
          </p>
        </motion.div>

        <p className="text-[9px] text-gray-400 mt-2 text-center">
          📊 Datos estimados basados en estudios de mercado retail Colombia 2024
        </p>
      </CardContent>
    </Card>
  );
}