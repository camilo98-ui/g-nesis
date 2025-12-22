import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, Flame, Star, Zap, Users, TrendingUp, Target, Award,
  Receipt, Gift, Clock, Heart, Sun, Moon, Calendar, Crown
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BADGE_CONFIG = {
  top_seller: { 
    icon: Trophy, 
    color: 'from-amber-400 to-yellow-500', 
    label: 'Top Vendedor', 
    desc: 'Líder en ventas del mes',
    howToEarn: 'Logra ser el #1 en ventas totales del mes en tu tienda',
    goalType: 'monthly',
    glow: 'shadow-amber-400/50'
  },
  streak_7: { 
    icon: Flame, 
    color: 'from-orange-400 to-red-500', 
    label: 'Racha 7 días', 
    desc: '7 días consecutivos cumpliendo metas',
    howToEarn: 'Cumple o supera tu meta diaria de ventas durante 7 días seguidos',
    goalType: 'daily',
    glow: 'shadow-orange-400/50'
  },
  streak_30: { 
    icon: Flame, 
    color: 'from-red-500 to-pink-600', 
    label: 'Racha 30 días', 
    desc: '30 días consecutivos cumpliendo metas',
    howToEarn: 'Cumple tu meta diaria durante todo el mes sin fallar',
    goalType: 'monthly',
    glow: 'shadow-red-400/50'
  },
  perfect_day: { 
    icon: Star, 
    color: 'from-purple-400 to-violet-500', 
    label: 'Día Perfecto', 
    desc: 'Superó todas las metas del día',
    howToEarn: 'Cumple 100% de todas tus metas en un solo día (ventas, ticket, sugeridos)',
    goalType: 'daily',
    glow: 'shadow-purple-400/50'
  },
  team_player: { 
    icon: Users, 
    color: 'from-teal-400 to-cyan-500', 
    label: 'Jugador de Equipo', 
    desc: 'Mejor colaborador del mes',
    howToEarn: 'Destaca por tu actitud de equipo y apoyo a compañeros',
    goalType: 'monthly',
    glow: 'shadow-teal-400/50'
  },
  rising_star: { 
    icon: TrendingUp, 
    color: 'from-emerald-400 to-green-500', 
    label: 'Estrella Emergente', 
    desc: 'Mayor crecimiento del mes',
    howToEarn: 'Mejora tu rendimiento en +20% vs el mes anterior',
    goalType: 'monthly',
    glow: 'shadow-emerald-400/50'
  },
  goal_crusher: { 
    icon: Target, 
    color: 'from-blue-400 to-indigo-500', 
    label: 'Rompe Metas', 
    desc: 'Superó el 120% de sus objetivos',
    howToEarn: 'Supera el 120% de tu meta mensual de ventas',
    goalType: 'monthly',
    glow: 'shadow-blue-400/50'
  },
  consistent: { 
    icon: Award, 
    color: 'from-slate-400 to-gray-500', 
    label: 'Consistente', 
    desc: 'Rendimiento estable por 3 meses',
    howToEarn: 'Mantén un rendimiento superior al 85% durante 3 meses consecutivos',
    goalType: 'monthly',
    glow: 'shadow-slate-400/50'
  },
  ticket_master: { 
    icon: Receipt, 
    color: 'from-sky-400 to-blue-600', 
    label: 'Maestro del Ticket', 
    desc: 'Mejor ticket promedio del equipo',
    howToEarn: 'Logra el ticket promedio más alto del equipo en la semana',
    goalType: 'weekly',
    glow: 'shadow-sky-400/50'
  },
  suggested_king: { 
    icon: Gift, 
    color: 'from-pink-400 to-rose-500', 
    label: 'Rey de Sugeridos', 
    desc: 'Líder en ventas sugeridas',
    howToEarn: 'Sé el #1 en ventas sugeridas del mes',
    goalType: 'monthly',
    glow: 'shadow-pink-400/50'
  },
  speed_demon: { 
    icon: Zap, 
    color: 'from-yellow-400 to-amber-500', 
    label: 'Velocidad Máxima', 
    desc: 'Mayor cantidad de transacciones',
    howToEarn: 'Realiza más transacciones que cualquier otro cajero en el día',
    goalType: 'daily',
    glow: 'shadow-yellow-400/50'
  },
  customer_favorite: { 
    icon: Heart, 
    color: 'from-rose-400 to-red-500', 
    label: 'Favorito del Cliente', 
    desc: 'Mejor atención al cliente',
    howToEarn: 'Reconocido por clientes por tu excelente servicio',
    goalType: 'monthly',
    glow: 'shadow-rose-400/50'
  },
  early_bird: { 
    icon: Sun, 
    color: 'from-orange-300 to-yellow-400', 
    label: 'Madrugador', 
    desc: 'Mejor rendimiento en turnos mañana',
    howToEarn: 'Sé el mejor vendedor en turnos de mañana durante la semana',
    goalType: 'weekly',
    glow: 'shadow-orange-300/50'
  },
  night_owl: { 
    icon: Moon, 
    color: 'from-indigo-400 to-purple-600', 
    label: 'Búho Nocturno', 
    desc: 'Mejor rendimiento en turnos noche',
    howToEarn: 'Sé el mejor vendedor en turnos de noche durante la semana',
    goalType: 'weekly',
    glow: 'shadow-indigo-400/50'
  },
  weekend_warrior: { 
    icon: Calendar, 
    color: 'from-fuchsia-400 to-pink-500', 
    label: 'Guerrero del Fin de Semana', 
    desc: 'Mejor rendimiento los fines de semana',
    howToEarn: 'Logra las mejores ventas los fines de semana del mes',
    goalType: 'monthly',
    glow: 'shadow-fuchsia-400/50'
  },
  monthly_champion: { 
    icon: Crown, 
    color: 'from-amber-500 to-yellow-600', 
    label: 'Campeón del Mes', 
    desc: '1er lugar del ranking mensual',
    howToEarn: 'Ocupa el 1er lugar en el ranking general del mes',
    goalType: 'monthly',
    glow: 'shadow-amber-500/50'
  }
};

