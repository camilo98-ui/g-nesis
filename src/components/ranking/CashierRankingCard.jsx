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

  // Generar frase divertida basada en el rank
  const funPhrases = {
    1: ['🔥 ¡IMPARABLE!', '⚡ NÚMERO 1', '👑 EL/LA JEFE/A', '🚀 FUERA DE SERIE', '💎 DIAMANTE'],
    2: ['🥈 CASI AHÍ', '💪 GRAN ESFUERZO', '⭐ BRILLANTE', '🎯 EN LA MIRA', '🏃 PERSIGUIENDO'],
    3: ['🥉 TOP 3!', '🔶 PODIO', '✨ DESTACADO/A', '🎪 ESTRELLA', '🌟 CRACK']
  };

  const randomPhrase = (rank) => {
    if (!funPhrases[rank]) return '';
    const phrases = funPhrases[rank];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, rotateY: -15 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      whileHover={{ scale: 1.05, x: 12, y: -5, rotateY: 5 }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-2xl cursor-pointer ${
        isTopThree 
          ? `bg-gradient-to-r ${rankStyle.bg} text-gray-800 shadow-2xl ${rankStyle.ring}` 
          : 'bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-pink-300'
      } transition-all duration-300`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="p-5 flex items-center gap-4">
        {/* Photo + Rank badge - MÁS GRANDE Y DIVERTIDO */}
        <div className="relative flex-shrink-0">
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
            transition={{ duration: 0.5 }}
            className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center ${
              isTopThree 
                ? 'bg-white/40 backdrop-blur-sm ring-4 ring-white/60 shadow-xl' 
                : 'bg-gradient-to-br from-pink-100 to-rose-200 shadow-lg'
            }`}
          >
            {cashier.photo_url ? (
              <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" />
            ) : (
              <span className={`text-2xl font-black ${isTopThree ? 'text-white drop-shadow-lg' : rank <= 5 ? 'text-fuchsia-600' : 'text-gray-600'}`}>
                {cashier.name?.charAt(0) || '?'}
              </span>
            )}
          </motion.div>
          {/* Rank badge overlay - MÁS GRANDE */}
          <motion.div 
            animate={isTopThree ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-base font-black shadow-lg ${
              isTopThree 
                ? 'bg-white text-gray-800 ring-2 ring-white/50' 
                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
            }`}
          >
            {isTopThree ? rankStyle.badge : `#${rank}`}
          </motion.div>
          
          {/* Frase divertida para top 3 */}
          {isTopThree && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <span className="text-[10px] font-black bg-white/90 px-2 py-1 rounded-full shadow-md">
                {randomPhrase(rank)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Cashier info - MÁS VISUAL */}
        <div className="flex-grow min-w-0">
          <h4 className={`font-black text-lg truncate ${isTopThree ? 'text-gray-900' : 'text-gray-800'}`}>
            {cashier.name}
          </h4>
          <div className={`flex flex-wrap gap-2 mt-2 ${isTopThree ? 'text-gray-700' : 'text-gray-600'}`}>
            <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-lg text-xs font-bold">
              <Receipt className="w-3.5 h-3.5 text-blue-500" />
              {tickets}
            </span>
            <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-lg text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              {transactions}
            </span>
          </div>
        </div>

        {/* Main metric - MÁS DESTACADO */}
        <div className="flex-shrink-0 text-right">
          {rankType === "sales" && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="space-y-1"
            >
              <p className={`text-2xl font-black ${isTopThree ? 'text-gray-900 drop-shadow-md' : 'text-fuchsia-600'}`}>
                {formatCurrency(sales)}
              </p>
              <p className={`text-xs font-medium ${isTopThree ? 'text-gray-700' : 'text-gray-500'}`}>
                Ticket: {formatCurrency(calculatedAvgTicket)}
              </p>
            </motion.div>
          )}
          {rankType === "ticket" && (
            <motion.div
              whileHover={{ scale: 1.1 }}
            >
              <p className={`text-2xl font-black ${isTopThree ? 'text-gray-900 drop-shadow-md' : 'text-sky-600'}`}>
                {formatCurrency(calculatedAvgTicket)}
              </p>
              <p className={`text-xs font-medium ${isTopThree ? 'text-gray-700' : 'text-gray-500'}`}>
                promedio
              </p>
            </motion.div>
          )}
          {rankType === "suggested" && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="space-y-1"
            >
              <p className={`text-2xl font-black ${isTopThree ? 'text-gray-900 drop-shadow-md' : 'text-pink-600'}`}>
                {suggestedSales} 🎁
              </p>
              <p className={`text-xs font-medium ${isTopThree ? 'text-gray-700' : 'text-gray-500'}`}>
                sugeridos
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Decorative elements - MÁS DIVERTIDOS */}
      {isTopThree && (
        <>
          {/* Burbujas de fondo */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/30 rounded-full translate-y-10 -translate-x-10" />
          
          {/* Confetti animado para #1 */}
          {rank === 1 && (
            <>
              <motion.div className="absolute top-3 right-3" animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-6 h-6 text-yellow-600 drop-shadow-lg" />
              </motion.div>
              <motion.div className="absolute top-3 left-16" animate={{ y: [0, -8, 0], rotate: [0, 180, 360] }} transition={{ duration: 2, repeat: Infinity }}>
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
              </motion.div>
              <motion.div className="absolute bottom-3 right-20" animate={{ scale: [1, 1.3, 1], rotate: [0, -180, -360] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Star className="w-4 h-4 text-amber-400 fill-amber-300" />
              </motion.div>
              {/* Rayos de luz */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 to-amber-200/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </>
          )}
          
          {/* Estrellas para #2 */}
          {rank === 2 && (
            <>
              <motion.div className="absolute top-3 right-3" animate={{ scale: [1, 1.2, 1], rotate: [0, 20, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Star className="w-5 h-5 text-gray-600 fill-gray-500" />
              </motion.div>
              <motion.div className="absolute bottom-3 left-16" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>
                <Medal className="w-5 h-5 text-gray-500" />
              </motion.div>
            </>
          )}
          
          {/* Llamas para #3 */}
          {rank === 3 && (
            <>
              <motion.div className="absolute top-3 right-3" animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Flame className="w-5 h-5 text-orange-600" />
              </motion.div>
              <motion.div className="absolute bottom-3 left-16" animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Flame className="w-4 h-4 text-orange-500" />
              </motion.div>
            </>
          )}
        </>
      )}
      
      {/* Efecto de brillo para todos los rangos */}
      {!isTopThree && rank <= 5 && (
        <motion.div
          className="absolute top-1 right-1"
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-4 h-4 text-pink-400" />
        </motion.div>
      )}
    </motion.div>
  );
}