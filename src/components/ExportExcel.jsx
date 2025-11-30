import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Download, X, Store, Users, Loader2, TrendingUp, Award, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ExportExcel({ 
  storeData = [], 
  cashierData = [], 
  storeName = '',
  dateRange,
  onClose 
}) {
  const [exporting, setExporting] = useState(null);

  // Calcular estadísticas para enriquecer el export
  const storeStats = useMemo(() => {
    const totalSales = storeData.reduce((acc, d) => acc + (d.total_sales || 0), 0);
    const totalTickets = storeData.reduce((acc, d) => acc + (d.total_tickets || 0), 0);
    const totalTrans = storeData.reduce((acc, d) => acc + (d.total_transactions || 0), 0);
    const totalSuggested = storeData.reduce((acc, d) => acc + (d.total_suggested || 0), 0);
    const avgTicket = totalTrans > 0 ? totalSales / totalTrans : 0;
    const avgDailySales = storeData.length > 0 ? totalSales / storeData.length : 0;
    const bestDay = storeData.reduce((max, d) => (d.total_sales || 0) > (max.total_sales || 0) ? d : max, {});
    const worstDay = storeData.filter(d => d.total_sales > 0).reduce((min, d) => (d.total_sales || Infinity) < (min.total_sales || Infinity) ? d : min, {});
    
    return { totalSales, totalTickets, totalTrans, totalSuggested, avgTicket, avgDailySales, bestDay, worstDay };
  }, [storeData]);

  const cashierStats = useMemo(() => {
    const byC = {};
    cashierData.forEach(d => {
      if (!byC[d.cashierName]) byC[d.cashierName] = { sales: 0, tickets: 0, suggested: 0, shifts: 0 };
      byC[d.cashierName].sales += d.sales || 0;
      byC[d.cashierName].tickets += d.tickets || 0;
      byC[d.cashierName].suggested += d.suggested_sales || 0;
      byC[d.cashierName].shifts += 1;
    });
    return Object.entries(byC)
      .map(([name, stats]) => ({ name, ...stats, avgTicket: stats.tickets > 0 ? stats.sales / stats.tickets : 0 }))
      .sort((a, b) => b.sales - a.sales);
  }, [cashierData]);

  const convertToCSV = (data, type) => {
    if (!data.length && type !== 'store') return '';
    
    let headers, rows;
    const formatCurr = (v) => `$${Math.round(v).toLocaleString()}`;
    
    if (type === 'store') {
      // Reporte enriquecido de tienda
      headers = ['REPORTE DE TIENDA - ' + storeName, '', '', '', ''];
      const summaryRows = [
        [''],
        ['=== RESUMEN EJECUTIVO ===', '', '', '', ''],
        ['Período', dateRange?.from ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` : 'N/A', '', '', ''],
        ['Ventas Totales', formatCurr(storeStats.totalSales), '', '', ''],
        ['Total Transacciones', storeStats.totalTrans, '', '', ''],
        ['Ticket Promedio', formatCurr(storeStats.avgTicket), '', '', ''],
        ['Venta Diaria Promedio', formatCurr(storeStats.avgDailySales), '', '', ''],
        ['Total Sugeridos', storeStats.totalSuggested, '', '', ''],
        ['Días Trabajados', storeData.length, '', '', ''],
        [''],
        ['Mejor Día', storeStats.bestDay?.date || 'N/A', formatCurr(storeStats.bestDay?.total_sales || 0), '', ''],
        ['Día Más Bajo', storeStats.worstDay?.date || 'N/A', formatCurr(storeStats.worstDay?.total_sales || 0), '', ''],
        [''],
        ['=== DETALLE DIARIO ===', '', '', '', ''],
        ['Fecha', 'Ventas', 'Tickets', 'Transacciones', 'Sugeridos']
      ];
      rows = [
        ...summaryRows,
        ...storeData.map(d => [
          d.date,
          formatCurr(d.total_sales || 0),
          d.total_tickets || 0,
          d.total_transactions || 0,
          d.total_suggested || 0
        ])
      ];
      return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    } else {
      // Reporte enriquecido de cajeros
      const summaryRows = [
        ['REPORTE DE CAJEROS - ' + storeName, '', '', '', '', '', ''],
        [''],
        ['=== RANKING DE CAJEROS ===', '', '', '', '', '', ''],
        ['Posición', 'Cajero', 'Ventas Totales', 'Turnos', 'Ticket Prom.', 'Sugeridos', ''],
        ...cashierStats.map((c, i) => [
          i + 1,
          c.name,
          formatCurr(c.sales),
          c.shifts,
          formatCurr(c.avgTicket),
          c.suggested,
          ''
        ]),
        [''],
        ['=== TOP 3 DESTACADOS ===', '', '', '', '', '', ''],
        ['🥇 Mejor Vendedor', cashierStats[0]?.name || 'N/A', formatCurr(cashierStats[0]?.sales || 0), '', '', '', ''],
        ['🥈 Segundo Lugar', cashierStats[1]?.name || 'N/A', formatCurr(cashierStats[1]?.sales || 0), '', '', '', ''],
        ['🥉 Tercer Lugar', cashierStats[2]?.name || 'N/A', formatCurr(cashierStats[2]?.sales || 0), '', '', '', ''],
        [''],
        ['=== DETALLE DE TURNOS ===', '', '', '', '', '', ''],
        ['Cajero', 'Fecha', 'Turno', 'Ventas', 'Tickets', 'Transacciones', 'Sugeridos'],
        ...cashierData.map(d => [
          d.cashierName || 'N/A',
          d.date,
          d.shift === 'morning' ? 'Mañana' : d.shift === 'afternoon' ? 'Tarde' : 'Noche',
          formatCurr(d.sales || 0),
          d.tickets || 0,
          d.transactions || 0,
          d.suggested_sales || 0
        ])
      ];
      return summaryRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
  };

  const downloadCSV = async (type) => {
    setExporting(type);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = type === 'store' ? storeData : cashierData;
    const csv = convertToCSV(data, type);
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const dateStr = dateRange ? 
      `${format(dateRange.from, 'ddMMyy')}_${format(dateRange.to, 'ddMMyy')}` : 
      format(new Date(), 'ddMMyyyy');
    
    a.download = `Popsy_${type === 'store' ? 'Tienda' : 'Cajeros'}_${storeName}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    setExporting(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <h3 className="font-bold text-gray-800">Exportar a Excel</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => downloadCSV('store')}
          disabled={exporting}
          className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200 transition-all"
        >
          {exporting === 'store' ? (
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          ) : (
            <Store className="w-8 h-8 text-green-600" />
          )}
          <div className="text-left">
            <p className="font-bold text-gray-800">Por Tienda</p>
            <p className="text-xs text-gray-500">Ventas diarias</p>
          </div>
          <Download className="w-5 h-5 text-green-600 ml-auto" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => downloadCSV('cashier')}
          disabled={exporting}
          className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-100 hover:from-blue-100 hover:to-cyan-200 transition-all"
        >
          {exporting === 'cashier' ? (
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          ) : (
            <Users className="w-8 h-8 text-blue-600" />
          )}
          <div className="text-left">
            <p className="font-bold text-gray-800">Por Cajeros</p>
            <p className="text-xs text-gray-500">Registro de turnos</p>
          </div>
          <Download className="w-5 h-5 text-blue-600 ml-auto" />
        </motion.button>
      </div>
    </motion.div>
  );
}