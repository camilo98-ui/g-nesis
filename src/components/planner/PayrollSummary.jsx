import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Moon, Sun, Calendar, Download, Filter, TrendingUp, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isWeekend, isSunday, differenceInMinutes, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import DateFilter from '@/components/DateFilter';

// Días festivos Colombia 2025
const HOLIDAYS_2025 = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25'
];

const SALARY_PER_HOUR = 6000; // Salario base por hora en Colombia

// Cálculos según legislación laboral Colombia
const calculatePayroll = (shifts, cashiers, dateRange) => {
  const payrollData = {};
  const weeklyHours = {}; // Rastrear horas por semana

  shifts.forEach(shift => {
    if (!shift.cashier_id || !shift.start_time || !shift.end_time) return;

    const shiftDate = shift.date?.split('T')[0] || shift.date;
    
    // Filtrar por rango de fechas
    if (dateRange?.from && dateRange?.to) {
      const from = format(dateRange.from, 'yyyy-MM-dd');
      const to = format(dateRange.to, 'yyyy-MM-dd');
      if (shiftDate < from || shiftDate > to) return;
    }

    const cashier = cashiers.find(c => c.id === shift.cashier_id);
    if (!cashier) return;

    if (!payrollData[shift.cashier_id]) {
      payrollData[shift.cashier_id] = {
        cashier_name: shift.cashier_name || cashier.name,
        position: cashier.position || 'cajero',
        total_hours: 0,
        regular_hours: 0,
        night_hours: 0,
        overtime_hours: 0,
        sunday_hours: 0,
        holiday_hours: 0,
        regular_pay: 0,
        night_surcharge: 0,
        overtime_pay: 0,
        sunday_pay: 0,
        holiday_pay: 0,
        total_pay: 0,
        shifts_count: 0,
        exceeds_weekly_limit: false,
        weekly_hours_breakdown: {}
      };
    }

    const data = payrollData[shift.cashier_id];
    data.shifts_count++;

    // Calcular horas trabajadas
    const startTime = parse(shift.start_time, 'HH:mm', new Date());
    const endTime = parse(shift.end_time, 'HH:mm', new Date());
    let totalMinutes = differenceInMinutes(endTime, startTime);
    
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Turno que cruza medianoche
    
    const totalHours = totalMinutes / 60;
    data.total_hours += totalHours;

    // Rastrear horas por semana (semana empieza lunes)
    const weekStart = format(startOfWeek(parseISO(shiftDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (!weeklyHours[shift.cashier_id]) weeklyHours[shift.cashier_id] = {};
    if (!weeklyHours[shift.cashier_id][weekStart]) weeklyHours[shift.cashier_id][weekStart] = 0;
    weeklyHours[shift.cashier_id][weekStart] += totalHours;
    
    if (!data.weekly_hours_breakdown[weekStart]) data.weekly_hours_breakdown[weekStart] = 0;
    data.weekly_hours_breakdown[weekStart] += totalHours;

    // Verificar si es domingo o festivo
    const isHoliday = HOLIDAYS_2025.includes(shiftDate);
    const isSundayShift = isSunday(parseISO(shiftDate));

    // Horas nocturnas (21:00 - 06:00) = Recargo 35%
    const nightStart = 21;
    const nightEnd = 6;
    let nightHours = 0;

    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;

    if (startHour >= nightStart || startHour < nightEnd) {
      if (endHour >= nightStart || endHour < nightEnd) {
        nightHours = totalHours;
      } else {
        nightHours = (endHour < nightEnd ? endHour : 24 - startHour);
      }
    } else if (endHour >= nightStart || endHour < nightEnd) {
      nightHours = (endHour < nightEnd ? endHour + (24 - nightStart) : endHour - nightStart);
    }

    data.night_hours += nightHours;

    // Horas extras diarias (más de 8 horas) o semanales (más de 44 horas)
    const dailyOvertimeThreshold = 8;
    let dailyOvertime = 0;
    
    if (totalHours > dailyOvertimeThreshold) {
      dailyOvertime = totalHours - dailyOvertimeThreshold;
      data.regular_hours += dailyOvertimeThreshold;
    } else {
      data.regular_hours += totalHours;
    }
    
    data.overtime_hours += dailyOvertime;

    // Dominicales = Recargo 75%
    if (isSundayShift) {
      data.sunday_hours += totalHours;
    }

    // Festivos = Recargo 75%
    if (isHoliday) {
      data.holiday_hours += totalHours;
    }

    // Cálculos de pago
    const baseHourlyPay = SALARY_PER_HOUR;
    
    // Pago regular
    data.regular_pay += (totalHours - nightHours) * baseHourlyPay;

    // Recargo nocturno (35% adicional)
    data.night_surcharge += nightHours * baseHourlyPay * 0.35;

    // Horas extras (25% adicional)
    if (totalHours > overtimeThreshold) {
      const overtimeHours = totalHours - overtimeThreshold;
      data.overtime_pay += overtimeHours * baseHourlyPay * 0.25;
    }

    // Dominicales (75% adicional)
    if (isSundayShift) {
      data.sunday_pay += totalHours * baseHourlyPay * 0.75;
    }

    // Festivos (75% adicional)
    if (isHoliday) {
      data.holiday_pay += totalHours * baseHourlyPay * 0.75;
    }

    // Total
    data.total_pay = 
      data.regular_pay + 
      data.night_surcharge + 
      data.overtime_pay + 
      data.sunday_pay + 
      data.holiday_pay;
  });

  // Segundo paso: calcular horas extras por exceso semanal (más de 44h/semana)
  Object.keys(payrollData).forEach(cashierId => {
    const data = payrollData[cashierId];
    const cashierWeeklyHours = weeklyHours[cashierId] || {};
    
    Object.entries(cashierWeeklyHours).forEach(([week, hours]) => {
      const WEEKLY_LIMIT = 44;
      if (hours > WEEKLY_LIMIT) {
        data.exceeds_weekly_limit = true;
        const weeklyOvertime = hours - WEEKLY_LIMIT;
        data.overtime_hours += weeklyOvertime;
        data.overtime_pay += weeklyOvertime * SALARY_PER_HOUR * 0.25;
        data.total_pay += weeklyOvertime * SALARY_PER_HOUR * 0.25;
      }
    });
  });

  return Object.values(payrollData);
};

export default function PayrollSummary({ shifts, cashiers, storeId }) {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const payrollData = useMemo(() => {
    return calculatePayroll(shifts, cashiers, dateRange);
  }, [shifts, cashiers, dateRange]);

  const totals = useMemo(() => {
    return payrollData.reduce((acc, curr) => ({
      total_hours: acc.total_hours + curr.total_hours,
      night_hours: acc.night_hours + curr.night_hours,
      overtime_hours: acc.overtime_hours + curr.overtime_hours,
      sunday_hours: acc.sunday_hours + curr.sunday_hours,
      holiday_hours: acc.holiday_hours + curr.holiday_hours,
      total_pay: acc.total_pay + curr.total_pay,
      night_surcharge: acc.night_surcharge + curr.night_surcharge,
      overtime_pay: acc.overtime_pay + curr.overtime_pay,
      sunday_pay: acc.sunday_pay + curr.sunday_pay,
      holiday_pay: acc.holiday_pay + curr.holiday_pay,
      shifts_count: acc.shifts_count + curr.shifts_count
    }), {
      total_hours: 0,
      night_hours: 0,
      overtime_hours: 0,
      sunday_hours: 0,
      holiday_hours: 0,
      total_pay: 0,
      night_surcharge: 0,
      overtime_pay: 0,
      sunday_pay: 0,
      holiday_pay: 0,
      shifts_count: 0
    });
  }, [payrollData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ['Colaborador', 'Cargo', 'Turnos', 'Horas Totales', 'H. Nocturnas', 'H. Extras', 'H. Dominicales', 'H. Festivos', 'Pago Base', 'Recargo Nocturno', 'Pago H. Extras', 'Pago Dominical', 'Pago Festivo', 'Total a Pagar'];
    const rows = payrollData.map(d => [
      d.cashier_name,
      d.position,
      d.shifts_count,
      d.total_hours.toFixed(2),
      d.night_hours.toFixed(2),
      d.overtime_hours.toFixed(2),
      d.sunday_hours.toFixed(2),
      d.holiday_hours.toFixed(2),
      d.regular_pay.toFixed(0),
      d.night_surcharge.toFixed(0),
      d.overtime_pay.toFixed(0),
      d.sunday_pay.toFixed(0),
      d.holiday_pay.toFixed(0),
      d.total_pay.toFixed(0)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nomina_${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <Card className="border-violet-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">Resumen de Nómina</CardTitle>
                <p className="text-sm text-gray-500">Cálculo automático de recargos y extras</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
              <Button onClick={exportToCSV} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tarjetas de resumen total */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <p className="text-xs font-medium opacity-90">Colaboradores</p>
          </div>
          <p className="text-2xl font-bold">{payrollData.length}</p>
          <p className="text-xs opacity-75">{totals.shifts_count} turnos</p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <p className="text-xs font-medium opacity-90">Horas Totales</p>
          </div>
          <p className="text-2xl font-bold">{totals.total_hours.toFixed(1)}h</p>
          <p className="text-xs opacity-75">Regulares + Extras</p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-5 h-5" />
            <p className="text-xs font-medium opacity-90">H. Nocturnas</p>
          </div>
          <p className="text-2xl font-bold">{totals.night_hours.toFixed(1)}h</p>
          <p className="text-xs opacity-75">Recargo +35%</p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <p className="text-xs font-medium opacity-90">Total Nómina</p>
          </div>
          <p className="text-xl font-bold">{formatCurrency(totals.total_pay)}</p>
          <p className="text-xs opacity-75">Incluye recargos</p>
        </motion.div>
      </div>

      {/* Desglose por tipo de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-500" />
            Desglose Total de Nómina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Pago Base</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(totals.total_pay - totals.night_surcharge - totals.overtime_pay - totals.sunday_pay - totals.holiday_pay)}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <p className="text-xs text-indigo-600 mb-1">Recargo Nocturno</p>
              <p className="text-lg font-bold text-indigo-700">{formatCurrency(totals.night_surcharge)}</p>
              <p className="text-xs text-indigo-500">{totals.night_hours.toFixed(1)}h × 35%</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 mb-1">Horas Extras</p>
              <p className="text-lg font-bold text-amber-700">{formatCurrency(totals.overtime_pay)}</p>
              <p className="text-xs text-amber-500">{totals.overtime_hours.toFixed(1)}h × 25%</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Dominicales</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(totals.sunday_pay)}</p>
              <p className="text-xs text-blue-500">{totals.sunday_hours.toFixed(1)}h × 75%</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg">
              <p className="text-xs text-rose-600 mb-1">Festivos</p>
              <p className="text-lg font-bold text-rose-700">{formatCurrency(totals.holiday_pay)}</p>
              <p className="text-xs text-rose-500">{totals.holiday_hours.toFixed(1)}h × 75%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla detallada por colaborador */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Colaborador</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Colaborador</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cargo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Turnos</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">H. Totales</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">H. Nocturnas</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">H. Extras</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Dominical</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Festivo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payrollData.sort((a, b) => b.total_pay - a.total_pay).map((data, idx) => (
                  <motion.tr 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`hover:bg-violet-50/50 transition-colors ${data.exceeds_weekly_limit ? 'bg-amber-50/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 text-sm">{data.cashier_name}</p>
                        {data.exceeds_weekly_limit && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                            ⚠️ +44h/sem
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {data.position === 'lider' && '👑 Líder'}
                        {data.position === 'embajador' && '💫 Embajador'}
                        {data.position === 'cajero' && '🍦 Cajero'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{data.shifts_count}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-800">{data.total_hours.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-center">
                      {data.night_hours > 0 ? (
                        <span className="text-sm font-medium text-indigo-600">{data.night_hours.toFixed(1)}h</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {data.overtime_hours > 0 ? (
                        <span className="text-sm font-medium text-amber-600">{data.overtime_hours.toFixed(1)}h</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {data.sunday_hours > 0 ? (
                        <span className="text-sm font-medium text-blue-600">{data.sunday_hours.toFixed(1)}h</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {data.holiday_hours > 0 ? (
                        <span className="text-sm font-medium text-rose-600">{data.holiday_hours.toFixed(1)}h</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(data.total_pay)}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot className="bg-violet-50 border-t-2 border-violet-200">
                <tr>
                  <td colSpan="2" className="px-4 py-3 font-bold text-gray-800">TOTAL TIENDA</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">{totals.shifts_count}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">{totals.total_hours.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-700">{totals.night_hours.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-center font-bold text-amber-700">{totals.overtime_hours.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-700">{totals.sunday_hours.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-center font-bold text-rose-700">{totals.holiday_hours.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 text-lg">{formatCurrency(totals.total_pay)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de cumplimiento legal */}
      {payrollData.some(d => d.exceeds_weekly_limit) && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <p className="font-bold text-red-800 mb-1">Alerta: Límite Semanal Excedido</p>
                <p className="text-sm text-red-700">
                  Algunos colaboradores superan las <strong>44 horas semanales</strong> permitidas por ley. 
                  Las horas adicionales se calculan como extras (+25%), pero se recomienda ajustar la programación 
                  para cumplir con la jornada legal máxima.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nota legal */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <p className="text-xs text-amber-800">
            <strong>⚠️ Nota Legal:</strong> Cálculo basado en legislación colombiana vigente con límite de <strong>44 horas semanales</strong>. 
            Salario base {formatCurrency(SALARY_PER_HOUR)}/hora, recargo nocturno 35% (21:00-06:00), 
            horas extras 25% (más de 8h diarias o 44h semanales), dominicales y festivos 75%. 
            Verifica con tu contador para cálculos oficiales y deducciones de ley.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}