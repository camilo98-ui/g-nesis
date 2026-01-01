import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Loader2, X, BarChart3, Users, TrendingUp, Store } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

export default function StoreReportGenerator({ 
  storeId,
  storeName,
  storeCode
}) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState(null);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Fetch all required data
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

  const generateReport = async () => {
    if (!storeId) return;
    setLoading(true);

    try {
      // Calculate metrics
      const currentMonthSales = dailySales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });

      const totalSales = currentMonthSales.reduce((sum, s) => sum + (s.total_sales || 0), 0);
      const totalTickets = currentMonthSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0);
      const totalTransactions = currentMonthSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0);
      const avgTicket = totalTickets > 0 ? totalSales / totalTickets : 0;

      const currentBudget = budgets.find(b => 
        b.month === today.getMonth() + 1 && b.year === today.getFullYear()
      );
      const budgetAmount = currentBudget?.sales_budget || 0;
      const compliance = budgetAmount > 0 ? (totalSales / budgetAmount) * 100 : 0;

      // Cashier performance
      const cashierPerformance = cashiers.map(cashier => {
        const cashierShifts = shiftRecords.filter(sr => sr.cashier_id === cashier.id);
        const cashierSales = cashierShifts.reduce((sum, s) => sum + (s.sales || 0), 0);
        const cashierTickets = cashierShifts.reduce((sum, s) => sum + (s.tickets || 0), 0);
        const cashierAvgTicket = cashierTickets > 0 ? cashierSales / cashierTickets : 0;
        return {
          name: cashier.name,
          sales: cashierSales,
          tickets: cashierTickets,
          avgTicket: cashierAvgTicket,
          shifts: cashierShifts.length
        };
      }).sort((a, b) => b.sales - a.sales);

      // Daily trend for chart
      const last14Days = dailySales.slice(0, 14).reverse();

      // Generate AI insights
      const aiPrompt = `
Genera un análisis ejecutivo breve para la tienda ${storeCode} - ${storeName} de Popsy (heladería):

MÉTRICAS DEL MES:
- Venta total: $${totalSales.toLocaleString()}
- Presupuesto: $${budgetAmount.toLocaleString()}
- Cumplimiento: ${compliance.toFixed(1)}%
- Tickets: ${totalTickets}
- Ticket promedio: $${avgTicket.toFixed(0)}

TOP CAJEROS:
${cashierPerformance.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}: $${c.sales.toLocaleString()}`).join('\n')}

