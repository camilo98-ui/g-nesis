import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RadialBarChart, RadialBar, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell 
} from 'recharts';

export default function StoreProductivityCard({ storePerformance = [], allCashiers = [], allShiftRecords = [], formatCurrency }) {
  const productivityData = useMemo(() => {
    return storePerformance.slice(0, 8).map((store, i) => {
      const storeCashiers = allCashiers.filter(c => c.store_id === store.code);
      const storeShifts = allShiftRecords.filter(r => r.store_id === store.code);
      const avgSalesPerShift = storeShifts.length ? store.totalSales / storeShifts.length : 0;
      const avgSalesPerCashier = storeCashiers.length ? store.totalSales / storeCashiers.length : 0;
      
      // Productivity score (0-100) based on multiple factors
      const complianceScore = Math.min(store.compliance, 100) * 0.4;
      const ticketScore = (store.avgTicket / 20000) * 30; // Normalized
      const efficiencyScore = (avgSalesPerShift / 1000000) * 30; // Normalized
      const productivityScore = Math.min(complianceScore + ticketScore + efficiencyScore, 100);

      return {
        ...store,
        cashierCount: storeCashiers.length,
        shiftCount: storeShifts.length,
        avgSalesPerShift,
        avgSalesPerCashier,
        productivityScore: Math.round(productivityScore),
        fill: productivityScore >= 80 ? '#86efac' : productivityScore >= 60 ? '#fcd34d' : '#fca5a5'
      };
    });
  }, [storePerformance, allCashiers, allShiftRecords]);

  const topStore = productivityData[0];
  const avgProductivity = productivityData.length 
    ? Math.round(productivityData.reduce((a, b) => a + b.productivityScore, 0) / productivityData.length) 
    : 0;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
            <Users className="w-4 h-4 text-indigo-500" />
          </motion.div>
          Productividad por Tienda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 text-center"
          >
            <TrendingUp className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Productividad Prom.</p>
            <p className="text-xl font-bold text-indigo-600">{avgProductivity}%</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center"
          >
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Mejor Tienda</p>
            <p className="text-lg font-bold text-green-600">{topStore?.code || '-'}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 text-center"
          >
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">$/Turno Prom.</p>
            <p className="text-lg font-bold text-amber-600">
              {formatCurrency?.(topStore?.avgSalesPerShift || 0) || '0'}
            </p>
          </motion.div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productivityData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="code" type="category" width={50} tick={{ fontSize: 10 }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                      <p className="font-bold">{data.code} - {data.name}</p>
                      <p className="text-indigo-600">Productividad: {data.productivityScore}%</p>
                      <p className="text-gray-500">Cajeros: {data.cashierCount}</p>
                      <p className="text-gray-500">$/Turno: {formatCurrency?.(data.avgSalesPerShift)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="productivityScore" radius={[0, 4, 4, 0]} barSize={16}>
                {productivityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-300" /> Alta (&gt;80%)</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-300" /> Media (60-80%)</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-300" /> Baja (&lt;60%)</span>
        </div>
      </CardContent>
    </Card>
  );
}