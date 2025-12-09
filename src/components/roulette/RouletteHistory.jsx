import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Gift, Calendar, Trophy, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RouletteHistory({ storeId }) {
  const { data: winners = [] } = useQuery({
    queryKey: ['rouletteWinners', storeId],
    queryFn: () => base44.entities.RouletteWinner.filter({ store_id: storeId }, '-spin_date', 20),
    enabled: !!storeId
  });

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(val);

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
        <CardTitle className="flex items-center gap-2 text-pink-700">
          <History className="w-5 h-5" />
          Historial de Ruleta
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {winners.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay giros registrados</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {winners.map((winner, idx) => (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎁'}</div>
                    <div>
                      <p className="font-bold text-gray-800">{winner.cashier_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(winner.spin_date), "dd MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  {winner.claimed ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-bold text-gray-700">{winner.prize}</span>
                  </div>
                  {winner.prize_value > 0 && (
                    <span className="text-sm font-black text-pink-600">
                      {formatCurrency(winner.prize_value)}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}