Genera:
1. Resumen ejecutivo (2 líneas)
2. 3 fortalezas
3. 3 áreas de mejora
4. 3 acciones recomendadas
`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
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

      const data = {
        store: { code: storeCode, name: storeName },
        metrics: { totalSales, totalTickets, totalTransactions, avgTicket, budgetAmount, compliance },
        cashierPerformance,
        dailyTrend: last14Days,
        insights: aiResponse,
        generatedAt: new Date()
      };

      setReportData(data);
      setShowPreview(true);

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const { store, metrics, cashierPerformance, dailyTrend, insights } = reportData;
    const formatCurrency = (val) => `$${(val || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

    // Generate SVG chart for daily sales
    const maxSales = Math.max(...dailyTrend.map(d => d.total_sales || 0), 1);
    const chartBars = dailyTrend.map((d, i) => {
      const height = ((d.total_sales || 0) / maxSales) * 120;
      const x = 30 + i * 38;
      return `
        <rect x="${x}" y="${150 - height}" width="30" height="${height}" fill="#ec4899" rx="4" opacity="0.8"/>
        <text x="${x + 15}" y="165" text-anchor="middle" font-size="8" fill="#666">${format(new Date(d.date), 'dd')}</text>
      `;
    }).join('');

    // Generate SVG chart for cashier performance
    const topCashiers = cashierPerformance.slice(0, 5);
    const maxCashierSales = Math.max(...topCashiers.map(c => c.sales || 0), 1);
    const cashierBars = topCashiers.map((c, i) => {
      const width = ((c.sales || 0) / maxCashierSales) * 300;
      const y = 20 + i * 35;
      return `
        <rect x="100" y="${y}" width="${width}" height="25" fill="#8b5cf6" rx="4" opacity="0.8"/>
        <text x="5" y="${y + 17}" font-size="10" fill="#333">${c.name?.substring(0, 12) || 'N/A'}</text>
        <text x="${105 + width}" y="${y + 17}" font-size="9" fill="#666">${formatCurrency(c.sales)}</text>
      `;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Informe ${store.code} - ${format(new Date(), 'MMMM yyyy', { locale: es })}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #ec4899; padding-bottom: 15px; }
    .logo { font-size: 28px; color: #ec4899; font-weight: bold; }
    .store-name { font-size: 20px; color: #333; margin-top: 8px; }
    .subtitle { color: #666; margin-top: 5px; font-size: 14px; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .metric-card { background: linear-gradient(135deg, #fdf2f8, #fce7f3); border-radius: 12px; padding: 15px; text-align: center; }
    .metric-value { font-size: 22px; font-weight: bold; color: #333; }
    .metric-label { font-size: 11px; color: #666; margin-top: 5px; }
    .metric-sub { font-size: 10px; color: #888; margin-top: 3px; }
    
    .section { margin: 25px 0; page-break-inside: avoid; }
    .section-title { color: #ec4899; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #fce7f3; padding-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    
    .chart-container { background: #fafafa; border-radius: 12px; padding: 15px; margin: 15px 0; }
    
    .insights-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .insight-card { background: #f8fafc; border-radius: 10px; padding: 12px; border-left: 3px solid #ec4899; }
    .insight-card.green { border-left-color: #22c55e; }
    .insight-card.amber { border-left-color: #f59e0b; }
    .insight-card.blue { border-left-color: #3b82f6; }
    .insight-title { font-weight: bold; font-size: 12px; color: #333; margin-bottom: 8px; }
    .insight-list { margin: 0; padding-left: 15px; font-size: 11px; line-height: 1.6; }
    
    .resumen { background: linear-gradient(135deg, #fef3c7, #fef9c3); border-radius: 12px; padding: 15px; margin: 15px 0; }
    .resumen p { margin: 0; font-size: 13px; line-height: 1.6; }
    
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #eee; padding-top: 15px; }
    
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🍦 POPSY</div>
    <div class="store-name">${store.code} - ${store.name}</div>
    <div class="subtitle">Informe Gerencial | ${format(new Date(), "MMMM yyyy", { locale: es })}</div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value">${formatCurrency(metrics.totalSales)}</div>
      <div class="metric-label">Venta del Mes</div>
      <div class="metric-sub">Ppto: ${formatCurrency(metrics.budgetAmount)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="color: ${metrics.compliance >= 100 ? '#22c55e' : metrics.compliance >= 80 ? '#f59e0b' : '#ef4444'}">${metrics.compliance.toFixed(1)}%</div>
      <div class="metric-label">Cumplimiento</div>
      <div class="metric-sub">${metrics.compliance >= 100 ? '¡Meta alcanzada!' : `Faltan ${formatCurrency(metrics.budgetAmount - metrics.totalSales)}`}</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${formatCurrency(metrics.avgTicket)}</div>
      <div class="metric-label">Ticket Promedio</div>
      <div class="metric-sub">${metrics.totalTickets.toLocaleString()} tickets</div>
    </div>
  </div>

  <div class="resumen">
    <p><strong>📋 Resumen Ejecutivo:</strong> ${insights.resumen || 'Análisis en progreso...'}</p>
  </div>

  <div class="section">
    <div class="section-title">📈 Tendencia de Ventas (Últimos 14 días)</div>
    <div class="chart-container">
      <svg width="100%" height="180" viewBox="0 0 560 180">
        <line x1="30" y1="150" x2="550" y2="150" stroke="#eee" stroke-width="1"/>
        <line x1="30" y1="100" x2="550" y2="100" stroke="#eee" stroke-width="1" stroke-dasharray="4"/>
        <line x1="30" y1="50" x2="550" y2="50" stroke="#eee" stroke-width="1" stroke-dasharray="4"/>
        <text x="5" y="155" font-size="8" fill="#999">$0</text>
        <text x="5" y="55" font-size="8" fill="#999">${formatCurrency(maxSales)}</text>
        ${chartBars}
      </svg>
    </div>
  </div>

  <div class="section">
    <div class="section-title">👥 Rendimiento de Cajeros</div>
    <div class="chart-container">
      <svg width="100%" height="200" viewBox="0 0 500 200">
        ${cashierBars}
      </svg>
    </div>
  </div>

  <div class="section">
    <div class="section-title">💡 Análisis y Recomendaciones</div>
    <div class="insights-grid">
      <div class="insight-card green">
        <div class="insight-title">✅ Fortalezas</div>
        <ul class="insight-list">
          ${(insights.fortalezas || []).map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
      <div class="insight-card amber">
        <div class="insight-title">🎯 Áreas de Mejora</div>
        <ul class="insight-list">
          ${(insights.mejoras || []).map(m => `<li>${m}</li>`).join('')}
        </ul>
      </div>
    </div>
    <div class="insight-card blue" style="margin-top: 15px;">
      <div class="insight-title">📋 Acciones Recomendadas</div>
      <ul class="insight-list">
        ${(insights.acciones || []).map(a => `<li>${a}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="footer">
    Generado automáticamente por Popsy App | ${format(new Date(), "dd/MM/yyyy HH:mm")} | Confidencial
  </div>

  <script>window.print();</script>
</body>
</html>
    `;

    // Open in new window for printing as PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const formatCurrency = (val) => `$${(val || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

  return (
    <>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && reportData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6" />
                  <div>
                    <h2 className="font-bold">Informe Generado</h2>
                    <p className="text-white/80 text-sm">{reportData.store.code} - {reportData.store.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)} className="text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Preview Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(reportData.metrics.totalSales)}</p>
                    <p className="text-xs text-gray-500">Venta del Mes</p>
                  </div>
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${reportData.metrics.compliance >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                      {reportData.metrics.compliance.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Cumplimiento</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(reportData.metrics.avgTicket)}</p>
                    <p className="text-xs text-gray-500">Ticket Promedio</p>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-amber-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>📋 Resumen:</strong> {reportData.insights.resumen}
                  </p>
                </div>

                {/* Top Cashiers */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" /> Top Cajeros
                  </h3>
                  <div className="space-y-2">
                    {reportData.cashierPerformance.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                        <span className="text-sm font-medium">{i + 1}. {c.name}</span>
                        <span className="text-sm text-gray-600">{formatCurrency(c.sales)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cerrar
                </Button>
                <Button onClick={downloadPDF} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white gap-2">
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}