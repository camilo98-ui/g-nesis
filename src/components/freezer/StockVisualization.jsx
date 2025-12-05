import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Snowflake, TrendingUp, Package, CheckCircle } from 'lucide-react';

export default function StockVisualization({ slots = [] }) {
  // Distribución de stock levels
  const stockDistribution = useMemo(() => {
    if (!slots || slots.length === 0) return [];
    const distribution = { full: 0, medium: 0, low: 0, empty: 0 };
    slots.forEach(s => {
      if (s.stock_level) distribution[s.stock_level]++;
    });
    
    return [
      { name: 'Lleno', value: distribution.full, fill: '#10b981' },
      { name: 'Medio', value: distribution.medium, fill: '#f59e0b' },
      { name: 'Bajo', value: distribution.low, fill: '#ef4444' },
      { name: 'Vacío', value: distribution.empty, fill: '#9ca3af' }
    ].filter(d => d.value > 0);
  }, [slots]);

  // Sabores por tipo
  const typeDistribution = useMemo(() => {
    if (!slots || slots.length === 0) return [];
    const types = {};
    slots.forEach(s => {
      if (s.is_empty || !s.flavor_type) return;
      types[s.flavor_type] = (types[s.flavor_type] || 0) + 1;
    });
    
    return Object.entries(types).map(([type, count]) => ({
      name: type === 'gourmet' ? '🍦 Gourmet' : type === 'exclusivo' ? '✨ Exclusivo' : type,
      value: count,
      fill: type === 'gourmet' ? '#3b82f6' : '#a855f7'
    }));
  }, [slots]);

  // Top 5 sabores más frecuentes
  const topFlavors = useMemo(() => {
    if (!slots || slots.length === 0) return [];
    const counts = {};
    slots.forEach(s => {
      if (s.is_empty || !s.flavor_name) return;
      counts[s.flavor_name] = (counts[s.flavor_name] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [slots]);

  if (!slots || slots.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400 text-xs">
        Sin datos de nevera
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Distribución de Stock */}
      <Card className="border-cyan-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-700 flex items-center gap-2">
            <Snowflake className="w-4 h-4" />
            Distribución de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribución por Tipo */}
      <Card className="border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Gourmet vs Exclusivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Sabores */}
      <Card className="border-pink-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-pink-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Top 5 Sabores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topFlavors.map((flavor, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-2 bg-pink-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-700">{flavor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(flavor.count / Math.max(...topFlavors.map(f => f.count))) * 100} className="w-16 h-1.5" />
                  <span className="text-xs font-bold text-pink-600">{flavor.count}x</span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}