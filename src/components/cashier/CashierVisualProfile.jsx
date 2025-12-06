import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Mail, Phone, Calendar, MapPin, Award, TrendingUp, 
  Star, Zap, Target, DollarSign, Receipt, Gift
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BadgesDisplay from '@/components/gamification/BadgesDisplay';

// Patrones de portada dinámicos basados en rendimiento
const COVER_PATTERNS = [
  { gradient: 'from-pink-400 via-rose-400 to-pink-500', emoji: '🍦' },
  { gradient: 'from-violet-400 via-purple-400 to-violet-500', emoji: '⭐' },
  { gradient: 'from-cyan-400 via-blue-400 to-cyan-500', emoji: '🏆' },
  { gradient: 'from-amber-400 via-orange-400 to-amber-500', emoji: '🔥' },
  { gradient: 'from-emerald-400 via-green-400 to-emerald-500', emoji: '💎' },
];

const getCoverPattern = (cashierId, score = 0) => {
  const index = ((cashierId?.charCodeAt(0) || 0) + Math.floor(score / 20)) % COVER_PATTERNS.length;
  return COVER_PATTERNS[index];
};

export default function CashierVisualProfile({ cashier, storeCode, shiftRecords = [], teamAvg = {} }) {
  const { data: badges = [] } = useQuery({
    queryKey: ['cashierBadges', cashier?.id],
    queryFn: () => base44.entities.CashierBadge.filter({ cashier_id: cashier?.id }),
    enabled: !!cashier?.id
  });

  // Calcular stats del cajero
  const stats = useMemo(() => {
    const records = shiftRecords.filter(r => r.cashier_id === cashier?.id);
    const totalSales = records.reduce((sum, r) => sum + (r.sales || 0), 0);
    const totalTickets = records.reduce((sum, r) => sum + (r.tickets || 0), 0);
    const totalTransactions = records.reduce((sum, r) => sum + (r.transactions || 0), 0);
    const totalSuggested = records.reduce((sum, r) => sum + (r.suggested_sales || 0), 0);
    const daysWorked = records.length;
    const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;

    return {
      totalSales,
      totalTickets,
      totalTransactions,
      totalSuggested,
      daysWorked,
      avgTicket
    };
  }, [shiftRecords, cashier?.id]);

  // Score compuesto para la portada
  const performanceScore = useMemo(() => {
    if (!teamAvg.avgSales) return 50;
    const salesRatio = (stats.totalSales / teamAvg.avgSales) * 100;
    return Math.min(100, Math.max(0, salesRatio));
  }, [stats, teamAvg]);

  const coverPattern = getCoverPattern(cashier?.id, performanceScore);
  const totalPoints = badges.length * 10; // Puntos base por insignia

  if (!cashier) return null;

  return (
    <Card className="overflow-hidden border-none shadow-xl">
      {/* Cover Photo con patrón dinámico */}
      <div className={`h-36 md:h-44 relative overflow-hidden bg-gradient-to-r ${coverPattern.gradient}`}>
        {/* Patrón decorativo */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 80%, white 2px, transparent 2px)',
            backgroundSize: '40px 40px'
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Elementos decorativos flotantes más visibles */}
        <motion.div
          className="absolute top-4 left-10 text-white/70 text-6xl drop-shadow-lg"
          animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {coverPattern.emoji}
        </motion.div>
        <motion.div
          className="absolute top-8 right-10 text-white/60 text-5xl drop-shadow-lg"
          animate={{ y: [0, 15, 0], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        >
          ⭐
        </motion.div>
        <motion.div
          className="absolute bottom-6 left-20 text-white/50 text-4xl drop-shadow-lg"
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 0.5 }}
        >
          🍦
        </motion.div>
        
        {/* Score Badge */}
        <motion.div
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1"
          whileHover={{ scale: 1.1 }}
        >
          <span className="text-white text-sm font-bold">{totalPoints} pts</span>
        </motion.div>

        {/* Performance Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <motion.div
            className="h-full bg-white/60"
            initial={{ width: 0 }}
            animate={{ width: `${performanceScore}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
      
      {/* Profile Info */}
      <CardContent className="pt-0 pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-14 md:-mt-16 px-4">
          {/* Profile Picture */}
          <motion.div 
            className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white shadow-xl overflow-hidden flex items-center justify-center border-4 border-white"
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            {cashier.photo_url ? (
              <img src={cashier.photo_url} alt={cashier.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-5xl md:text-6xl font-bold text-pink-500">
                {cashier.name?.charAt(0)}
              </span>
            )}
          </motion.div>
          
          {/* Name and Store */}
          <div className="pb-2 flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-800">{cashier.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {storeCode}
              </p>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                {badges.length} 🏅
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 px-4">
          {cashier.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{cashier.email}</span>
            </div>
          )}
          {cashier.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <Phone className="w-4 h-4 text-gray-400" />
              {cashier.phone}
            </div>
          )}
          {cashier.hire_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              Desde {format(new Date(cashier.hire_date), "MMM yyyy", { locale: es })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 px-4">
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-black text-emerald-600">${(stats.totalSales/1000000).toFixed(1)}M</p>
            <p className="text-[10px] text-gray-500">Ventas</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <Receipt className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-black text-blue-600">${(stats.avgTicket/1000).toFixed(0)}K</p>
            <p className="text-[10px] text-gray-500">Ticket Prom.</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-black text-purple-600">{stats.totalTransactions}</p>
            <p className="text-[10px] text-gray-500">Transacciones</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-3 text-center">
            <Gift className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <p className="text-lg font-black text-pink-600">{stats.totalSuggested}</p>
            <p className="text-[10px] text-gray-500">Sugeridos</p>
          </div>
        </div>

        {/* Performance vs Team */}
        {teamAvg.avgSales > 0 && (
          <div className="mt-4 mx-4 p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Rendimiento vs Equipo
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Ventas</span>
                  <span className={stats.totalSales > teamAvg.avgSales ? 'text-emerald-600 font-bold' : 'text-red-500'}>
                    {((stats.totalSales / teamAvg.avgSales) * 100 - 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={Math.min(100, (stats.totalSales / teamAvg.avgSales) * 50)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Ticket Promedio</span>
                  <span className={stats.avgTicket > teamAvg.avgTicket ? 'text-emerald-600 font-bold' : 'text-red-500'}>
                    {((stats.avgTicket / (teamAvg.avgTicket || 1)) * 100 - 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={Math.min(100, (stats.avgTicket / (teamAvg.avgTicket || 1)) * 50)} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {/* Badges Section */}
        <div className="mt-6 mx-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-500" />
            Logros ({badges.length})
          </h4>
          <BadgesDisplay cashierId={cashier.id} showAll />
        </div>
      </CardContent>
    </Card>
  );
}