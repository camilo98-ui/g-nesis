import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Award, Trophy, Medal } from 'lucide-react';

const MEDALS = [
  { icon: Trophy, color: '#fbbf24', label: '🥇' },
  { icon: Medal, color: '#d1d5db', label: '🥈' },
  { icon: Medal, color: '#d97706', label: '🥉' }
];

export default function TopCashiersZone({ allShiftRecords, allCashiers, formatCurrency }) {
  const topCashiers = useMemo(() => {
    const cashierSales = {};
    
    allShiftRecords.forEach(record => {
      if (!cashierSales[record.cashier_id]) {
        cashierSales[record.cashier_id] = {
          id: record.cashier_id,
          name: record.cashier_name,
          totalSales: 0,
          totalTickets: 0,
          totalTransactions: 0
        };
      }
      cashierSales[record.cashier_id].totalSales += record.sales || 0;
      cashierSales[record.cashier_id].totalTickets += record.tickets || 0;
      cashierSales[record.cashier_id].totalTransactions += record.transactions || 0;
    });

    return Object.values(cashierSales)
      .map(c => ({
        ...c,
        avgTicket: c.totalTickets > 0 ? c.totalSales / c.totalTickets : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);
  }, [allShiftRecords]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
              <Award className="w-5 h-5 text-amber-500" />
            </motion.div>
            Top 10 Cajeros de la Zona
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCashiers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={({ x, y, payload, index }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={-8} y={0} dy={4} textAnchor="end" fill="#374151" fontSize={11} fontWeight={600}>
                        {index < 3 ? MEDALS[index].label : ''} {payload.value?.split(' ')[0]}
                      </text>
                    </g>
                  )}
                />
                <Tooltip 
                  formatter={(v) => [formatCurrency(v), 'Ventas Totales']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="totalSales" radius={[0, 8, 8, 0]}>
                  {topCashiers.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#d97706' : '#ec4899'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}