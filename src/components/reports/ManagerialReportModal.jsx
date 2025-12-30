import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Loader2, X, BarChart3, Users, TrendingUp, Store, Calendar as CalendarIcon, Target, Award, ArrowUp, ArrowDown, Activity, DollarSign, Zap, AlertCircle, TrendingDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek, subMonths, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';

export default function ManagerialReportModal({ storeId, storeName, storeCode, onClose }) {
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = new Date();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(today),
    to: today
  });

  // Fetch data
  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', storeId],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId }, '-date', 31),
    enabled: !!storeId
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }, '-date', 100),
    enabled: !!storeId
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', storeId],
    queryFn: () => base44.entities.Budget.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Calculate advanced metrics
  const metrics = useMemo(() => {
    const currentPeriodSales = dailySales.filter(s => {
      const saleDate = new Date(s.date);
      return dateRange.from && dateRange.to && saleDate >= dateRange.from && saleDate <= dateRange.to;
    });

    // Previous period comparison
    const daysInPeriod = differenceInDays(dateRange.to, dateRange.from) + 1;
    const previousPeriodEnd = subDays(dateRange.from, 1);
    const previousPeriodStart = subDays(previousPeriodEnd, daysInPeriod - 1);
    
    const previousPeriodSales = dailySales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= previousPeriodStart && saleDate <= previousPeriodEnd;
    });

    const totalSales = currentPeriodSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const totalTickets = currentPeriodSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
    const totalTransactions = currentPeriodSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
    const totalSuggested = currentPeriodSales.reduce((sum, s) => sum + (s.total_suggested || 0), 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    const prevTotalSales = previousPeriodSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const prevTotalTransactions = previousPeriodSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
    const prevAvgTicket = prevTotalTransactions > 0 ? prevTotalSales / prevTotalTransactions : 0;

    const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
    const transGrowth = prevTotalTransactions > 0 ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100 : 0;
    const ticketGrowth = prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0;

    const currentBudget = budgets.find(b => 
      b.month === today.getMonth() + 1 && b.year === today.getFullYear()
    );
    const budgetAmount = currentBudget?.sales_budget || 0;
    const compliance = budgetAmount > 0 ? (totalSales / budgetAmount) * 100 : 0;
    const budgetGap = budgetAmount - totalSales;
    const dailyNeeded = budgetGap > 0 ? budgetGap / Math.max(1, daysInPeriod - currentPeriodSales.length) : 0;

    // Trend analysis
    const dailyTrend = currentPeriodSales
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => ({
        date: s.date,
        sales: s.total_sales,
        transactions: s.total_transactions,
        avgTicket: s.total_transactions > 0 ? s.total_sales / s.total_transactions : 0,
        suggested: s.total_suggested
      }));

    // Performance score
    const complianceScore = Math.min(compliance / 100, 1) * 30;
    const growthScore = Math.min(Math.max(salesGrowth / 10, -1), 1) * 30 + 15;
    const ticketScore = Math.min(Math.max(ticketGrowth / 5, -1), 1) * 20 + 10;
    const suggestedScore = totalTransactions > 0 ? Math.min((totalSuggested / totalTransactions) * 100, 25) : 0;
    const performanceScore = complianceScore + growthScore + ticketScore + suggestedScore;

    return {
      totalSales,
      totalTickets,
      totalTransactions,
      totalSuggested,
      avgTicket,
      budgetAmount,
      compliance,
      budgetGap,
      dailyNeeded,
      daysCount: currentPeriodSales.length,
      dailyTrend,
      prevTotalSales,
      prevTotalTransactions,
      prevAvgTicket,
      salesGrowth,
      transGrowth,
      ticketGrowth,
      performanceScore: Math.round(performanceScore),
      suggestedRate: totalTransactions > 0 ? (totalSuggested / totalTransactions) * 100 : 0
    };
  }, [dailySales, budgets, dateRange, today]);

  // Cashier performance
  const cashierPerformance = useMemo(() => {
    return cashiers.map(cashier => {
      const cashierShifts = shiftRecords.filter(sr => sr.cashier_id === cashier.id);
      const cashierSales = cashierShifts.reduce((sum, s) => sum + (s.sales || 0), 0);
      const cashierTickets = cashierShifts.reduce((sum, s) => sum + (s.tickets || 0), 0);
      const cashierTransactions = cashierShifts.reduce((sum, s) => sum + (s.transactions || 0), 0);
      const cashierAvgTicket = cashierTransactions > 0 ? cashierSales / cashierTransactions : 0;
      return {
        id: cashier.id,
        name: cashier.name,
        sales: cashierSales,
        tickets: cashierTickets,
        avgTicket: cashierAvgTicket,
        shifts: cashierShifts.length
      };
    }).sort((a, b) => b.sales - a.sales);
  }, [cashiers, shiftRecords]);

  const formatCurrency = (val) => `$${(val || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

  const generateAIInsights = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un analista financiero senior. Genera un informe ejecutivo profesional y cuantitativo para ${storeCode} - ${storeName}:

ANÁLISIS FINANCIERO:
- Venta: ${formatCurrency(metrics.totalSales)} (${metrics.salesGrowth >= 0 ? '+' : ''}${metrics.salesGrowth.toFixed(1)}% vs período anterior)
- Presupuesto: ${formatCurrency(metrics.budgetAmount)} | Cumplimiento: ${metrics.compliance.toFixed(1)}%
- Gap presupuestal: ${formatCurrency(metrics.budgetGap)} | Necesidad diaria: ${formatCurrency(metrics.dailyNeeded)}
- Ticket promedio: ${formatCurrency(metrics.avgTicket)} (${metrics.ticketGrowth >= 0 ? '+' : ''}${metrics.ticketGrowth.toFixed(1)}%)
- Transacciones: ${metrics.totalTransactions} (${metrics.transGrowth >= 0 ? '+' : ''}${metrics.transGrowth.toFixed(1)}%)
- Tasa de sugeridos: ${metrics.suggestedRate.toFixed(1)}%
- Score de desempeño: ${metrics.performanceScore}/100

TOP CAJEROS:
${cashierPerformance.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}: ${formatCurrency(c.sales)} (${c.shifts} turnos, ${formatCurrency(c.avgTicket)} ticket prom.)`).join('\n')}

