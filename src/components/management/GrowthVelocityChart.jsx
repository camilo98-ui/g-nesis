import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

export default function GrowthVelocityChart({ dailyTrend = [], budget = 0, formatCurrency }) {
  const velocityData = useMemo(() => {
    if (!dailyTrend.length) return [];
    
    const daysInMonth = 30;
    const dailyBudget = budget / daysInMonth;
    let cumulative = 0;
    let expectedCumulative = 0;
    
    return dailyTrend.map((day, i) => {
      cumulative += day.sales || 0;
      expectedCumulative += dailyBudget;
      
      const velocity = expectedCumulative > 0 ? (cumulative / expectedCumulative) * 100 : 0;
      const gap = cumulative - expectedCumulative;
      
      return {
        ...day,
        velocity,
        gap,
        cumulative,
        expected: expectedCumulative,
        isAhead: gap >= 0
      };
    });
  }, [dailyTrend, budget]);

  const currentVelocity = velocityData.length ? velocityData[velocityData.length - 1]?.velocity || 0 : 0;
  const currentGap = velocityData.length ? velocityData[velocityData.length - 1]?.gap || 0 : 0;

  const getVelocityStatus = (velocity) => {
    if (velocity >= 110) return { color: 'text-green-600', bg: 'bg-green-100', label: '🚀 Excelente' };
    if (velocity >= 100) return { color: 'text-green-500', bg: 'bg-green-50', label: '✅ En meta' };
    if (velocity >= 90) return { color: 'text-amber-500', bg: 'bg-amber-50', label: '⚠️ Cerca' };
    return { color: 'text-red-500', bg: 'bg-red-50', label: '🔴 Atrasado' };
  };

  const status = getVelocityStatus(currentVelocity);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Activity className="w-4 h-4 text-purple-500" />
          </motion.div>
          Velocidad de Crecimiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`${status.bg} rounded-xl p-3 text-center`}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {currentVelocity >= 100 ? 
                <TrendingUp className={`w-4 h-4 ${status.color}`} /> : 
                <TrendingDown className={`w-4 h-4 ${status.color}`} />
              }
              <span className="text-xs text-gray-500">Velocidad</span>
            </div>
            <p className={`text-xl font-bold ${status.color}`}>{currentVelocity.toFixed(0)}%</p>
            <p className="text-xs text-gray-400">{status.label}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 text-center"
          >
            <Zap className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Brecha</p>
            <p className={`text-lg font-bold ${currentGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currentGap >= 0 ? '+' : ''}{(currentGap / 1000000).toFixed(1)}M
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center"
          >
            <Activity className="w-4 h-4 text-purple-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Acumulado</p>
            <p className="text-lg font-bold text-purple-600">
              {((velocityData[velocityData.length - 1]?.cumulative || 0) / 1000000).toFixed(1)}M
            </p>
          </motion.div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={velocityData}>
              <defs>
                <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[50, 150]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                      <p className="font-medium">{data.fullDate || data.date}</p>
                      <p className="text-purple-600 font-bold">Velocidad: {data.velocity?.toFixed(1)}%</p>
                      <p className="text-gray-500">Acumulado: {formatCurrency?.(data.cumulative)}</p>
                      <p className="text-gray-400">Esperado: {formatCurrency?.(data.expected)}</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={100} stroke="#10b981" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="velocity" stroke="#8b5cf6" fill="url(#velocityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-gray-400 mt-2 bg-purple-50 p-2 rounded-lg">
          💡 La línea verde (100%) representa el ritmo ideal para cumplir el presupuesto
        </p>
      </CardContent>
    </Card>
  );
}