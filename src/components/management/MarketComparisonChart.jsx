import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend
} from 'recharts';

// Datos de mercado de heladerías en Colombia (estimados basados en estudios de mercado)
const MARKET_DATA = {
  bogota: {
    name: 'Bogotá',
    marketSize: 450, // billones COP
    growth: 8.5,
    avgTicket: 18500,
    transactions: 2400000,
    color: '#ec4899'
  },
  medellin: {
    name: 'Medellín',
    marketSize: 180,
    growth: 12.2,
    avgTicket: 17200,
    transactions: 1100000,
    color: '#8b5cf6'
  },
  cali: {
    name: 'Cali',
    marketSize: 120,
    growth: 9.8,
    avgTicket: 15800,
    transactions: 780000,
    color: '#3b82f6'
  },
  barranquilla: {
    name: 'Barranquilla',
    marketSize: 85,
    growth: 11.5,
    avgTicket: 16500,
    transactions: 520000,
    color: '#f59e0b'
  },
  bucaramanga: {
    name: 'Bucaramanga',
    marketSize: 45,
    growth: 7.2,
    avgTicket: 14200,
    transactions: 320000,
    color: '#10b981'
  },
  cartagena: {
    name: 'Cartagena',
    marketSize: 65,
    growth: 15.3,
    avgTicket: 19800,
    transactions: 380000,
    color: '#ef4444'
  }
};

// Tendencia mensual del mercado Bogotá
const BOGOTA_TREND = [
  { month: 'Ene', bogota: 100, otras: 85 },
  { month: 'Feb', bogota: 95, otras: 82 },
  { month: 'Mar', bogota: 110, otras: 90 },
  { month: 'Abr', bogota: 105, otras: 88 },
  { month: 'May', bogota: 115, otras: 92 },
  { month: 'Jun', bogota: 125, otras: 98 },
  { month: 'Jul', bogota: 135, otras: 105 },
  { month: 'Ago', bogota: 130, otras: 100 },
  { month: 'Sep', bogota: 120, otras: 95 },
  { month: 'Oct', bogota: 118, otras: 93 },
  { month: 'Nov', bogota: 125, otras: 97 },
  { month: 'Dic', bogota: 145, otras: 110 },
];

export default function MarketComparisonChart() {
  const [viewType, setViewType] = useState('size');

  const chartData = useMemo(() => {
    return Object.values(MARKET_DATA).map(city => ({
      name: city.name,
      marketSize: city.marketSize,
      growth: city.growth,
      avgTicket: city.avgTicket / 1000, // en miles
      color: city.color
    }));
  }, []);

  const getDataKey = () => {
    switch (viewType) {
      case 'growth': return 'growth';
      case 'ticket': return 'avgTicket';
      default: return 'marketSize';
    }
  };

  const getLabel = () => {
    switch (viewType) {
      case 'growth': return 'Crecimiento %';
      case 'ticket': return 'Ticket (miles)';
      default: return 'Mercado (B COP)';
    }
  };

  const formatValue = (v) => {
    switch (viewType) {
      case 'growth': return `${v.toFixed(1)}%`;
      case 'ticket': return `$${v.toFixed(0)}K`;
      default: return `$${v}B`;
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <MapPin className="w-4 h-4 text-rose-500" />
            </motion.div>
            Mercado Heladerías Colombia
          </CardTitle>
          <Tabs value={viewType} onValueChange={setViewType} className="h-7">
            <TabsList className="h-7 p-0.5 bg-gray-100">
              <TabsTrigger value="size" className="text-[10px] h-6 px-2">Tamaño</TabsTrigger>
              <TabsTrigger value="growth" className="text-[10px] h-6 px-2">Crecimiento</TabsTrigger>
              <TabsTrigger value="ticket" className="text-[10px] h-6 px-2">Ticket</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {/* Comparativo por ciudad */}
        <div className="h-44 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatValue} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-lg border text-xs">
                      <p className="font-bold text-gray-800 mb-2">{data.name}</p>
                      <p className="flex justify-between gap-4">
                        <span className="text-gray-500">Tamaño mercado:</span>
                        <span className="font-bold">${data.marketSize}B COP</span>
                      </p>
                      <p className="flex justify-between gap-4">
                        <span className="text-gray-500">Crecimiento:</span>
                        <span className="font-bold text-green-600">+{data.growth}%</span>
                      </p>
                      <p className="flex justify-between gap-4">
                        <span className="text-gray-500">Ticket promedio:</span>
                        <span className="font-bold">${data.avgTicket}K</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey={getDataKey()} radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendencia Bogotá vs Otras ciudades */}
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] font-medium text-gray-600 mb-2 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Índice de ventas mensual (Base 100 = Enero)
          </p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={BOGOTA_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis domain={[70, 160]} tick={{ fontSize: 9 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                        <p className="font-bold mb-1">{label}</p>
                        <p className="text-rose-600">Bogotá: {payload[0]?.value}</p>
                        <p className="text-blue-600">Otras: {payload[1]?.value}</p>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="bogota" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} name="Bogotá" />
                <Line type="monotone" dataKey="otras" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Otras ciudades" />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="text-[9px] text-gray-400 mt-2 text-center">
          📊 Datos estimados basados en estudios de mercado 2024
        </p>
      </CardContent>
    </Card>
  );
}