export { BADGE_CONFIG };

export default function BadgesDisplay({ cashierId, compact = false, showAll = false }) {
  const { data: badges = [] } = useQuery({
    queryKey: ['cashierBadges', cashierId],
    queryFn: () => base44.entities.CashierBadge.filter({ cashier_id: cashierId }),
    enabled: !!cashierId
  });

  if (badges.length === 0 && !showAll) {
    return compact ? null : (
      <div className="text-center py-4 text-gray-400 text-sm">
        Sin insignias aún
      </div>
    );
  }

  // Si showAll, mostrar todas las insignias posibles (ganadas y no ganadas)
  const badgesToShow = showAll 
    ? Object.keys(BADGE_CONFIG).map(type => {
        const earned = badges.find(b => b.badge_type === type);
        return { badge_type: type, earned: !!earned, ...earned };
      })
    : badges;

  return (
    <TooltipProvider>
      <div className={`flex ${compact ? 'gap-2' : 'flex-wrap gap-4'} items-center`}>
        {badgesToShow.slice(0, compact ? 3 : undefined).map((badge, idx) => {
          const config = BADGE_CONFIG[badge.badge_type];
          if (!config) return null;
          const Icon = config.icon;
          const isEarned = showAll ? badge.earned : true;
          
          return (
            <Tooltip key={badge.id || badge.badge_type || idx} delayDuration={200}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ 
                    delay: idx * 0.08, 
                    type: "spring", 
                    stiffness: 260,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: compact ? 1.25 : 1.15, 
                    rotate: [0, -5, 5, 0],
                    y: -8,
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative ${compact ? 'w-10 h-10' : 'w-16 h-16'} rounded-2xl 
                    ${isEarned 
                      ? `bg-gradient-to-br ${config.color} shadow-xl ${config.glow} border-2 border-white/30` 
                      : 'bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-gray-300'
                    } flex items-center justify-center cursor-pointer transition-all group overflow-hidden`}
                >
                  {/* Efecto de brillo de fondo */}
                  {isEarned && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0"
                      animate={{ 
                        x: ['-100%', '100%'],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 2.5, 
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  <Icon className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} ${isEarned ? 'text-white drop-shadow-lg' : 'text-gray-500'} relative z-10 transition-transform group-hover:scale-110`} />
                  
                  {/* Animación de pulso para insignias ganadas */}
                  {isEarned && !compact && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 rgba(255,255,255,0)',
                          '0 0 0 6px rgba(255,255,255,0.2)',
                          '0 0 0 0 rgba(255,255,255,0)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  
                  {/* Badge "NUEVO" para insignias recientes */}
                  {isEarned && badge.earned_date && isRecent(badge.earned_date) && (
                    <motion.div
                      className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg border-2 border-white"
                      animate={{ 
                        scale: [1, 1.15, 1],
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      NUEVO
                    </motion.div>
                  )}
                  
                  {/* Indicador interactivo */}
                  {!compact && (
                    <motion.div 
                      className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border-2 border-white"
                      initial={{ scale: 0, rotate: -180 }}
                      whileHover={{ 
                        scale: [1, 1.2, 1],
                        rotate: 360,
                        transition: { duration: 0.6 }
                      }}
                    >
                      <span className="text-[10px] font-black text-white">i</span>
                    </motion.div>
                  )}
                  
                  {/* Efecto de bloqueo para insignias no ganadas */}
                  {!isEarned && showAll && (
                    <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-2xl"
                      >
                        🔒
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent 
                className="max-w-xs bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-white/20 shadow-2xl p-0 overflow-hidden"
                sideOffset={10}
              >
                <div className="relative">
                  {/* Header con gradiente */}
                  <div className={`bg-gradient-to-r ${config.color} p-4 relative overflow-hidden`}>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                        <Icon className="w-7 h-7 text-white drop-shadow-lg" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-white text-base drop-shadow-md">{config.label}</p>
                        {isEarned && badge.earned_date && (
                          <p className="text-[10px] text-white/80 font-medium">
                            {new Date(badge.earned_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-gray-300 text-center leading-relaxed">{config.desc}</p>

                    <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl p-3 border border-violet-400/30 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs">🎯</span>
                        <p className="text-xs text-violet-300 font-bold">Cómo lograrlo:</p>
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed">{config.howToEarn}</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-3 py-1.5 rounded-full font-bold shadow-md ${
                        config.goalType === 'daily' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' :
                        config.goalType === 'weekly' ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
                        'bg-gradient-to-r from-purple-400 to-pink-500 text-white'
                      }`}>
                        {config.goalType === 'daily' ? '📅 Diaria' : config.goalType === 'weekly' ? '📊 Semanal' : '🏆 Mensual'}
                      </span>
                      {isEarned && badge.kpi_value && (
                        <span className="text-[10px] bg-gradient-to-r from-emerald-400 to-green-500 text-white px-3 py-1.5 rounded-full font-bold shadow-md">
                          ✓ {Math.round(badge.kpi_value).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {!isEarned && showAll && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-2 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <p className="text-xs text-gray-400 italic flex items-center justify-center gap-2">
                          <span>🔒</span>
                          <span>Aún no desbloqueado</span>
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {compact && badges.length > 3 && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.15, rotate: 360 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-xs text-gray-600 font-black shadow-md cursor-pointer"
              >
                +{badges.length - 3}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">{badges.length - 3} insignias más</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Helper para verificar si una insignia es reciente (últimos 7 días)
function isRecent(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const diff = now - date;
    return diff < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}