import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { ArrowLeft, FileText, Download, Loader2, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, format, differenceInDays, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Reports() {
  const [selectedStore, setSelectedStore] = useState('');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const reportData = useMemo(() => {
    const filteredSales = dailySales.filter(s => {
      const date = new Date(s.date);
      return date >= dateRange.from && date <= dateRange.to;
    });

    const filteredRecords = shiftRecords.filter(r => {
      const date = new Date(r.date);
      return date >= dateRange.from && date <= dateRange.to;
    });

    const totals = filteredSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });

    const now = new Date();
    const currentBudget = budgets.find(b => b.month === now.getMonth() + 1 && b.year === now.getFullYear()) || {};

    // Rankings
    const cashierStats = {};
    filteredRecords.forEach(record => {
      if (!cashierStats[record.cashier_id]) {
        cashierStats[record.cashier_id] = { sales: 0, suggested: 0, tickets: 0, shifts: 0 };
      }
      cashierStats[record.cashier_id].sales += record.sales || 0;
      cashierStats[record.cashier_id].suggested += record.suggested_sales || 0;
      cashierStats[record.cashier_id].tickets += record.tickets || 0;
      cashierStats[record.cashier_id].shifts += 1;
    });

    const topSellers = Object.entries(cashierStats)
      .sort(([,a], [,b]) => b.sales - a.sales)
      .slice(0, 3)
      .map(([id, stats]) => ({ 
        cashier: cashiers.find(c => c.id === id), 
        ...stats 
      }));

    const topSuggested = Object.entries(cashierStats)
      .sort(([,a], [,b]) => b.suggested - a.suggested)
      .slice(0, 3)
      .map(([id, stats]) => ({ 
        cashier: cashiers.find(c => c.id === id), 
        ...stats 
      }));

    const daysElapsed = differenceInDays(new Date(), startOfMonth(new Date())) + 1;
    const totalDays = differenceInDays(endOfMonth(new Date()), startOfMonth(new Date())) + 1;
    const dailyAvg = filteredSales.length > 0 ? totals.sales / filteredSales.length : 0;
    const projection = dailyAvg * totalDays;

    return {
      totals,
      budget: currentBudget,
      topSellers,
      topSuggested,
      daysWorked: filteredSales.length,
      avgDaily: dailyAvg,
      avgTicket: totals.tickets > 0 ? totals.sales / totals.tickets : 0,
      compliance: currentBudget.sales_budget ? (totals.sales / currentBudget.sales_budget * 100) : 0,
      projection,
      daysElapsed,
      totalDays
    };
  }, [dailySales, shiftRecords, cashiers, budgets, dateRange]);

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      const storeName = STORES.find(s => s.code === selectedStore)?.name || selectedStore;
      const compliance = reportData.compliance.toFixed(1);
      const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);
      
      // Generar análisis con LLM
      const analysisPrompt = `Genera un análisis ejecutivo breve (máximo 200 palabras) para un reporte gerencial de una tienda Popsy (helados) con estos datos:
      
      - Tienda: ${selectedStore} - ${storeName}
      - Período: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}
      - Ventas totales: ${formatCurrency(reportData.totals.sales)}
      - Presupuesto: ${formatCurrency(reportData.budget.sales_budget)}
      - Cumplimiento: ${compliance}%
      - Tickets: ${reportData.totals.tickets}
      - Ticket promedio: ${formatCurrency(reportData.avgTicket)}
      - Sugeridos vendidos: ${reportData.totals.suggested}
      - Días trabajados: ${reportData.daysWorked}
      - Proyección de cierre: ${formatCurrency(reportData.projection)}
      - Top vendedor: ${reportData.topSellers[0]?.cashier?.name || 'N/A'}
      
      Incluye: resumen ejecutivo, puntos destacados, áreas de mejora, y recomendaciones concretas. Tono profesional pero cercano.`;

      let analysis = "";
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: analysisPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              resumen: { type: "string" },
              puntos_destacados: { type: "array", items: { type: "string" } },
              areas_mejora: { type: "array", items: { type: "string" } },
              recomendaciones: { type: "array", items: { type: "string" } }
            }
          }
        });
        analysis = result;
      } catch (e) {
        analysis = null;
      }
      
      const reportContent = `
╔══════════════════════════════════════════════════════════════════╗
║                    REPORTE GERENCIAL POPSY                       ║
║                     Helado Gourmet Premium                       ║
╚══════════════════════════════════════════════════════════════════╝

📍 INFORMACIÓN GENERAL
─────────────────────────────────────────────────────────────────
Tienda:     ${selectedStore} - ${storeName}
Período:    ${format(dateRange.from, 'dd/MM/yyyy', { locale: es })} al ${format(dateRange.to, 'dd/MM/yyyy', { locale: es })}
Generado:   ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}

═══════════════════════════════════════════════════════════════════
                        📊 RESUMEN EJECUTIVO
═══════════════════════════════════════════════════════════════════

💰 VENTAS
   Total vendido:        ${formatCurrency(reportData.totals.sales)}
   Presupuesto:          ${formatCurrency(reportData.budget.sales_budget)}
   Cumplimiento:         ${compliance}% ${parseFloat(compliance) >= 100 ? '✅' : parseFloat(compliance) >= 80 ? '⚠️' : '❌'}
   
📈 PROYECCIÓN
   Proyección cierre:    ${formatCurrency(reportData.projection)}
   Días transcurridos:   ${reportData.daysElapsed} de ${reportData.totalDays}
   Venta promedio/día:   ${formatCurrency(reportData.avgDaily)}

🎫 TICKETS
   Total tickets:        ${reportData.totals.tickets.toLocaleString()}
   Ticket promedio:      ${formatCurrency(reportData.avgTicket)}
   Transacciones:        ${reportData.totals.transactions.toLocaleString()}

🎁 SUGERIDOS
   Total sugeridos:      ${reportData.totals.suggested.toLocaleString()}
   Sugeridos/ticket:     ${reportData.totals.tickets > 0 ? (reportData.totals.suggested / reportData.totals.tickets).toFixed(2) : '0'}

═══════════════════════════════════════════════════════════════════
                        🏆 TOP CAJEROS
═══════════════════════════════════════════════════════════════════

🥇 MEJORES VENDEDORES
${reportData.topSellers.map((s, i) => `   ${['🥇', '🥈', '🥉'][i]} ${s.cashier?.name || 'N/A'}: ${formatCurrency(s.sales)} (${s.shifts} turnos)`).join('\n')}

⭐ TOP EN SUGERIDOS
${reportData.topSuggested.map((s, i) => `   ${['🥇', '🥈', '🥉'][i]} ${s.cashier?.name || 'N/A'}: ${s.suggested} sugeridos`).join('\n')}

${analysis ? `
═══════════════════════════════════════════════════════════════════
                        📝 ANÁLISIS Y RECOMENDACIONES
