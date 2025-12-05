import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BADGE_CONFIG } from './BadgesDisplay';
import { 
  Trophy, Crown, Medal, Star, TrendingUp, Award, Zap, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function GlobalPointsRanking({ storeId, cashiers = [], limit = 10 }) {
  // Obtener todas las insignias de los cajeros de la tienda
  const { data: allBadges = [], isLoading } = useQuery({
    queryKey: ['allStoreBadges', storeId],
    queryFn: async () => {
      const badges = [];
      for (const cashier of cashiers) {
        const cb = await base44.entities.CashierBadge.filter({ cashier_id: cashier.id });
        badges.push(...cb.map(b => ({ ...b, cashier_name: cashier.name, cashier_photo: cashier.photo_url })));
      }
      return badges;
    },
    enabled: cashiers.length > 0
  });

  // Obtener configuración de puntos
  const { data: badgeConfigs = [] } = useQuery({
    queryKey: ['badgeConfigs', storeId],
    queryFn: () => base44.entities.BadgeConfig.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Calcular puntos por cajero
  const ranking = useMemo(() => {
    const pointsByUser = {};

    cashiers.forEach(c => {
      pointsByUser[c.id] = {
        id: c.id,
        name: c.name,
        photo_url: c.photo_url,
        badges: [],
        totalPoints: 0,
        badgeCount: 0
      };
    });

    allBadges.forEach(badge => {
      if (!pointsByUser[badge.cashier_id]) return;

      // Buscar puntos configurados o usar default
      const config = badgeConfigs.find(c => c.badge_type === badge.badge_type);
      const points = config?.points_awarded || 10;

      pointsByUser[badge.cashier_id].badges.push(badge.badge_type);
      pointsByUser[badge.cashier_id].totalPoints += points;
      pointsByUser[badge.cashier_id].badgeCount++;
    });

    return Object.values(pointsByUser)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [cashiers, allBadges, badgeConfigs, limit]);

  const maxPoints = Math.max(...ranking.map(r => r.totalPoints), 1);

  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: 'bg-gradient-to-r from-amber-100 to-yellow-100', border: 'border-amber-300', icon: Crown, iconColor: 'text-amber-500' };
    if (rank === 2) return { bg: 'bg-gradient-to-r from-gray-100 to-slate-100', border: 'border-gray-300', icon: Medal, iconColor: 'text-gray-400' };
    if (rank === 3) return { bg: 'bg-gradient-to-r from-amber-50 to-orange-50', border: 'border-amber-200', icon: Medal, iconColor: 'text-amber-600' };
    return { bg: 'bg-white', border: 'border-gray-100', icon: null, iconColor: '' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-400">
          Cargando ranking...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
        <CardTitle className="text-sm font-bold text-purple-700 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Ranking Global de Puntos
        </CardTitle>
        <p className="text-xs text-gray-500">Basado en insignias obtenidas</p>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {ranking.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin datos de ranking aún</p>
          </div>
        ) : (
          ranking.map((cashier, idx) => {
            const style = getRankStyle(cashier.rank);
            const RankIcon = style.icon;

            return (
              <motion.div
                key={cashier.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <Link to={createPageUrl(`CashierProfile?id=${cashier.id}&from=ranking`)}>
                  <div className={`p-3 rounded-xl border-2 ${style.bg} ${style.border} transition-all cursor-pointer`}>
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                        {RankIcon ? (
                          <RankIcon className={`w-5 h-5 ${style.iconColor}`} />
                        ) : (
                          <span className="text-sm font-black text-gray-500">#{cashier.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden flex-shrink-0">
                        {cashier.photo_url ? (
                          <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-lg font-bold text-purple-500">
                            {cashier.name?.charAt(0)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{cashier.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={(cashier.totalPoints / maxPoints) * 100} className="h-1.5 flex-1" />
                          <span className="text-xs text-gray-500">{cashier.badgeCount} 🏅</span>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <motion.p 
                          className="text-xl font-black text-purple-600"
                          animate={cashier.rank === 1 ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {cashier.totalPoints}
                        </motion.p>
                        <p className="text-[9px] text-gray-400">puntos</p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}

        {/* Leyenda de puntos */}
        <div className="mt-4 p-3 bg-purple-50 rounded-xl">
          <p className="text-xs text-purple-700 font-medium mb-2">💡 ¿Cómo ganar puntos?</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500" />
              <span>Insignias = puntos</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-500" />
              <span>Cumple metas</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>Supera KPIs</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-pink-500" />
              <span>Consistencia</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}