import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ManagementReportButton({ 
  storePerformance, 
  zoneTotals, 
  topCashiers, 
  formatCurrency,
  criticalStores,
  warningStores 
}) {
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);

    const reportPrompt = `
Genera un informe ejecutivo de gerencia para la zona Bogotá Noroccidente de Popsy (heladerías) con los siguientes datos:

RESUMEN DE ZONA:
- Venta total del mes: ${formatCurrency(zoneTotals.totalSales)}
- Presupuesto: ${formatCurrency(zoneTotals.totalBudget)}
- Cumplimiento: ${zoneTotals.compliance.toFixed(1)}%
- Proyección: ${formatCurrency(zoneTotals.totalProjection)}
- Venta de hoy: ${formatCurrency(zoneTotals.todayTotal)}
- Venta de ayer: ${formatCurrency(zoneTotals.yesterdayTotal)}

TIENDAS (Top 5):
${storePerformance.slice(0, 5).map((s, i) => `${i + 1}. ${s.code} - ${s.name}: ${formatCurrency(s.totalSales)} (${s.compliance.toFixed(1)}%)`).join('\n')}

TIENDAS CRÍTICAS (menos del 70%):
${criticalStores.map(s => `- ${s.code}: ${s.compliance.toFixed(1)}%`).join('\n') || 'Ninguna'}

TOP 5 CAJEROS:
${topCashiers.slice(0, 5).map((c, i) => `${i + 1}. ${c.cashier?.name} (${c.storeName}): ${formatCurrency(c.totalSales)}`).join('\n')}

Por favor genera:
1. Resumen ejecutivo (3 líneas)
2. Puntos clave de desempeño
3. Oportunidades de mejora
4. Plan de acción sugerido para la próxima semana
5. Análisis de clima y su impacto (días soleados favorecen ventas)

Formato profesional para presentar a gerencia.
`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: reportPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            resumen_ejecutivo: { type: "string" },
            puntos_clave: { type: "array", items: { type: "string" } },
            oportunidades: { type: "array", items: { type: "string" } },
            plan_accion: { type: "array", items: { type: "string" } },
            analisis_clima: { type: "string" }
          }
        }
      });

      // Generate HTML content for PDF
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Informe Gerencial - ${format(new Date(), 'MMMM yyyy', { locale: es })}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ec4899; padding-bottom: 20px; }
    .logo { font-size: 32px; color: #ec4899; font-weight: bold; }
    .subtitle { color: #666; margin-top: 10px; }
    .section { margin: 25px 0; padding: 20px; background: #fdf2f8; border-radius: 12px; }
    .section-title { color: #ec4899; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #fce7f3; padding-bottom: 8px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #333; }
    .metric-label { font-size: 12px; color: #666; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 8px 0; line-height: 1.5; }
    .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🍦 POPSY</div>
    <h1>Informe Gerencial</h1>
    <div class="subtitle">Zona Bogotá Noroccidente | ${format(new Date(), "MMMM yyyy", { locale: es })}</div>
  </div>

  <div class="section">
    <div class="section-title">📊 Resumen Ejecutivo</div>
    <p>${response.resumen_ejecutivo}</p>
    <div style="display: flex; flex-wrap: wrap; margin-top: 15px;">
      <div class="metric">
        <div class="metric-value">${formatCurrency(zoneTotals.totalSales)}</div>
        <div class="metric-label">Venta del Mes</div>
      </div>
      <div class="metric">
        <div class="metric-value">${zoneTotals.compliance.toFixed(1)}%</div>
        <div class="metric-label">Cumplimiento</div>
      </div>
      <div class="metric">
        <div class="metric-value">${storePerformance.length}</div>
        <div class="metric-label">Tiendas</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">✅ Puntos Clave</div>
    <ul>
      ${response.puntos_clave?.map(p => `<li>${p}</li>`).join('') || ''}
    </ul>
  </div>

  <div class="section">
    <div class="section-title">🎯 Oportunidades de Mejora</div>
    <ul>
      ${response.oportunidades?.map(o => `<li>${o}</li>`).join('') || ''}
    </ul>
  </div>

  <div class="section">
    <div class="section-title">📋 Plan de Acción</div>
    <ul>
      ${response.plan_accion?.map(a => `<li>${a}</li>`).join('') || ''}
    </ul>
  </div>

  <div class="section">
    <div class="section-title">🌤️ Análisis de Clima</div>
    <p>${response.analisis_clima}</p>
  </div>

  <div class="footer">
    Generado automáticamente por Popsy App | ${format(new Date(), "dd/MM/yyyy HH:mm")}
  </div>
</body>
</html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_Gerencial_${format(new Date(), 'yyyyMMdd')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={generateReport}
        disabled={loading}
        className="bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg hover:from-pink-500 hover:to-rose-500 gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        {loading ? 'Generando...' : 'Informe PDF'}
      </Button>
    </motion.div>
  );
}