import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Store, TrendingUp } from 'lucide-react';
import { getDisplayName } from '@/components/StoreSelector';

const COLORS = ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#a855f7', '#c084fc', '#e9d5ff', '#10b981', '#34d399', '#6ee7b7'];

export default function ZoneSalesDistributionChart({ storePerformance, formatCurrency }) {
  const distributionData = useMemo(() => {
    return storePerformance
      .map(s => ({
        name: getDisplayName(s.code),
        value: s.totalSales,
        percentage: 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [storePerformance]);

  const total = distributionData.reduce((sum, d) => sum + d.value, 0);
  const dataWithPercentage = distributionData.map(d => ({
    ...d,
    percentage: total > 0 ? (d.value / total) * 100 : 0
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
            <Store className="w-4 h-4" />
            Distribución de Ventas por Tienda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataWithPercentage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataWithPercentage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(v) => [formatCurrency(v), 'Ventas']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}