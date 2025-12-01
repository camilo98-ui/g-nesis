import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, differenceInHours, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Users, TrendingUp, Calendar, Award, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'];

export default function PlannerStats({ shifts, cashiers, storeId, currentWeek }) {
  const stats = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    
    const monthShifts = shifts.filter(s => {
      const d = new Date(s.date);
      return d >= monthStart && d <= monthEnd;
    });

    // Hours per cashier
    const hoursPerCashier = cashiers.map(c => {
      const cashierShifts = monthShifts.filter(s => s.cashier_id === c.id);
      let totalHours = 0;
      cashierShifts.forEach(s => {
        if (s.start_time && s.end_time) {
          const [sh, sm] = s.start_time.split(':').map(Number);
          const [eh, em] = s.end_time.split(':').map(Number);
          totalHours += (eh + em/60) - (sh + sm/60);
        }
      });
      return {
        name: c.name?.split(' ')[0] || 'N/A',
        fullName: c.name,
        hours: Math.round(totalHours),
        shifts: cashierShifts.length,
        id: c.id
      };
    }).sort((a, b) => b.hours - a.hours);

    // Role distribution
    const roleCount = {};
    monthShifts.forEach(s => {
      roleCount[s.role] = (roleCount[s.role] || 0) + 1;
    });
    const roleDistribution = Object.entries(roleCount).map(([role, count]) => ({
      name: role === 'ventas' ? 'Ventas' : role === 'limpieza' ? 'Limpieza' : role === 'administrador' ? 'Admin' : role === 'apoyo' ? 'Apoyo' : 'Entreno',
      value: count
    }));

    // Total hours
    let totalHours = 0;
    monthShifts.forEach(s => {
      if (s.start_time && s.end_time) {
        const [sh, sm] = s.start_time.split(':').map(Number);
        const [eh, em] = s.end_time.split(':').map(Number);
        totalHours += (eh + em/60) - (sh + sm/60);
      }
    });

    // Attendance rate
    const completed = monthShifts.filter(s => s.status === 'completed' || s.check_in).length;
    const attendanceRate = monthShifts.length > 0 ? (completed / monthShifts.length) * 100 : 0;

    // Estimated labor cost (8 hrs avg, min wage estimate)
    const hourlyRate = 7000; // COP aproximado
    const laborCost = totalHours * hourlyRate;

    return {
      totalShifts: monthShifts.length,
      totalHours: Math.round(totalHours),
      hoursPerCashier,
      roleDistribution,
      attendanceRate,
      laborCost,
      avgHoursPerPerson: cashiers.length > 0 ? Math.round(totalHours / cashiers.length) : 0
    };
  }, [shifts, cashiers]);

  const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={`bg-gradient-to-br ${color} rounded-2xl p-4 shadow-sm`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-600">{label}</p>
          {subValue && <p className="text-[10px] text-gray-500">{subValue}</p>}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Calendar} 
          label="Turnos del mes" 
          value={stats.totalShifts}
          color="from-pink-50 to-rose-100"
        />
        <StatCard 
          icon={Clock} 
          label="Horas totales" 
          value={`${stats.totalHours}h`}
          subValue={`~${stats.avgHoursPerPerson}h por persona`}
          color="from-violet-50 to-purple-100"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Asistencia" 
          value={`${stats.attendanceRate.toFixed(0)}%`}
          color="from-emerald-50 to-teal-100"
        />
        <StatCard 
          icon={DollarSign} 
          label="Costo estimado" 
          value={`$${(stats.laborCost / 1000000).toFixed(1)}M`}
          subValue="Mano de obra mensual"
          color="from-amber-50 to-yellow-100"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hours per Cashier */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-500" />
              Horas por Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hoursPerCashier.slice(0, 8)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border text-xs">
                          <p className="font-bold text-gray-800">{data.fullName}</p>
                          <p className="text-gray-500">{data.hours} horas • {data.shifts} turnos</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {stats.hoursPerCashier.slice(0, 8).map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-500" />
              Distribución por Rol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.roleDistribution.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {stats.roleDistribution.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-bold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Colaboradores con más horas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.hoursPerCashier.slice(0, 5).map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 text-center"
              >
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white font-bold mb-2 ${
                  idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-300'
                }`}>
                  {idx + 1}
                </div>
                <p className="font-medium text-gray-800 text-sm truncate">{c.name}</p>
                <p className="text-xs text-gray-500">{c.hours}h • {c.shifts} turnos</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}