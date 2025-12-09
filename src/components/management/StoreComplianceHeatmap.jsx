import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from 'lucide-react';
import { getDisplayName } from '@/components/StoreSelector';

export default function StoreComplianceHeatmap({ storePerformance }) {
  const heatmapData = useMemo(() => {
    return storePerformance
      .sort((a, b) => b.compliance - a.compliance)
      .map(s => ({
        name: getDisplayName(s.code),
        code: s.code,
        compliance: s.compliance,
        sales: s.totalSales,
        ticket: s.avgTicket
      }));
  }, [storePerformance]);

  const getColor = (compliance) => {
    if (compliance >= 100) return 'from-emerald-500 to-green-500';
    if (compliance >= 90) return 'from-emerald-400 to-green-400';
    if (compliance >= 80) return 'from-yellow-400 to-amber-400';
    if (compliance >= 70) return 'from-orange-400 to-amber-500';
    return 'from-rose-400 to-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-pink-600 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Mapa de Cumplimiento por Tienda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {heatmapData.map((store, idx) => (
              <motion.div
                key={store.code}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                whileHover={{ scale: 1.1, y: -5, zIndex: 10 }}
                className={`bg-gradient-to-br ${getColor(store.compliance)} rounded-xl p-3 shadow-md relative group cursor-pointer`}
              >
                <p className="text-white text-[10px] font-bold mb-1 truncate">{store.name}</p>
                <p className="text-white text-2xl font-black">{store.compliance.toFixed(0)}%</p>
                
                {/* Tooltip on hover */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-3 rounded-xl shadow-xl text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                  <p className="font-bold mb-1">{store.name}</p>
                  <p>Ventas: ${(store.sales/1000000).toFixed(2)}M</p>
                  <p>Ticket: ${(store.ticket/1000).toFixed(0)}K</p>
                  <p>Cumplimiento: {store.compliance.toFixed(1)}%</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}