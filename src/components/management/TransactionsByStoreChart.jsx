import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap } from 'lucide-react';
import { getDisplayName } from '@/components/StoreSelector';

const COLORS_GRADIENT = ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3'];

export default function TransactionsByStoreChart({ storePerformance }) {
  const transactionData = useMemo(() => {
    return storePerformance
      .map(s => ({
        name: getDisplayName(s.code),
        transactions: s.totalTransactions,
        tickets: s.totalTickets
      }))
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 12);
  }, [storePerformance]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Transacciones por Tienda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }} height={80} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(v, name) => [v.toLocaleString(), name === 'transactions' ? 'Transacciones' : 'Tickets']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="transactions" radius={[6, 6, 0, 0]}>
                  {transactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_GRADIENT[index % COLORS_GRADIENT.length]} />
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