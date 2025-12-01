import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Loader2, X, BarChart3, Users, TrendingUp, Store, Calendar, Target, Award } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

export default function ManagerialReportModal({ storeId, storeName, storeCode, onClose }) {
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  const today = new Date();
  const monthStart = startOfMonth(today);

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

  // Calculate metrics
  const metrics = useMemo(() => {
    const currentMonthSales = dailySales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= monthStart && saleDate <= today;
    });

    const totalSales = currentMonthSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const totalTickets = currentMonthSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
    const totalTransactions = currentMonthSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
    const totalSuggested = currentMonthSales.reduce((sum, s) => sum + (s.total_suggested || 0), 0);
    const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    const currentBudget = budgets.find(b => 
      b.month === today.getMonth() + 1 && b.year === today.getFullYear()
    );
    const budgetAmount = currentBudget?.sales_budget || 0;
    const compliance = budgetAmount > 0 ? (totalSales / budgetAmount) * 100 : 0;

    // Daily trend
    const last14Days = currentMonthSales.slice(0, 14).reverse();

    return {
      totalSales,
      totalTickets,
      totalTransactions,
      totalSuggested,
      avgTicket,
      budgetAmount,
      compliance,
      daysCount: currentMonthSales.length,
      dailyTrend: last14Days
    };
  }, [dailySales, budgets, monthStart, today]);

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
        prompt: `Genera un análisis ejecutivo breve para la tienda ${storeCode} - ${storeName} de Popsy (heladería):

MÉTRICAS DEL MES:
- Venta total: ${formatCurrency(metrics.totalSales)}
- Presupuesto: ${formatCurrency(metrics.budgetAmount)}
- Cumplimiento: ${metrics.compliance.toFixed(1)}%
- Ticket promedio: ${formatCurrency(metrics.avgTicket)}
- Transacciones: ${metrics.totalTransactions}

TOP 3 CAJEROS:
${cashierPerformance.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}: ${formatCurrency(c.sales)}`).join('\n')}

Genera:
1. Resumen ejecutivo (2-3 líneas)
2. 3 fortalezas principales
3. 3 oportunidades de mejora
4. 3 acciones recomendadas para la próxima semana`,
        response_json_schema: {
          type: "object",
          properties: {
            resumen: { type: "string" },
            fortalezas: { type: "array", items: { type: "string" } },
            mejoras: { type: "array", items: { type: "string" } },
            acciones: { type: "array", items: { type: "string" } }
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
          <div class="store-date">Informe Gerencial • ${format(today, "MMMM yyyy", { locale: es })}</div>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!storeId ? (
            <div className="text-center py-10">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Selecciona una tienda primero para generar el informe</p>
            </div>
          ) : (
            <>
              {/* Metrics Preview */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-gray-800">{formatCurrency(metrics.totalSales)}</p>
                  <p className="text-xs text-gray-500">Venta del Mes</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${
                  metrics.compliance >= 100 ? 'bg-gradient-to-br from-green-50 to-emerald-100' :
                  metrics.compliance >= 80 ? 'bg-gradient-to-br from-amber-50 to-yellow-100' :
                  'bg-gradient-to-br from-red-50 to-rose-100'
                }`}>
                  <p className={`text-xl font-bold ${
                    metrics.compliance >= 100 ? 'text-green-600' :
                    metrics.compliance >= 80 ? 'text-amber-600' : 'text-red-600'
                  }`}>{metrics.compliance.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Cumplimiento</p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-gray-800">{formatCurrency(metrics.avgTicket)}</p>
                  <p className="text-xs text-gray-500">Ticket Prom.</p>
                </div>
                <div className="bg-gradient-to-br from-sky-50 to-blue-100 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-gray-800">{metrics.totalTransactions.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Transacciones</p>
                </div>
              </div>

              {/* Top Cashiers */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" /> Top Cajeros
                </h3>
                <div className="space-y-2">
                  {cashierPerformance.slice(0, 3).map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                        }`}>{i + 1}</span>
                        <span className="font-medium text-gray-700">{c.name}</span>
                      </div>
                      <span className="text-gray-600 font-medium">{formatCurrency(c.sales)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              {aiInsights && (
                <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
                  <p className="text-sm text-gray-700">
                    <strong>📋 Resumen:</strong> {aiInsights.resumen}
                  </p>
                </div>
              )}

              {/* Generate AI button */}
              {!aiInsights && (
                <Button
                  onClick={generateAIInsights}
                  disabled={loading}
                  variant="outline"
                  className="w-full mb-4 border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando datos...</>
                  ) : (
                    <><BarChart3 className="w-4 h-4 mr-2" /> Generar Análisis con IA</>
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