═══════════════════════════════════════════════════════════════════

📋 RESUMEN
${analysis.resumen || 'Sin análisis disponible'}

✨ PUNTOS DESTACADOS
${(analysis.puntos_destacados || []).map(p => `   • ${p}`).join('\n') || '   • Sin datos suficientes'}

⚠️ ÁREAS DE MEJORA
${(analysis.areas_mejora || []).map(p => `   • ${p}`).join('\n') || '   • Sin datos suficientes'}

💡 RECOMENDACIONES
${(analysis.recomendaciones || []).map(p => `   • ${p}`).join('\n') || '   • Sin datos suficientes'}
` : ''}

═══════════════════════════════════════════════════════════════════
                      🍦 POPSY - Helado Gourmet
              "Hacemos del mundo un lugar más dulce"
═══════════════════════════════════════════════════════════════════
`;

      // Create PDF-style HTML and download
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte Gerencial Popsy - ${selectedStore}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #ec4899; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #ec4899; margin: 0; font-size: 28px; }
    .header p { color: #666; margin: 5px 0; }
    .section { margin-bottom: 25px; page-break-inside: avoid; }
    .section-title { background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; font-size: 16px; }
    .info-box { background: #fdf2f8; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
    .metric { display: inline-block; width: 48%; margin-bottom: 10px; }
    .metric-label { font-size: 12px; color: #666; }
    .metric-value { font-size: 20px; font-weight: bold; color: #ec4899; }
    .ranking-item { padding: 8px 0; border-bottom: 1px solid #fce7f3; }
    .ranking-medal { font-size: 18px; margin-right: 10px; }
    .analysis-point { padding: 8px 12px; background: #fdf2f8; border-radius: 6px; margin: 5px 0; border-left: 3px solid #ec4899; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #fce7f3; color: #666; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍦 REPORTE GERENCIAL POPSY</h1>
    <p><strong>${selectedStore} - ${storeName}</strong></p>
    <p>Período: ${format(dateRange.from, 'dd/MM/yyyy', { locale: es })} al ${format(dateRange.to, 'dd/MM/yyyy', { locale: es })}</p>
    <p style="font-size: 12px;">Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</p>
  </div>

  <div class="section">
    <div class="section-title">📊 RESUMEN EJECUTIVO</div>
    <div class="info-box">
      <div class="metric">
        <div class="metric-label">💰 Ventas Totales</div>
        <div class="metric-value">${formatCurrency(reportData.totals.sales)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">📋 Presupuesto</div>
        <div class="metric-value">${formatCurrency(reportData.budget.sales_budget)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">📈 Cumplimiento</div>
        <div class="metric-value" style="color: ${parseFloat(compliance) >= 100 ? '#10b981' : parseFloat(compliance) >= 80 ? '#f59e0b' : '#ef4444'}">${compliance}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">🎯 Proyección</div>
        <div class="metric-value">${formatCurrency(reportData.projection)}</div>
      </div>
    </div>
    <div class="info-box">
      <div class="metric">
        <div class="metric-label">🎫 Total Tickets</div>
        <div class="metric-value">${reportData.totals.tickets.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">💵 Ticket Promedio</div>
        <div class="metric-value">${formatCurrency(reportData.avgTicket)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">⚡ Transacciones</div>
        <div class="metric-value">${reportData.totals.transactions.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">🎁 Sugeridos</div>
        <div class="metric-value">${reportData.totals.suggested.toLocaleString()}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🏆 TOP CAJEROS</div>
    <div class="info-box">
      <strong>Mejores Vendedores</strong>
      ${reportData.topSellers.map((s, i) => `
        <div class="ranking-item">
          <span class="ranking-medal">${['🥇', '🥈', '🥉'][i]}</span>
          <strong>${s.cashier?.name || 'N/A'}</strong>: ${formatCurrency(s.sales)} (${s.shifts} turnos)
        </div>
      `).join('')}
    </div>
    <div class="info-box">
      <strong>Top en Sugeridos</strong>
      ${reportData.topSuggested.map((s, i) => `
        <div class="ranking-item">
          <span class="ranking-medal">${['🥇', '🥈', '🥉'][i]}</span>
          <strong>${s.cashier?.name || 'N/A'}</strong>: ${s.suggested} sugeridos
        </div>
      `).join('')}
    </div>
  </div>

  ${analysis ? `
  <div class="section">
    <div class="section-title">📝 ANÁLISIS Y RECOMENDACIONES</div>
    <div class="info-box">
      <strong>Resumen</strong>
      <p>${analysis.resumen || 'Sin análisis disponible'}</p>
    </div>
    ${(analysis.puntos_destacados || []).length > 0 ? `
    <div class="info-box">
      <strong>✨ Puntos Destacados</strong>
      ${(analysis.puntos_destacados || []).map(p => `<div class="analysis-point">${p}</div>`).join('')}
    </div>
    ` : ''}
    ${(analysis.areas_mejora || []).length > 0 ? `
    <div class="info-box">
      <strong>⚠️ Áreas de Mejora</strong>
      ${(analysis.areas_mejora || []).map(p => `<div class="analysis-point">${p}</div>`).join('')}
    </div>
    ` : ''}
    ${(analysis.recomendaciones || []).length > 0 ? `
    <div class="info-box">
      <strong>💡 Recomendaciones</strong>
      ${(analysis.recomendaciones || []).map(p => `<div class="analysis-point">${p}</div>`).join('')}
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <p>🍦 <strong>POPSY</strong> - Helado Gourmet</p>
    <p><em>"Hacemos del mundo un lugar más dulce"</em></p>
  </div>
</body>
</html>`;

      // Create blob and trigger print/PDF dialog
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window for PDF printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
      
      window.URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="min-h-screen bg-white relative">
      <FloatingIceCreamsBg />
      
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50">
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-800">Reportes</h1>
              {selectedStore && (
                <p className="text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>
              )}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />

            {/* Preview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-none">
                <CardContent className="pt-4">
                  <TrendingUp className="w-6 h-6 text-emerald-500 mb-2" />
                  <p className="text-xs text-gray-500">Ventas</p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(reportData.totals.sales)}</p>
                </CardContent>
              </Card>
              <Card className={`border-none ${reportData.compliance >= 100 ? 'bg-gradient-to-br from-green-50 to-green-100' : reportData.compliance >= 80 ? 'bg-gradient-to-br from-amber-50 to-amber-100' : 'bg-gradient-to-br from-red-50 to-red-100'}`}>
                <CardContent className="pt-4">
                  {reportData.compliance >= 100 ? <TrendingUp className="w-6 h-6 text-green-500 mb-2" /> : 
                   reportData.compliance >= 80 ? <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" /> :
                   <TrendingDown className="w-6 h-6 text-red-500 mb-2" />}
                  <p className="text-xs text-gray-500">Cumplimiento</p>
                  <p className="text-lg font-bold text-gray-800">{reportData.compliance.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
                <CardContent className="pt-4">
                  <Award className="w-6 h-6 text-blue-500 mb-2" />
                  <p className="text-xs text-gray-500">Tickets</p>
                  <p className="text-lg font-bold text-gray-800">{reportData.totals.tickets.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-none">
                <CardContent className="pt-4">
                  <FileText className="w-6 h-6 text-rose-500 mb-2" />
                  <p className="text-xs text-gray-500">Sugeridos</p>
                  <p className="text-lg font-bold text-gray-800">{reportData.totals.suggested.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Generate Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none shadow-xl shadow-pink-500/30 cursor-pointer" onClick={!generating ? generatePDF : undefined}>
                <CardContent className="py-8 text-center">
                  <motion.div
                    animate={{ rotate: generating ? 360 : 0 }}
                    transition={{ duration: 1, repeat: generating ? Infinity : 0, ease: "linear" }}
                    className="inline-block mb-4"
                  >
                    {generating ? <Loader2 className="w-12 h-12" /> : <FileText className="w-12 h-12" />}
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">
                    {generating ? 'Generando reporte...' : 'Generar Reporte Gerencial'}
                  </h3>
                  <p className="text-white/80 mb-4">
                    {generating ? 'Analizando datos y creando recomendaciones...' : 'Incluye análisis, rankings y recomendaciones (PDF)'}
                  </p>
                  {!generating && (
                    <Button size="lg" className="bg-white text-pink-600 hover:bg-white/90 shadow-lg">
                      <Download className="w-5 h-5 mr-2" />
                      Descargar Reporte
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Performers Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.topSellers[0]?.cashier && (
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                      🏆 Mejor Vendedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-gray-800">{reportData.topSellers[0].cashier.name}</p>
                    <p className="text-pink-600 font-semibold">{formatCurrency(reportData.topSellers[0].sales)}</p>
                    <p className="text-xs text-gray-400">{reportData.topSellers[0].shifts} turnos trabajados</p>
                  </CardContent>
                </Card>
              )}
              {reportData.topSuggested[0]?.cashier && (
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                      ⭐ Top Sugeridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-gray-800">{reportData.topSuggested[0].cashier.name}</p>
                    <p className="text-purple-600 font-semibold">{reportData.topSuggested[0].suggested} sugeridos</p>
                    <p className="text-xs text-gray-400">{reportData.topSuggested[0].shifts} turnos trabajados</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              📊
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para generar reportes gerenciales</p>
          </div>
        )}
      </div>
    </div>
  );
}