import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, TrendingUp, DollarSign, Receipt, Zap } from 'lucide-react';

const RANK_STYLES = {
  1: { 
    bg: "from-yellow-400 via-amber-400 to-yellow-500", 
    icon: Crown, 
    badge: "🥇",
    ring: "ring-4 ring-yellow-300/50"
  },
  2: { 
    bg: "from-gray-300 via-slate-300 to-gray-400", 
    icon: Medal, 
    badge: "🥈",
    ring: "ring-4 ring-gray-300/50"
  },
  3: { 
    bg: "from-amber-600 via-orange-600 to-amber-700", 
    icon: Award, 
    badge: "🥉",
    ring: "ring-4 ring-amber-400/50"
  },
};

export default function CashierRankingCard({ 
  cashier, 
  rank, 
  sales, 
  tickets, 
  transactions, 
  suggestedSales,
  rankType = "sales",
  delay = 0 
}) {
  const isTopThree = rank <= 3;
  const rankStyle = RANK_STYLES[rank];
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  const avgTicket = tickets > 0 ? sales / tickets : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl ${
        isTopThree 
          ? `bg-gradient-to-r ${rankStyle.bg} text-white shadow-xl ${rankStyle.ring}` 
          : 'bg-white border border-gray-100 shadow-md hover:shadow-lg'
      } transition-all duration-300`}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Rank badge */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
          isTopThree 
            ? 'bg-white/20 backdrop-blur-sm' 
            : 'bg-gradient-to-br from-orange-100 to-red-100'
        }`}>
          {isTopThree ? (
            <span className="text-2xl">{rankStyle.badge}</span>
          ) : (
            <span className={`text-xl font-bold ${rank <= 5 ? 'text-orange-600' : 'text-gray-500'}`}>
              #{rank}
            </span>
          )}
        </div>

        {/* Cashier info */}
        <div className="flex-grow min-w-0">
          <h4 className={`font-semibold truncate ${isTopThree ? 'text-white' : 'text-gray-800'}`}>
            {cashier.name}
          </h4>
          <div className={`flex flex-wrap gap-3 mt-1 text-xs ${isTopThree ? 'text-white/80' : 'text-gray-500'}`}>
            <span className="flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {tickets} tickets
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {transactions} trans.
            </span>
          </div>
        </div>

        {/* Main metric */}
        <div className="flex-shrink-0 text-right">
          {rankType === "sales" ? (
            <>
              <p className={`text-lg font-bold ${isTopThree ? 'text-white' : 'text-gray-800'}`}>
                {formatCurrency(sales)}
              </p>
              <p className={`text-xs ${isTopThree ? 'text-white/70' : 'text-gray-400'}`}>
                Ticket prom: {formatCurrency(avgTicket)}
              </p>
            </>
          ) : (
            <>
              <p className={`text-lg font-bold ${isTopThree ? 'text-white' : 'text-gray-800'}`}>
                {suggestedSales}
              </p>
              <p className={`text-xs ${isTopThree ? 'text-white/70' : 'text-gray-400'}`}>
                sugeridos
              </p>
            </>
          )}
        </div>
      </div>

      {/* Decorative elements for top 3 */}
      {isTopThree && (
        <>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
        </>
      )}
    </motion.div>
  );
}