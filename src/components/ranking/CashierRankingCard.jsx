import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, Receipt, Zap } from 'lucide-react';

const RANK_STYLES = {
  1: { 
    bg: "from-yellow-300 via-amber-300 to-yellow-400", 
    icon: Crown, 
    badge: "🥇",
    ring: "ring-4 ring-yellow-200/50"
  },
  2: { 
    bg: "from-gray-200 via-slate-200 to-gray-300", 
    icon: Medal, 
    badge: "🥈",
    ring: "ring-4 ring-gray-200/50"
  },
  3: { 
    bg: "from-amber-500 via-orange-400 to-amber-500", 
    icon: Award, 
    badge: "🥉",
    ring: "ring-4 ring-amber-300/50"
  },
};

export default function CashierRankingCard({ 
  cashier, 
  rank, 
  sales, 
  tickets, 
  transactions, 
  suggestedSales,
  avgTicket,
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

  const calculatedAvgTicket = avgTicket || (tickets > 0 ? sales / tickets : 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.03, x: 8, y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-xl cursor-pointer ${
        isTopThree 
          ? `bg-gradient-to-r ${rankStyle.bg} text-gray-800 shadow-xl ${rankStyle.ring}` 
          : 'bg-white border border-gray-100 shadow-md hover:shadow-xl'
      } transition-all duration-300`}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Rank badge */}
        <motion.div 
          whileHover={{ rotate: [0, -15, 15, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
            isTopThree 
              ? 'bg-white/30 backdrop-blur-sm' 
              : 'bg-gradient-to-br from-pink-50 to-rose-100'
          }`}
        >
          {isTopThree ? (
            <span className="text-2xl">{rankStyle.badge}</span>
          ) : (
            <span className={`text-xl font-bold ${rank <= 5 ? 'text-fuchsia-600' : 'text-gray-500'}`}>
              #{rank}
            </span>
          )}
        </motion.div>

        {/* Cashier info */}
        <div className="flex-grow min-w-0">
          <h4 className={`font-semibold truncate ${isTopThree ? 'text-gray-800' : 'text-gray-800'}`}>
            {cashier.name}
          </h4>
          <div className={`flex flex-wrap gap-3 mt-1 text-xs ${isTopThree ? 'text-gray-600' : 'text-gray-500'}`}>
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
          {rankType === "sales" && (
            <>
              <p className={`text-lg font-bold ${isTopThree ? 'text-gray-800' : 'text-fuchsia-700'}`}>
                {formatCurrency(sales)}
              </p>
              <p className={`text-xs ${isTopThree ? 'text-gray-600' : 'text-gray-400'}`}>
                Ticket prom: {formatCurrency(calculatedAvgTicket)}
              </p>
            </>
          )}
          {rankType === "ticket" && (
            <>
              <p className={`text-lg font-bold ${isTopThree ? 'text-gray-800' : 'text-blue-600'}`}>
                {formatCurrency(calculatedAvgTicket)}
              </p>
              <p className={`text-xs ${isTopThree ? 'text-gray-600' : 'text-gray-400'}`}>
                ticket promedio
              </p>
            </>
          )}
          {rankType === "suggested" && (
            <>
              <p className={`text-lg font-bold ${isTopThree ? 'text-gray-800' : 'text-pink-600'}`}>
                {suggestedSales}
              </p>
              <p className={`text-xs ${isTopThree ? 'text-gray-600' : 'text-gray-400'}`}>
                sugeridos
              </p>
            </>
          )}
        </div>
      </div>

      {/* Decorative elements for top 3 */}
      {isTopThree && (
        <>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/20 rounded-full translate-y-8 -translate-x-8" />
        </>
      )}
    </motion.div>
  );
}