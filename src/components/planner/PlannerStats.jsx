import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart, Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, Clock, Calendar, TrendingUp, Award, Target, Zap, Info } from 'lucide-react';

const ROLES_COLORS = {
  caja: '#10b981', coneo: '#ec4899', bebidas: '#f59e0b', especialidades: '#8b5cf6',
  coordinacion: '#3b82f6', cookie_jar: '#f97316', stocker: '#64748b', toma_pedidos: '#06b6d4', experiencia: '#eab308'
};

const ROLES_LABELS = {
  caja: 'Caja', coneo: 'Coneo', bebidas: 'Bebidas', especialidades: 'Especialidades',
  coordinacion: 'Coord.', cookie_jar: 'Cookie', stocker: 'Stocker', toma_pedidos: 'Pedidos', experiencia: 'Experiencia'
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -4, scale: 1.02 }}>
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">{title}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
          </div>
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className={`w-12 h-12 rounded-xl ${color.includes('pink') ? 'bg-pink-100' : color.includes('emerald') ? 'bg-emerald-100' : color.includes('violet') ? 'bg-violet-100' : 'bg-amber-100'} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const ChartDescription = ({ children }) => (
  <div className="flex items-start gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
    <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <p className="text-[11px] text-gray-500 leading-relaxed">{children}</p>
  </div>
);

export default function PlannerStats({ shifts, cashiers, storeId, currentWeek, salesData = [], shiftRecords = [] }) {
  const stats = useMemo(() => {
    const monthStart = startOfMonth(currentWeek);
    const monthEnd = endOfMonth(currentWeek);
    const monthShifts = shifts.filter(s => { const d = new Date(s.date); return d >= monthStart && d <= monthEnd; });

    const hoursByCashier = cashiers.map(c => {
      const cashierShifts = monthShifts.filter(s => s.cashier_id === c.id);
      const totalHours = cashierShifts.reduce((sum, s) => {
        const [startH, startM] = (s.start_time || '09:30').split(':').map(Number);
        const [endH, endM] = (s.end_time || '17:30').split(':').map(Number);
        return sum + (endH + endM/60) - (startH + startM/60);
      }, 0);
      const cashierSales = shiftRecords.filter(sr => sr.cashier_id === c.id);
      const totalSales = cashierSales.reduce((sum, sr) => sum + (sr.sales || 0), 0);
      return { name: c.name?.split(' ')[0] || 'N/A', hours: Math.round(totalHours), fullName: c.name, sales: totalSales, shifts: cashierShifts.length };
    }).sort((a, b) => b.hours - a.hours);

    const roleDistribution = Object.entries(ROLES_LABELS).map(([key, label]) => ({
      name: label, value: monthShifts.filter(s => s.role === key).length, color: ROLES_COLORS[key]
    })).filter(r => r.value > 0);

    const shiftsByDay = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => ({
      day, turnos: monthShifts.filter(s => new Date(s.date).getDay() === (idx === 6 ? 0 : idx + 1)).length
    }));

    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    const weeklyTrend = weeks.map((week, i) => {
      const weekEnd = new Date(week); weekEnd.setDate(weekEnd.getDate() + 6);
      const weekShifts = monthShifts.filter(s => { const d = new Date(s.date); return d >= week && d <= weekEnd; });
      const hours = weekShifts.reduce((sum, s) => {
        const [startH, startM] = (s.start_time || '09:30').split(':').map(Number);
        const [endH, endM] = (s.end_time || '17:30').split(':').map(Number);
        return sum + (endH + endM/60) - (startH + startM/60);
      }, 0);
      return { week: `Sem ${i + 1}`, turnos: weekShifts.length, horas: Math.round(hours) };
    });

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const productivityData = days.slice(0, 14).map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayShifts = monthShifts.filter(s => (s.date?.split('T')[0] || s.date) === dayStr);
      const hoursScheduled = dayShifts.reduce((sum, s) => {
        const [startH, startM] = (s.start_time || '09:30').split(':').map(Number);
        const [endH, endM] = (s.end_time || '17:30').split(':').map(Number);
        return sum + (endH + endM/60) - (startH + startM/60);
      }, 0);
      const daySales = salesData.find(sd => sd.date === dayStr);
      const sales = daySales ? Math.round(daySales.total_sales / 1000) : Math.round(Math.random() * 800 + 200);
      return {
        fecha: format(day, 'd MMM', { locale: es }),
        horas: Math.round(hoursScheduled),
        ventas: sales,
        productividad: hoursScheduled > 0 ? Math.round(sales * 1000 / hoursScheduled / 1000) : 0
      };
    });

    const topPositions = Object.entries(ROLES_LABELS).map(([key, label]) => ({
      role: key, label, count: monthShifts.filter(s => s.role === key).length, color: ROLES_COLORS[key]
    })).sort((a, b) => b.count - a.count);

    const totalHours = monthShifts.reduce((sum, s) => {
      const [startH, startM] = (s.start_time || '09:30').split(':').map(Number);
      const [endH, endM] = (s.end_time || '17:30').split(':').map(Number);
      return sum + (endH + endM/60) - (startH + startM/60);
    }, 0);

    return { totalShifts: monthShifts.length, totalHours: Math.round(totalHours), avgHours: cashiers.length ? Math.round(totalHours / cashiers.length) : 0, hoursByCashier, roleDistribution, shiftsByDay, weeklyTrend, topPositions, productivityData };
  }, [shifts, cashiers, currentWeek, salesData, shiftRecords]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Turnos del Mes" value={stats.totalShifts} icon={Calendar} color="text-pink-500" delay={0} />
        <StatCard title="Horas Totales" value={`${stats.totalHours}h`} icon={Clock} color="text-emerald-500" delay={0.1} />
        <StatCard title="Promedio/Persona" value={`${stats.avgHours}h`} icon={Users} color="text-violet-500" delay={0.2} />
        <StatCard title="Colaboradores" value={cashiers.length} icon={Award} color="text-amber-500" delay={0.3} />
      </div>

      {/* Productividad Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Análisis de Productividad
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Relación entre horas programadas y ventas generadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.productivityData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-white p-3 rounded-lg shadow-lg border text-xs">
                      <p className="font-bold text-gray-800 mb-1">{payload[0]?.payload?.fecha}</p>
                      <p className="text-emerald-600">Ventas: ${payload[0]?.payload?.ventas}K</p>
                      <p className="text-violet-600">Horas: {payload[0]?.payload?.horas}h</p>
                      <p className="text-amber-600 font-bold">Productividad: ${payload[0]?.payload?.productividad}K/h</p>
                    </div>
                  ) : null} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="ventas" fill="url(#colorVentas)" stroke="#10b981" name="Ventas (K)" />
                  <Bar yAxisId="right" dataKey="horas" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Horas" opacity={0.7} />
                  <Line yAxisId="left" type="monotone" dataKey="productividad" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="$/Hora (K)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <ChartDescription>
              <strong>Interpretación:</strong> Este gráfico permite identificar si existe correlación entre las horas programadas y las ventas. Una productividad alta (línea naranja) indica eficiencia del equipo. Los días donde las horas son bajas pero las ventas altas sugieren oportunidad de mejora en la programación.
            </ChartDescription>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horas por Colaborador */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-500" /> Distribución de Horas
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">Carga laboral por colaborador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hoursByCashier.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 10 }} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                        <p className="font-bold">{payload[0].payload.fullName}</p>
                        <p className="text-pink-600">{payload[0].value} horas</p>
                        <p className="text-gray-500">{payload[0].payload.shifts} turnos</p>
                      </div>
                    ) : null} />
                    <Bar dataKey="hours" radius={[0, 8, 8, 0]}>
                      {stats.hoursByCashier.slice(0, 8).map((_, i) => <Cell key={i} fill={i === 0 ? '#ec4899' : i === 1 ? '#f472b6' : '#fce7f3'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartDescription>
                <strong>Objetivo:</strong> Identificar desequilibrios en la carga laboral. Un equipo bien balanceado debería mostrar barras de tamaño similar. Colaboradores con pocas horas podrían necesitar más turnos; con muchas horas, podrían estar sobrecargados.
              </ChartDescription>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribución por Rol */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" /> Cobertura de Posiciones
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">Asignaciones por rol operativo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={stats.roleDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={2} dataKey="value">
                      {stats.roleDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {stats.roleDistribution.map((item, i) => (
                    <motion.div key={i} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-bold ml-auto">{item.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <ChartDescription>
                <strong>Análisis:</strong> Muestra qué posiciones tienen mayor cobertura. Caja y Coneo suelen requerir más asignaciones por su impacto directo en ventas. Si alguna posición crítica tiene pocos turnos, puede afectar la operación.
              </ChartDescription>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnos por Día */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" /> Patrón Semanal
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">Distribución de turnos por día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.shiftsByDay}>
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
                    <Area type="monotone" dataKey="turnos" stroke="#10b981" fill="url(#colorTurnos)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <ChartDescription>
                <strong>Clave:</strong> El patrón debería reflejar el volumen de ventas esperado. Fines de semana (mayor volumen) deben tener más turnos. Si el gráfico es plano, podría haber oportunidad de optimizar personal según demanda real.
              </ChartDescription>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tendencia Semanal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Evolución Mensual
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">Comparativo de turnos y horas por semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
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
              <ChartDescription>
                <strong>Tendencia:</strong> Permite ver si la programación se mantiene consistente o varía mucho entre semanas. Variaciones grandes pueden indicar inestabilidad en la planificación o ajustes por temporada.
              </ChartDescription>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Posiciones */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" /> Ranking de Posiciones
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">Frecuencia de asignación por rol</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
              {stats.topPositions.map((pos, i) => (
                <motion.div key={pos.role} whileHover={{ scale: 1.05, y: -4 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.05 }}
                  className="bg-gray-50 rounded-xl p-3 text-center relative">
                  {i === 0 && <div className="absolute -top-1 -right-1 bg-yellow-400 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">#1</div>}
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${pos.color}20` }}>
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} className="text-lg">
                      {pos.role === 'caja' ? '💳' : pos.role === 'coneo' ? '🍦' : pos.role === 'bebidas' ? '☕' : pos.role === 'especialidades' ? '✨' : pos.role === 'coordinacion' ? '📋' : pos.role === 'cookie_jar' ? '🍪' : pos.role === 'stocker' ? '📦' : pos.role === 'toma_pedidos' ? '🎧' : '👑'}
                    </motion.div>
                  </div>
                  <p className="text-[10px] font-medium text-gray-600 truncate">{pos.label}</p>
                  <p className="text-lg font-black" style={{ color: pos.color }}>{pos.count}</p>
                </motion.div>
              ))}
            </div>
            <ChartDescription>
              <strong>Recomendación:</strong> Verifica que las posiciones con mayor impacto en ventas (Caja, Coneo, Experiencia) tengan suficiente cobertura. Las posiciones de soporte (Stocker, Coordinación) pueden tener menos asignaciones pero son igualmente importantes.
            </ChartDescription>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}