import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Crown, Receipt, Zap, Star, Flame, Sparkles, Calendar, ChevronRight, X, TrendingUp, Target, Gift, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ScoreBreakdown from './ScoreBreakdown';
import LevelBadge from './LevelBadge';
import TrafficLight from './TrafficLight';

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
  delay = 0,
  // Nuevos props para gamificación completa
  overallScore = 0,
  salesScore = 0,
  ticketScore = 0,
  suggestedScore = 0,
  level = 'Rookie',
  levelColor = 'gray',
  expanded = false,
  onToggle = null
}) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);
  const [showDetailModal, setShowDetailModal] = React.useState(false);
  const isTopThree = rank <= 3;
  const rankStyle = RANK_STYLES[rank];
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Math.round(val));
  };

  const calculatedAvgTicket = avgTicket || (transactions > 0 ? sales / transactions : 0);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onToggle) onToggle(!isExpanded);
  };

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
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, x: -20, rotateY: -15 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ delay, duration: 0.4, type: "spring" }}
        whileHover={{ scale: 1.02, y: -3 }}
        className={`relative overflow-hidden rounded-2xl ${
          isTopThree 
            ? `bg-gradient-to-r ${rankStyle.bg} text-gray-800 shadow-2xl ${rankStyle.ring}` 
            : 'bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-pink-300'
        } transition-all duration-300`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="p-5"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-4 cursor-pointer">
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
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`font-black text-lg truncate ${isTopThree ? 'text-gray-900' : 'text-gray-800'}`}>
              {cashier.name}
            </h4>
            {rankType === 'best' && <LevelBadge level={level} score={overallScore} compact />}
          </div>
          
          {rankType === 'best' && overallScore > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <ScoreBreakdown 
                salesScore={salesScore}
                ticketScore={ticketScore}
                suggestedScore={suggestedScore}
                overallScore={overallScore}
                compact
              />
            </div>
          )}

          <div className={`flex flex-wrap gap-2 ${isTopThree ? 'text-gray-700' : 'text-gray-600'}`}>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer hover:bg-white/80 transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  {transactions || 0}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-800 border-none">
                <p className="text-xs text-white">Transacciones totales</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer hover:bg-white/80 transition-colors">
                  <Receipt className="w-3.5 h-3.5 text-blue-500" />
                  {formatCurrency(calculatedAvgTicket)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-800 border-none">
                <p className="text-xs text-white">Ticket Promedio</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Main metric - MÁS DESTACADO */}
        <div className="flex-shrink-0 text-right flex items-center gap-2">
            {rankType === "sales" && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="space-y-1"
              >
                <p className={`text-2xl font-black ${isTopThree ? 'text-gray-900 drop-shadow-md' : 'text-fuchsia-600'}`}>
                  {formatCurrency(sales)}
                </p>
                <p className={`text-xs font-medium ${isTopThree ? 'text-gray-700' : 'text-gray-500'}`}>
                  ventas
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
            {rankType === "best" && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="space-y-1"
              >
                <p className={`text-3xl font-black ${isTopThree ? 'text-gray-900 drop-shadow-md' : 'text-purple-600'}`}>
                  {overallScore.toFixed(0)}
                </p>
                <p className={`text-xs font-medium ${isTopThree ? 'text-gray-700' : 'text-gray-500'}`}>
                  puntos
                </p>
              </motion.div>
            )}
            
            {/* Botón ver detalle */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailModal(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`ml-2 px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-all ${
                isTopThree 
                  ? 'bg-white/60 hover:bg-white/80 text-gray-800' 
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Detalle
            </motion.button>
          </div>
        </div>

        {/* Panel expandido con detalles completos */}
        {isExpanded && rankType === 'best' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/50 pt-4 mt-4 space-y-4"
          >
            {/* Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ScoreBreakdown
                salesScore={salesScore}
                ticketScore={ticketScore}
                suggestedScore={suggestedScore}
                overallScore={overallScore}
              />
              
              <LevelBadge level={level} score={overallScore} />
            </div>

            {/* Semáforos */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-600 uppercase">Semáforo de Desempeño</p>
              <div className="grid grid-cols-3 gap-2">
                <TrafficLight
                  value={sales}
                  target={sales * 0.9} // Simulación de meta
                  label="Ventas"
                  type="sales"
                  compact
                />
                <TrafficLight
                  value={calculatedAvgTicket}
                  target={calculatedAvgTicket * 0.85}
                  label="Ticket"
                  type="ticket"
                  compact
                />
                <TrafficLight
                  value={suggestedSales}
                  target={suggestedSales * 0.8}
                  label="Sugeridos"
                  type="suggested"
                  compact
                />
              </div>
            </div>
          </motion.div>
        )}
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

      {/* Modal de Detalle del Cajero */}
      {showDetailModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className={`p-6 border-b border-white/10 ${
                isTopThree 
                  ? `bg-gradient-to-r ${rankStyle.bg}` 
                  : 'bg-gradient-to-r from-pink-500/20 to-rose-500/20'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Photo */}
                    <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center ${
                      isTopThree 
                        ? 'bg-white/40 backdrop-blur-sm ring-4 ring-white/60' 
                        : 'bg-gradient-to-br from-pink-100 to-rose-200'
                    }`}>
                      {cashier.photo_url ? (
                        <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`text-3xl font-black ${isTopThree ? 'text-white' : 'text-fuchsia-600'}`}>
                          {cashier.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`text-2xl font-black ${isTopThree ? 'text-gray-900' : 'text-white'}`}>
                          {cashier.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          isTopThree 
                            ? 'bg-white/60 text-gray-900' 
                            : 'bg-white/10 text-white'
                        }`}>
                          {isTopThree ? rankStyle.badge : `#${rank}`}
                        </span>
                      </div>
                      <p className={`text-sm ${isTopThree ? 'text-gray-700' : 'text-slate-300'}`}>
                        Posición {rank} en {rankType === 'sales' ? 'Ventas' : rankType === 'ticket' ? 'Ticket Promedio' : rankType === 'suggested' ? 'Sugeridos' : 'Ranking General'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isTopThree 
                        ? 'bg-white/40 hover:bg-white/60' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <X className={`w-5 h-5 ${isTopThree ? 'text-gray-900' : 'text-white'}`} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Score General y Nivel */}
                  {rankType === 'best' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-4">
                          <Trophy className="w-5 h-5 text-purple-400" />
                          <h4 className="text-lg font-bold text-white">Puntuación General</h4>
                        </div>
                        <p className="text-5xl font-black text-purple-400 mb-2">{overallScore.toFixed(0)}</p>
                        <p className="text-sm text-slate-400">Puntos totales acumulados</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
                        <LevelBadge level={level} score={overallScore} />
                      </div>
                    </div>
                  )}

                  {/* Distribución de Puntos por Indicador */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-6">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      <h4 className="text-lg font-bold text-white">Distribución de Puntos</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Ventas */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-bold text-white">Ventas</span>
                          </div>
                          <span className="text-lg font-black text-emerald-400">{salesScore.toFixed(0)} pts</span>
                        </div>
                        <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(salesScore / overallScore) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-400">{formatCurrency(sales)} en ventas</span>
                          <span className="text-xs text-emerald-400">{((salesScore / overallScore) * 100).toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Ticket Promedio */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-bold text-white">Ticket Promedio</span>
                          </div>
                          <span className="text-lg font-black text-blue-400">{ticketScore.toFixed(0)} pts</span>
                        </div>
                        <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(ticketScore / overallScore) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-400">{formatCurrency(calculatedAvgTicket)} promedio</span>
                          <span className="text-xs text-blue-400">{((ticketScore / overallScore) * 100).toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Sugeridos */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-pink-400" />
                            <span className="text-sm font-bold text-white">Sugeridos</span>
                          </div>
                          <span className="text-lg font-black text-pink-400">{suggestedScore.toFixed(0)} pts</span>
                        </div>
                        <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(suggestedScore / overallScore) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-400">{suggestedSales} productos sugeridos</span>
                          <span className="text-xs text-pink-400">{((suggestedScore / overallScore) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métricas de Gestión */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4">Métricas de Gestión</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg p-4 border border-emerald-500/20">
                        <p className="text-xs text-emerald-300 mb-1">Ventas Totales</p>
                        <p className="text-xl font-black text-white">{formatCurrency(sales)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                        <p className="text-xs text-blue-300 mb-1">Transacciones</p>
                        <p className="text-xl font-black text-white">{transactions}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                        <p className="text-xs text-purple-300 mb-1">Tickets</p>
                        <p className="text-xl font-black text-white">{tickets}</p>
                      </div>
                      <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-lg p-4 border border-pink-500/20">
                        <p className="text-xs text-pink-300 mb-1">Sugeridos</p>
                        <p className="text-xl font-black text-white">{suggestedSales}</p>
                      </div>
                    </div>
                  </div>

                  {/* Semáforos de Desempeño */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4">Semáforo de Desempeño</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TrafficLight
                        value={sales}
                        target={sales * 0.9}
                        label="Ventas"
                        type="sales"
                      />
                      <TrafficLight
                        value={calculatedAvgTicket}
                        target={calculatedAvgTicket * 0.85}
                        label="Ticket"
                        type="ticket"
                      />
                      <TrafficLight
                        value={suggestedSales}
                        target={suggestedSales * 0.8}
                        label="Sugeridos"
                        type="suggested"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
    </TooltipProvider>
  );
}