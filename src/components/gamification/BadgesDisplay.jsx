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
      <div className={`flex ${compact ? 'gap-1' : 'flex-wrap gap-3'}`}>
        {badgesToShow.slice(0, compact ? 3 : undefined).map((badge, idx) => {
          const config = BADGE_CONFIG[badge.badge_type];
          if (!config) return null;
          const Icon = config.icon;
          const isEarned = showAll ? badge.earned : true;
          
          return (
            <Tooltip key={badge.id || badge.badge_type || idx}>
              <TooltipTrigger>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.2, rotate: 10, y: -5 }}
                  className={`relative ${compact ? 'w-8 h-8' : 'w-14 h-14'} rounded-full 
                    ${isEarned 
                      ? `bg-gradient-to-br ${config.color} shadow-lg ${config.glow}` 
                      : 'bg-gray-200'
                    } flex items-center justify-center cursor-pointer transition-all group`}
                >
                  <Icon className={`${compact ? 'w-4 h-4' : 'w-7 h-7'} ${isEarned ? 'text-white' : 'text-gray-400'}`} />
                  
                  {/* Animación de brillo para insignias ganadas */}
                  {isEarned && !compact && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{ 
                        boxShadow: [
                          '0 0 0 0 rgba(255,255,255,0)',
                          '0 0 0 4px rgba(255,255,255,0.3)',
                          '0 0 0 0 rgba(255,255,255,0)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  
                  {/* Indicador de nuevo */}
                  {isEarned && badge.earned_date && isRecent(badge.earned_date) && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                  
                  {/* Signo de interrogación para ver detalles */}
                  {!compact && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-gray-500">?</span>
                    </div>
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-center p-3 max-w-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${isEarned ? config.iconColor : 'text-gray-400'}`} />
                    <p className="font-bold text-base">{config.label}</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{config.desc}</p>

                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-3 mb-2">
                    <p className="text-xs text-violet-700 font-bold mb-1">🎯 Cómo lograrlo:</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{config.howToEarn}</p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      config.goalType === 'daily' ? 'bg-amber-100 text-amber-700' :
                      config.goalType === 'weekly' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      Meta {config.goalType === 'daily' ? 'Diaria' : config.goalType === 'weekly' ? 'Semanal' : 'Mensual'}
                    </span>
                    {isEarned && badge.kpi_value && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                        ✓ KPI: {Math.round(badge.kpi_value).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {!isEarned && showAll && (
                    <p className="text-xs text-gray-400 mt-2 italic">⏳ Aún no obtenido</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {compact && badges.length > 3 && (
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold"
          >
            +{badges.length - 3}
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Helper para verificar si una insignia es reciente (últimos 7 días)
function isRecent(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  return diff < 7 * 24 * 60 * 60 * 1000;
}