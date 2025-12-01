import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Users, Clock, Calendar, TrendingUp, Award, Target, 
  IceCream, Coffee, Package, Headphones, Cookie, ClipboardList, Sparkles, ShoppingCart, Crown
} from 'lucide-react';

const ROLES_CONFIG = {
  caja: { label: 'Caja', icon: ShoppingCart, color: '#10b981' },
  coneo: { label: 'Coneo', icon: IceCream, color: '#ec4899' },
  bebidas: { label: 'Bebidas', icon: Coffee, color: '#f59e0b' },
  especialidades: { label: 'Especialidades', icon: Sparkles, color: '#8b5cf6' },
  coordinacion: { label: 'Coord. Entregas', icon: ClipboardList, color: '#3b82f6' },
  cookie_jar: { label: 'Cookie Jar', icon: Cookie, color: '#f97316' },
  stocker: { label: 'Stocker', icon: Package, color: '#64748b' },
  toma_pedidos: { label: 'Toma Pedidos', icon: Headphones, color: '#06b6d4' },
  experiencia: { label: 'Experiencia', icon: Crown, color: '#eab308' },
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">{title}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.includes('pink') ? 'from-pink-100 to-rose-100' : color.includes('emerald') ? 'from-emerald-100 to-green-100' : color.includes('violet') ? 'from-violet-100 to-purple-100' : 'from-amber-100 to-orange-100'} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function PlannerStats({ shifts, cashiers, storeId, currentWeek }) {
  // Calcular estadísticas
  const stats = useMemo(() => {
    const monthStart = startOfMonth(currentWeek);
    const monthEnd = endOfMonth(currentWeek);
    
    const monthShifts = shifts.filter(s => {
      const d = new Date(s.date);
      return d >= monthStart && d <= monthEnd;
    });

    // Horas por colaborador
    const hoursByCashier = cashiers.map(c => {
      const cashierShifts = monthShifts.filter(s => s.cashier_id === c.id);
      const totalHours = cashierShifts.reduce((sum, s) => {
        const [startH, startM] = (s.start_time || '08:00').split(':').map(Number);
        const [endH, endM] = (s.end_time || '16:00').split(':').map(Number);
        return sum + (endH + endM/60) - (startH + startM/60);
      }, 0);
      return { name: c.name?.split(' ')[0] || 'N/A', hours: Math.round(totalHours), fullName: c.name };
    }).sort((a, b) => b.hours - a.hours);

    // Distribución por rol
    const roleDistribution = Object.entries(ROLES_CONFIG).map(([key, config]) => ({
      name: config.label,
      value: monthShifts.filter(s => s.role === key).length,
      color: config.color
    })).filter(r => r.value > 0);

    // Turnos por día de la semana
    const shiftsByDayOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => {
      const dayShifts = monthShifts.filter(s => {
        const d = new Date(s.date);
        return d.getDay() === (idx === 6 ? 0 : idx + 1);
      });
      return { day, turnos: dayShifts.length };
    });

    // Posicionamiento por colaborador (radar)
    const positioningData = cashiers.slice(0, 6).map(c => {
      const cashierShifts = monthShifts.filter(s => s.cashier_id === c.id);
      const positions = {};
      Object.keys(ROLES_CONFIG).forEach(role => {
        positions[role] = cashierShifts.filter(s => s.role === role).length;
      });
      return { name: c.name?.split(' ')[0] || 'N/A', ...positions };
    });

    // Tendencia semanal
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    const weeklyTrend = weeks.map((week, i) => {
      const weekEnd = new Date(week);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekShifts = monthShifts.filter(s => {
        const d = new Date(s.date);
        return d >= week && d <= weekEnd;
      });
      return {
        week: `Sem ${i + 1}`,
        turnos: weekShifts.length,
        horas: weekShifts.reduce((sum, s) => {
          const [startH, startM] = (s.start_time || '08:00').split(':').map(Number);
          const [endH, endM] = (s.end_time || '16:00').split(':').map(Number);
          return sum + (endH + endM/60) - (startH + startM/60);
        }, 0)
      };
    });

    // Top posiciones más asignadas
    const topPositions = Object.entries(ROLES_CONFIG).map(([key, config]) => ({
      role: key,
      label: config.label,
      count: monthShifts.filter(s => s.role === key).length,
      color: config.color,
      icon: config.icon
    })).sort((a, b) => b.count - a.count);

    const totalHours = monthShifts.reduce((sum, s) => {
      const [startH, startM] = (s.start_time || '08:00').split(':').map(Number);
      const [endH, endM] = (s.end_time || '16:00').split(':').map(Number);
      return sum + (endH + endM/60) - (startH + startM/60);
    }, 0);

    return {
      totalShifts: monthShifts.length,
      totalHours: Math.round(totalHours),
      avgHoursPerCashier: cashiers.length ? Math.round(totalHours / cashiers.length) : 0,
      hoursByCashier,
      roleDistribution,
      shiftsByDayOfWeek,
      positioningData,
      weeklyTrend,
      topPositions,
      reactionsCount: monthShifts.filter(s => s.reaction).length
    };
  }, [shifts, cashiers, currentWeek]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Turnos del Mes" value={stats.totalShifts} icon={Calendar} color="text-pink-600" delay={0} />
        <StatCard title="Horas Totales" value={`${stats.totalHours}h`} icon={Clock} color="text-emerald-600" delay={0.1} />
        <StatCard title="Promedio/Colaborador" value={`${stats.avgHoursPerCashier}h`} icon={Users} color="text-violet-600" delay={0.2} />
        <StatCard title="Horarios Confirmados" value={stats.reactionsCount} subtitle="con reacción" icon={Target} color="text-amber-600" delay={0.3} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horas por Colaborador */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-500" />
                Horas por Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hoursByCashier.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                            <p className="font-bold">{payload[0].payload.fullName}</p>
                            <p className="text-pink-600">{payload[0].value} horas</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="hours" radius={[0, 8, 8, 0]}>
                      {stats.hoursByCashier.slice(0, 8).map((entry, index) => (
                        <Cell key={index} fill={index === 0 ? '#ec4899' : index === 1 ? '#f472b6' : '#fbcfe8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribución por Rol */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                Distribución por Posición
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.roleDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {stats.roleDistribution.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-bold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnos por Día */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Turnos por Día de la Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.shiftsByDayOfWeek}>
                    <defs>
                      <linearGradient id="colorTurnos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="turnos" stroke="#10b981" fill="url(#colorTurnos)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tendencia Semanal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Tendencia Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="turnos" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="Turnos" />
                    <Line yAxisId="right" type="monotone" dataKey="horas" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} name="Horas" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Posiciones */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Ranking de Posiciones Más Asignadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
              {stats.topPositions.map((pos, i) => {
                const Icon = pos.icon;
                return (
                  <motion.div
                    key={pos.role}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="bg-gray-50 rounded-xl p-3 text-center relative overflow-hidden"
                  >
                    {i === 0 && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-bold">
                        #1
                      </div>
                    )}
                    <div 
                      className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                      style={{ backgroundColor: `${pos.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: pos.color }} />
                    </div>
                    <p className="text-[10px] font-medium text-gray-600 truncate">{pos.label}</p>
                    <p className="text-lg font-black" style={{ color: pos.color }}>{pos.count}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}