import React, { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  User, Mail, Phone, Calendar, Award, TrendingUp, TrendingDown,
  DollarSign, Receipt, Zap, Gift, Star, Eye, X, Crown, Medal,
  Flame, Target, Hash, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import BadgesDisplay from '@/components/gamification/BadgesDisplay';
import CashierAnalysis from '@/components/cashier/CashierAnalysis';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Hashtags based on performance
const PERFORMANCE_HASHTAGS = {
  topSeller: { tag: '#TopVendedor', color: 'from-amber-400 to-yellow-500', icon: Crown },
  consistent: { tag: '#Consistente', color: 'from-emerald-400 to-green-500', icon: Target },
  rising: { tag: '#EnAscenso', color: 'from-blue-400 to-cyan-500', icon: TrendingUp },
  suggestKing: { tag: '#ReySugeridos', color: 'from-pink-400 to-rose-500', icon: Gift },
  ticketMaster: { tag: '#TicketAlto', color: 'from-purple-400 to-violet-500', icon: Receipt },
  teamPlayer: { tag: '#Equipo', color: 'from-indigo-400 to-blue-500', icon: Star },
  veteran: { tag: '#Veterano', color: 'from-slate-400 to-gray-500', icon: Medal },
  newStar: { tag: '#NuevoTalento', color: 'from-orange-400 to-amber-500', icon: Sparkles },
  reliable: { tag: '#Confiable', color: 'from-teal-400 to-emerald-500', icon: Flame },
};

export default function CashierFullProfile({ 
  cashier, 
  stats, 
  storeId, 
  teamStats,
  isOpen,
  onClose 
}) {
  const analysisRef = useRef(null);

  // Fetch badges
  const { data: badges = [] } = useQuery({
    queryKey: ['badges', cashier?.id],
    queryFn: () => base44.entities.CashierBadge.filter({ cashier_id: cashier.id }),
    enabled: !!cashier?.id
  });

  // Fetch all shift records for this cashier
  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId, cashier?.id],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId, cashier_id: cashier?.id }),
    enabled: !!storeId && !!cashier?.id
  });

  // Auto scroll to analysis when profile opens
  useEffect(() => {
    if (isOpen && analysisRef.current) {
      setTimeout(() => {
        analysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [isOpen, cashier?.id]);

  // Calculate hashtags based on performance
  const hashtags = useMemo(() => {
    if (!stats || !teamStats) return [];
    const tags = [];
    
    // Top seller
    if (stats.rank === 1) {
      tags.push(PERFORMANCE_HASHTAGS.topSeller);
    }
    
    // Consistent performer (low variance in sales)
    if (stats.daysWorked >= 10) {
      tags.push(PERFORMANCE_HASHTAGS.consistent);
    }
    
    // Rising star (recent performance better than average)
    if (stats.compositeScore > 70) {
      tags.push(PERFORMANCE_HASHTAGS.rising);
    }
    
    // Suggest king (high suggested sales)
    if (stats.totalSuggested > teamStats.avgSuggested * 1.2) {
      tags.push(PERFORMANCE_HASHTAGS.suggestKing);
    }
    
    // Ticket master (high average ticket)
    if (stats.avgTicket > teamStats.avgTicket * 1.1) {
      tags.push(PERFORMANCE_HASHTAGS.ticketMaster);
    }
    
    // Team player (consistent attendance)
    if (stats.daysWorked >= 15) {
      tags.push(PERFORMANCE_HASHTAGS.teamPlayer);
    }
    
    // Veteran or new talent based on hire date
    if (cashier?.hire_date) {
      const hireDate = new Date(cashier.hire_date);
      const monthsWorked = (new Date() - hireDate) / (1000 * 60 * 60 * 24 * 30);
      if (monthsWorked >= 12) {
        tags.push(PERFORMANCE_HASHTAGS.veteran);
      } else if (monthsWorked <= 3 && stats.rank <= 5) {
        tags.push(PERFORMANCE_HASHTAGS.newStar);
      }
    }
    
    // Reliable (worked most scheduled days)
    if (stats.daysWorked >= 20) {
      tags.push(PERFORMANCE_HASHTAGS.reliable);
    }
    
    return tags.slice(0, 5); // Max 5 hashtags
  }, [stats, teamStats, cashier]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  if (!cashier) return null;

  const ProfileContent = () => (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-6 text-white"
      >
        {/* Animated background */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl"
          animate={{ scale: [1, 1.3, 1], y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30"
          >
            {cashier.photo_url ? (
              <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-5xl">🍦</span>
            )}
          </motion.div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              {stats?.rank <= 3 && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {stats.rank === 1 ? '👑' : stats.rank === 2 ? '🥈' : '🥉'}
                </motion.div>
              )}
              <h2 className="text-2xl md:text-3xl font-bold">{cashier.name}</h2>
            </div>
            
            {/* Hashtags */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
              {hashtags.map((ht, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className={`px-3 py-1 rounded-full bg-gradient-to-r ${ht.color} text-white text-xs font-bold shadow-lg cursor-pointer`}
                >
                  <Hash className="w-3 h-3 inline mr-0.5" />
                  {ht.tag.replace('#', '')}
                </motion.span>
              ))}
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-white/80 text-sm">
              {cashier.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {cashier.email}
                </span>
              )}
              {cashier.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {cashier.phone}
                </span>
              )}
              {cashier.hire_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Desde {format(new Date(cashier.hire_date), 'MMM yyyy', { locale: es })}
                </span>
              )}
            </div>
          </div>

          {/* Rank badge */}
          {stats?.rank && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center"
            >
              <p className="text-4xl font-black">#{stats.rank}</p>
              <p className="text-xs text-white/70">Ranking</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Ventas', value: formatCurrency(stats?.totalSales), icon: DollarSign, color: 'emerald' },
          { label: 'Tickets', value: stats?.totalTickets?.toLocaleString(), icon: Receipt, color: 'blue' },
          { label: 'Ticket Prom.', value: formatCurrency(stats?.avgTicket), icon: Target, color: 'purple' },
          { label: 'Sugeridos', value: stats?.totalSuggested?.toLocaleString(), icon: Gift, color: 'pink' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.03, y: -3 }}
            className={`bg-${stat.color}-50 rounded-xl p-4 text-center border border-${stat.color}-100`}
          >
            <stat.icon className={`w-5 h-5 mx-auto mb-2 text-${stat.color}-500`} />
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-lg font-black text-${stat.color}-600`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Badges Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-500" />
            Insignias Obtenidas ({badges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BadgesDisplay cashierId={cashier.id} showAll />
        </CardContent>
      </Card>

      {/* Analysis Chart - Auto scrolls here */}
      <div ref={analysisRef}>
        <CashierAnalysis 
          cashierId={cashier.id}
          cashierName={cashier.name}
          storeId={storeId}
        />
      </div>

      {/* Comparison with team */}
      {teamStats && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Comparación con el Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Ventas vs Promedio', value: stats?.totalSales, avg: teamStats.avgSales },
                { label: 'Ticket vs Promedio', value: stats?.avgTicket, avg: teamStats.avgTicket },
                { label: 'Sugeridos vs Promedio', value: stats?.totalSuggested, avg: teamStats.avgSuggested },
              ].map((metric, idx) => {
                const percentage = metric.avg > 0 ? ((metric.value / metric.avg) * 100 - 100) : 0;
                const isPositive = percentage >= 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{metric.label}</span>
                      <span className={isPositive ? 'text-emerald-600' : 'text-red-500'}>
                        {isPositive ? '+' : ''}{percentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (metric.value / (metric.avg * 2)) * 100)} 
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent achievements timeline */}
      {badges.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Logros Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {badges.slice(0, 5).map((badge, idx) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-lg">
                    🏆
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-700 text-sm">{badge.badge_type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">
                      {badge.earned_date && format(new Date(badge.earned_date), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render as modal or inline
  if (typeof isOpen !== 'undefined') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="p-6">
            <ProfileContent />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <ProfileContent />;
}

// Button to open profile modal
export function ViewProfileButton({ cashier, stats, storeId, teamStats }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="hover:bg-purple-50"
      >
        <Eye className="w-4 h-4 text-purple-500" />
      </Button>
      <CashierFullProfile
        cashier={cashier}
        stats={stats}
        storeId={storeId}
        teamStats={teamStats}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}