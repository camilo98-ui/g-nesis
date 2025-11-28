import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Star, Zap, Users, TrendingUp, Target, Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BADGE_CONFIG = {
  top_seller: { icon: Trophy, color: 'from-amber-400 to-yellow-500', label: 'Top Vendedor', desc: 'Líder en ventas del mes' },
  streak_7: { icon: Flame, color: 'from-orange-400 to-red-500', label: 'Racha 7 días', desc: '7 días consecutivos cumpliendo metas' },
  streak_30: { icon: Flame, color: 'from-red-500 to-pink-600', label: 'Racha 30 días', desc: '30 días consecutivos cumpliendo metas' },
  perfect_day: { icon: Star, color: 'from-purple-400 to-violet-500', label: 'Día Perfecto', desc: 'Superó todas las metas del día' },
  team_player: { icon: Users, color: 'from-teal-400 to-cyan-500', label: 'Jugador de Equipo', desc: 'Mejor colaborador del mes' },
  rising_star: { icon: TrendingUp, color: 'from-emerald-400 to-green-500', label: 'Estrella Emergente', desc: 'Mayor crecimiento del mes' },
  goal_crusher: { icon: Target, color: 'from-blue-400 to-indigo-500', label: 'Rompe Metas', desc: 'Superó el 120% de sus objetivos' },
  consistent: { icon: Award, color: 'from-slate-400 to-gray-500', label: 'Consistente', desc: 'Rendimiento estable por 3 meses' }
};

export default function BadgesDisplay({ cashierId, compact = false }) {
  const { data: badges = [] } = useQuery({
    queryKey: ['cashierBadges', cashierId],
    queryFn: () => base44.entities.CashierBadge.filter({ cashier_id: cashierId }),
    enabled: !!cashierId
  });

  if (badges.length === 0) {
    return compact ? null : (
      <div className="text-center py-4 text-gray-400 text-sm">
        Sin insignias aún
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex ${compact ? 'gap-1' : 'flex-wrap gap-2'}`}>
        {badges.slice(0, compact ? 3 : undefined).map((badge, idx) => {
          const config = BADGE_CONFIG[badge.badge_type];
          if (!config) return null;
          const Icon = config.icon;
          
          return (
            <Tooltip key={badge.id || idx}>
              <TooltipTrigger>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  className={`${compact ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className={`${compact ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-white`} />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-bold">{config.label}</p>
                  <p className="text-xs text-gray-400">{config.desc}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {compact && badges.length > 3 && (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
            +{badges.length - 3}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}