Genera JSON con:
1. resumen_ejecutivo: Análisis de 3-4 líneas con enfoque en números y proyecciones
2. kpis_criticos: Array de 4 objetos {metrica, valor_actual, objetivo, accion_numerica}
3. proyecciones: Objeto con {ventas_proyectadas_mes, probabilidad_cumplimiento, dias_restantes, venta_diaria_requerida}
4. plan_accion: Array de 5 acciones específicas con metas numéricas
5. alertas_riesgo: Array de 3 riesgos cuantificables
6. oportunidades: Array de 3 oportunidades con impacto numérico estimado`,
        response_json_schema: {
          type: "object",
          properties: {
            resumen_ejecutivo: { type: "string" },
            kpis_criticos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  metrica: { type: "string" },
                  valor_actual: { type: "string" },
                  objetivo: { type: "string" },
                  accion_numerica: { type: "string" }
                }
              }
            },
            proyecciones: {
              type: "object",
              properties: {
                ventas_proyectadas_mes: { type: "string" },
                probabilidad_cumplimiento: { type: "string" },
                dias_restantes: { type: "number" },
                venta_diaria_requerida: { type: "string" }
              }
            },
            plan_accion: {
              type: "array",
              items: { type: "string" }
            },
            alertas_riesgo: {
              type: "array",
              items: { type: "string" }
            },
            oportunidades: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      setAiInsights(response);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    // Generate SVG charts
    const maxSales = Math.max(...metrics.dailyTrend.map(d => d.total_sales || 0), 1);
    const chartWidth = 500;
    const barWidth = Math.min(30, (chartWidth - 40) / Math.max(metrics.dailyTrend.length, 1));
    
    const salesChartBars = metrics.dailyTrend.map((d, i) => {
      const height = ((d.total_sales || 0) / maxSales) * 140;
      const x = 20 + i * (barWidth + 5);
      return `
        <rect x="${x}" y="${160 - height}" width="${barWidth}" height="${height}" fill="#ec4899" rx="4" opacity="0.85"/>
        <text x="${x + barWidth/2}" y="175" text-anchor="middle" font-size="9" fill="#666">${format(new Date(d.date), 'dd')}</text>
      `;
    }).join('');

    // Cashier horizontal bars
    const topCashiers = cashierPerformance.slice(0, 5);
    const maxCashierSales = Math.max(...topCashiers.map(c => c.sales || 0), 1);
    const cashierBars = topCashiers.map((c, i) => {
      const width = ((c.sales || 0) / maxCashierSales) * 280;
      const y = 25 + i * 40;
      const colors = ['#ec4899', '#f472b6', '#fb7185', '#fda4af', '#fecdd3'];
      return `
        <text x="5" y="${y + 18}" font-size="11" fill="#333" font-weight="500">${(c.name || 'N/A').substring(0, 15)}</text>
        <rect x="120" y="${y + 2}" width="${width}" height="26" fill="${colors[i]}" rx="4"/>
        <text x="${130 + width}" y="${y + 20}" font-size="10" fill="#666">${formatCurrency(c.sales)}</text>
      `;
    }).join('');

    // Ticket promedio trend
    const ticketData = metrics.dailyTrend.map(d => ({
      date: d.date,
      ticket: d.total_transactions > 0 ? d.total_sales / d.total_transactions : 0
    }));
    const maxTicket = Math.max(...ticketData.map(d => d.ticket), 1);
    const ticketPoints = ticketData.map((d, i) => {
      const x = 30 + i * ((chartWidth - 60) / Math.max(ticketData.length - 1, 1));
      const y = 140 - ((d.ticket / maxTicket) * 120);
      return `${x},${y}`;
    }).join(' ');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Informe Gerencial ${storeCode} - ${format(today, 'MMMM yyyy', { locale: es })}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', -apple-system, Arial, sans-serif; 
      padding: 0; 
      margin: 0;
      color: #1f2937; 
      font-size: 11px;
      line-height: 1.4;
    }
    .page { max-width: 210mm; margin: 0 auto; }
    
    .header { 
      background: linear-gradient(135deg, #ec4899, #f43f5e);
      color: white;
      padding: 20px 25px;
      border-radius: 0 0 20px 20px;
      margin-bottom: 20px;
    }
    .header-top { display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 28px; font-weight: bold; }
    .store-info { text-align: right; }
    .store-name { font-size: 16px; font-weight: 600; }
    .store-date { opacity: 0.85; font-size: 12px; }
    
    .metrics-row { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 12px; 
      margin-bottom: 20px;
      padding: 0 10px;
    }
    .metric-card { 
      background: linear-gradient(135deg, #fdf2f8, #fce7f3);
      border-radius: 12px; 
      padding: 14px; 
      text-align: center;
      border: 1px solid #fbcfe8;
    }
    .metric-value { font-size: 20px; font-weight: 700; color: #be185d; }
    .metric-label { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .metric-sub { font-size: 9px; color: #9ca3af; margin-top: 2px; }
    
    .compliance-card {
      background: ${metrics.compliance >= 100 ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : metrics.compliance >= 80 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #fee2e2, #fecaca)'};
      border-color: ${metrics.compliance >= 100 ? '#86efac' : metrics.compliance >= 80 ? '#fcd34d' : '#fca5a5'};
    }
    .compliance-card .metric-value {
      color: ${metrics.compliance >= 100 ? '#15803d' : metrics.compliance >= 80 ? '#a16207' : '#dc2626'};
    }
    
    .section { 
      background: white;
      border-radius: 12px; 
      padding: 15px;
      margin: 0 10px 15px 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid #f3f4f6;
    }
    .section-title { 
      font-size: 13px;
      font-weight: 600; 
      color: #374151;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid #fce7f3;
      padding-bottom: 8px;
    }
    
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .chart-container { 
      background: #fafafa; 
      border-radius: 10px; 
      padding: 12px;
      border: 1px solid #f3f4f6;
    }
    .chart-title { font-size: 11px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
    
    .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .insight-card { 
      background: #f9fafb;
      border-radius: 10px; 
      padding: 12px;
      border-left: 4px solid #ec4899;
    }
    .insight-card.green { border-left-color: #22c55e; background: #f0fdf4; }
    .insight-card.amber { border-left-color: #f59e0b; background: #fffbeb; }
    .insight-card.blue { border-left-color: #3b82f6; background: #eff6ff; }
    .insight-title { font-weight: 600; font-size: 11px; color: #374151; margin-bottom: 8px; }
    .insight-list { margin: 0; padding-left: 16px; font-size: 10px; line-height: 1.6; color: #4b5563; }
    .insight-list li { margin-bottom: 4px; }
    
    .resumen-box { 
      background: linear-gradient(135deg, #fef3c7, #fef9c3);
      border-radius: 10px; 
      padding: 14px;
      margin-bottom: 15px;
      border: 1px solid #fde68a;
    }
    .resumen-box p { margin: 0; font-size: 11px; line-height: 1.6; color: #92400e; }
    
    .footer { 
      text-align: center; 
      color: #9ca3af; 
      font-size: 9px; 
      padding: 15px;
      border-top: 1px solid #f3f4f6;
      margin-top: 10px;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <div class="logo">🍦 POPSY</div>
        <div class="store-info">
          <div class="store-name">${storeCode} - ${storeName || 'Tienda'}</div>
          <div class="store-date">Informe Gerencial • ${format(dateRange.from, "dd MMM", { locale: es })} - ${format(dateRange.to, "dd MMM yyyy", { locale: es })}</div>
        </div>
      </div>
    </div>

    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-value">${formatCurrency(metrics.totalSales)}</div>
        <div class="metric-label">Venta del Mes</div>
        <div class="metric-sub">${metrics.daysCount} días</div>
      </div>
      <div class="metric-card compliance-card">
        <div class="metric-value">${metrics.compliance.toFixed(1)}%</div>
        <div class="metric-label">Cumplimiento</div>
        <div class="metric-sub">Meta: ${formatCurrency(metrics.budgetAmount)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${formatCurrency(metrics.avgTicket)}</div>
        <div class="metric-label">Ticket Promedio</div>
        <div class="metric-sub">${metrics.totalTransactions.toLocaleString()} trans.</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.totalSuggested.toLocaleString()}</div>
        <div class="metric-label">Sugeridos</div>
        <div class="metric-sub">${metrics.totalTransactions > 0 ? ((metrics.totalSuggested / metrics.totalTransactions) * 100).toFixed(0) : 0}% conversión</div>
      </div>
    </div>

    ${aiInsights ? `
    <div class="section">
      <div class="resumen-box">
        <p><strong>📋 Resumen Ejecutivo:</strong> ${aiInsights.resumen}</p>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">📈 Tendencia de Ventas Diarias</div>
      <div class="chart-container">
        <svg width="100%" height="190" viewBox="0 0 ${chartWidth} 190" preserveAspectRatio="xMidYMid meet">
          <line x1="20" y1="160" x2="${chartWidth - 20}" y2="160" stroke="#e5e7eb" stroke-width="1"/>
          <line x1="20" y1="90" x2="${chartWidth - 20}" y2="90" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4"/>
          <line x1="20" y1="30" x2="${chartWidth - 20}" y2="30" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4"/>
          <text x="5" y="163" font-size="8" fill="#9ca3af">$0</text>
          <text x="5" y="33" font-size="8" fill="#9ca3af">${formatCurrency(maxSales)}</text>
          ${salesChartBars}
        </svg>
      </div>
    </div>

    <div class="charts-row" style="padding: 0 10px;">
      <div class="section" style="margin: 0;">
        <div class="section-title">👥 Top Cajeros del Mes</div>
        <div class="chart-container">
          <svg width="100%" height="220" viewBox="0 0 450 220" preserveAspectRatio="xMidYMid meet">
            ${cashierBars}
          </svg>
        </div>
      </div>
      
      <div class="section" style="margin: 0;">
        <div class="section-title">🎫 Evolución Ticket Promedio</div>
        <div class="chart-container">
          <svg width="100%" height="160" viewBox="0 0 ${chartWidth} 160" preserveAspectRatio="xMidYMid meet">
            <line x1="30" y1="140" x2="${chartWidth - 30}" y2="140" stroke="#e5e7eb" stroke-width="1"/>
            <text x="5" y="143" font-size="8" fill="#9ca3af">$0</text>
            <text x="5" y="23" font-size="8" fill="#9ca3af">${formatCurrency(maxTicket)}</text>
            <defs>
              <linearGradient id="ticketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.4" />
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0.05" />
              </linearGradient>
            </defs>
            <polygon points="30,140 ${ticketPoints} ${chartWidth - 30},140" fill="url(#ticketGrad)"/>
            <polyline points="${ticketPoints}" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    ${aiInsights ? `
    <div class="section">
      <div class="section-title">💡 Análisis y Recomendaciones</div>
      <div class="insights-grid">
        <div class="insight-card green">
          <div class="insight-title">✅ Fortalezas</div>
          <ul class="insight-list">
            ${(aiInsights.fortalezas || []).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
        <div class="insight-card amber">
          <div class="insight-title">🎯 Oportunidades de Mejora</div>
          <ul class="insight-list">
            ${(aiInsights.mejoras || []).map(m => `<li>${m}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="insight-card blue" style="margin-top: 12px;">
        <div class="insight-title">📋 Plan de Acción Semanal</div>
        <ul class="insight-list">
          ${(aiInsights.acciones || []).map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    </div>
    ` : ''}

    <div class="footer">
      Generado automáticamente por Popsy App • ${format(today, "dd/MM/yyyy HH:mm")} • Documento confidencial para uso interno
    </div>
  </div>
  <script>window.print();</script>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Informe Gerencial</h2>
              <p className="text-white/80 text-sm">{storeCode} - {storeName || 'Selecciona tienda'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Date Filter */}
        <div className="px-6 pt-4 pb-2 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Período:</span>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-white">
                  <CalendarIcon className="w-4 h-4 text-pink-500" />
                  {format(dateRange.from, 'dd MMM', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({ from: range.from, to: range.to || range.from });
                      setAiInsights(null);
                    }
                  }}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => { setDateRange({ from: startOfWeek(today, { weekStartsOn: 1 }), to: today }); setAiInsights(null); }}
              >
                Esta semana
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => { setDateRange({ from: startOfMonth(today), to: today }); setAiInsights(null); }}
              >
                Este mes
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => { setDateRange({ from: subDays(today, 30), to: today }); setAiInsights(null); }}
              >
                Últimos 30 días
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
          {!storeId ? (
            <div className="text-center py-10">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Selecciona una tienda primero para generar el informe</p>
            </div>
          ) : (
            <>
              {/* Performance Score */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 mb-5 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-slate-300 mb-1">Score de Desempeño</p>
                    <p className="text-4xl font-black">{metrics.performanceScore}<span className="text-xl text-slate-400">/100</span></p>
                  </div>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black ${
                    metrics.performanceScore >= 80 ? 'bg-emerald-500' :
                    metrics.performanceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {metrics.performanceScore >= 80 ? '🚀' : metrics.performanceScore >= 60 ? '⚡' : '⚠️'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-slate-400">Cumplimiento</p>
                    <p className="font-bold text-lg">{metrics.compliance.toFixed(0)}%</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-slate-400">Crecimiento</p>
                    <p className={`font-bold text-lg ${metrics.salesGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {metrics.salesGrowth >= 0 ? '+' : ''}{metrics.salesGrowth.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-slate-400">Sugeridos</p>
                    <p className="font-bold text-lg">{metrics.suggestedRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Ventas Totales</p>
                      <p className="text-2xl font-black text-gray-900">{formatCurrency(metrics.totalSales)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-emerald-500 opacity-80" />
                  </div>
                  <div className="flex items-center gap-2">
                    {metrics.salesGrowth >= 0 ? (
                      <><ArrowUp className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm text-emerald-600 font-bold">+{metrics.salesGrowth.toFixed(1)}%</p></>
                    ) : (
                      <><ArrowDown className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-red-600 font-bold">{metrics.salesGrowth.toFixed(1)}%</p></>
                    )}
                    <p className="text-xs text-gray-500">vs período anterior</p>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Ticket Promedio</p>
                      <p className="text-2xl font-black text-gray-900">{formatCurrency(metrics.avgTicket)}</p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-500 opacity-80" />
                  </div>
                  <div className="flex items-center gap-2">
                    {metrics.ticketGrowth >= 0 ? (
                      <><ArrowUp className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm text-emerald-600 font-bold">+{metrics.ticketGrowth.toFixed(1)}%</p></>
                    ) : (
                      <><ArrowDown className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-red-600 font-bold">{metrics.ticketGrowth.toFixed(1)}%</p></>
                    )}
                    <p className="text-xs text-gray-500">vs período anterior</p>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border-2 ${
                  metrics.compliance >= 100 ? 'bg-emerald-50 border-emerald-500' :
                  metrics.compliance >= 80 ? 'bg-amber-50 border-amber-500' :
                  'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Cumplimiento</p>
                      <p className={`text-2xl font-black ${
                        metrics.compliance >= 100 ? 'text-emerald-600' :
                        metrics.compliance >= 80 ? 'text-amber-600' : 'text-red-600'
                      }`}>{metrics.compliance.toFixed(1)}%</p>
                    </div>
                    <Target className={`w-8 h-8 opacity-80 ${
                      metrics.compliance >= 100 ? 'text-emerald-500' :
                      metrics.compliance >= 80 ? 'text-amber-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Meta: {formatCurrency(metrics.budgetAmount)}</p>
                    {metrics.budgetGap > 0 && (
                      <p className="text-xs font-bold text-red-600">Falta: {formatCurrency(metrics.budgetGap)}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Transacciones</p>
                      <p className="text-2xl font-black text-gray-900">{metrics.totalTransactions.toLocaleString()}</p>
                    </div>
                    <Zap className="w-8 h-8 text-blue-500 opacity-80" />
                  </div>
                  <div className="flex items-center gap-2">
                    {metrics.transGrowth >= 0 ? (
                      <><ArrowUp className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm text-emerald-600 font-bold">+{metrics.transGrowth.toFixed(1)}%</p></>
                    ) : (
                      <><ArrowDown className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-red-600 font-bold">{metrics.transGrowth.toFixed(1)}%</p></>
                    )}
                    <p className="text-xs text-gray-500">vs anterior</p>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="space-y-4 mb-5">
                {/* Trend Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Tendencia de Ventas y Ticket Promedio
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={metrics.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(val) => format(new Date(val), 'dd/MM')} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar yAxisId="left" dataKey="sales" fill="#10b981" name="Ventas" radius={[8, 8, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="avgTicket" stroke="#8b5cf6" strokeWidth={3} name="Ticket Prom." dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Distribution */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="font-bold text-sm text-gray-700 mb-3">Transacciones Diarias</h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={metrics.dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(val) => format(new Date(val), 'dd')} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="transactions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="font-bold text-sm text-gray-700 mb-3">Sugeridos por Día</h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={metrics.dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(val) => format(new Date(val), 'dd')} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <defs>
                          <linearGradient id="colorSuggested" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="suggested" stroke="#f59e0b" strokeWidth={2} fill="url(#colorSuggested)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-5">
                <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" /> Top 5 Colaboradores
                </h3>
                <div className="space-y-2">
                  {cashierPerformance.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                          i === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                          i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                          'bg-gradient-to-br from-slate-400 to-slate-500'
                        }`}>#{i + 1}</div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.shifts} turnos • {formatCurrency(c.avgTicket)} ticket prom.</p>
                        </div>
                      </div>
                      <p className="font-black text-lg text-gray-900">{formatCurrency(c.sales)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              {aiInsights && (
                <div className="space-y-4">
                  {/* Executive Summary */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-4">
                    <h3 className="font-bold text-sm text-gray-800 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" /> Resumen Ejecutivo
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{aiInsights.resumen_ejecutivo}</p>
                  </div>

                  {/* Projections */}
                  {aiInsights.proyecciones && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4">
                      <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" /> Proyecciones y Metas
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-gray-600 mb-1">Ventas Proyectadas</p>
                          <p className="font-black text-lg text-purple-600">{aiInsights.proyecciones.ventas_proyectadas_mes}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-gray-600 mb-1">Probabilidad Cumplimiento</p>
                          <p className="font-black text-lg text-purple-600">{aiInsights.proyecciones.probabilidad_cumplimiento}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-gray-600 mb-1">Días Restantes</p>
                          <p className="font-black text-lg text-gray-700">{aiInsights.proyecciones.dias_restantes}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-gray-600 mb-1">Venta Diaria Requerida</p>
                          <p className="font-black text-lg text-orange-600">{aiInsights.proyecciones.venta_diaria_requerida}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KPIs Críticos */}
                  {aiInsights.kpis_criticos && aiInsights.kpis_criticos.length > 0 && (
                    <div className="bg-white border-2 border-gray-300 rounded-xl p-4">
                      <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-red-600" /> KPIs Críticos
                      </h3>
                      <div className="space-y-2">
                        {aiInsights.kpis_criticos.map((kpi, i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-bold text-sm text-gray-800">{kpi.metrica}</p>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{kpi.valor_actual}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-1"><strong>Objetivo:</strong> {kpi.objetivo}</p>
                            <p className="text-xs text-blue-600">→ {kpi.accion_numerica}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Plan */}
                  {aiInsights.plan_accion && aiInsights.plan_accion.length > 0 && (
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl p-4">
                      <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600" /> Plan de Acción Inmediato
                      </h3>
                      <div className="space-y-2">
                        {aiInsights.plan_accion.map((accion, i) => (
                          <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-2">
                            <span className="bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                            <p className="text-xs text-gray-700 leading-relaxed">{accion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks & Opportunities */}
                  <div className="grid grid-cols-2 gap-3">
                    {aiInsights.alertas_riesgo && aiInsights.alertas_riesgo.length > 0 && (
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-4">
                        <h3 className="font-bold text-xs text-gray-800 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-red-600" /> Alertas de Riesgo
                        </h3>
                        <ul className="space-y-1">
                          {aiInsights.alertas_riesgo.map((alerta, i) => (
                            <li key={i} className="text-xs text-gray-700 leading-snug pl-3 border-l-2 border-red-400">{alerta}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiInsights.oportunidades && aiInsights.oportunidades.length > 0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4">
                        <h3 className="font-bold text-xs text-gray-800 mb-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-amber-600" /> Oportunidades
                        </h3>
                        <ul className="space-y-1">
                          {aiInsights.oportunidades.map((opp, i) => (
                            <li key={i} className="text-xs text-gray-700 leading-snug pl-3 border-l-2 border-amber-400">{opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generate AI button */}
              {!aiInsights && (
                <Button
                  onClick={generateAIInsights}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando Análisis Profesional...</>
                  ) : (
                    <><BarChart3 className="w-4 h-4 mr-2" /> Generar Informe Ejecutivo con IA</>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button 
            onClick={downloadPDF} 
            disabled={!storeId}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}