import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, Receipt, Zap, Star, Flame, Sparkles } from 'lucide-react';

const RANK_STYLES = {
  1: { 
    bg: "from-yellow-300 via-amber-300 to-yellow-400", 
    icon: Crown, 
    badge: "👑",
    ring: "ring-4 ring-yellow-200/50",
    sparkle: true
  },
  2: { 
    bg: "from-slate-300 via-gray-200 to-slate-300", 
    icon: Medal, 
    badge: "🥈",
    ring: "ring-4 ring-gray-200/50",
    sparkle: false
  },
  3: { 
    bg: "from-amber-400 via-orange-300 to-amber-400", 
    icon: Award, 
    badge: "🥉",
    ring: "ring-4 ring-amber-300/50",
    sparkle: false
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
        {/* Photo + Rank badge */}
        <div className="relative flex-shrink-0">
          <motion.div 
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center ${
              isTopThree 
                ? 'bg-white/30 backdrop-blur-sm ring-2 ring-white/50' 
                : 'bg-gradient-to-br from-pink-50 to-rose-100'
            }`}
          >
            {cashier.photo_url ? (
              <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" />
            ) : (
              <span className={`text-xl font-bold ${isTopThree ? 'text-white' : rank <= 5 ? 'text-fuchsia-600' : 'text-gray-500'}`}>
                {cashier.name?.charAt(0) || '?'}
              </span>
            )}
          </motion.div>
          {/* Rank badge overlay */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
            isTopThree 
              ? 'bg-white text-gray-800' 
              : 'bg-pink-500 text-white'
          }`}>
            {isTopThree ? rankStyle.badge : `#${rank}`}
          </div>
        </div>

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
          {rank === 1 && (
            <>
              <motion.div
                className="absolute top-2 right-2"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-yellow-600" />
              </motion.div>
              <motion.div
                className="absolute top-2 left-10"
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              >
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              </motion.div>
            </>
          )}
          {rank === 2 && (
            <motion.div
              className="absolute top-2 right-2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="w-4 h-4 text-gray-500 fill-gray-400" />
            </motion.div>
          )}
          {rank === 3 && (
            <motion.div
              className="absolute top-2 right-2"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Flame className="w-4 h-4 text-orange-600" />
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}