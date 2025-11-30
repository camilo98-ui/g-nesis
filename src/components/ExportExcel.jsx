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

  // Escapar valores para CSV estándar
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""').replace(/\r?\n/g, ' ');
    return `"${str}"`;
  };

  const convertToCSV = (data, type) => {
    if (!data.length) return '';
    
    if (type === 'store') {
      // CSV limpio de tienda - una fila por registro
      const headers = ['Fecha', 'Tienda', 'Ventas', 'Tickets', 'Transacciones', 'Sugeridos', 'Ticket Promedio'];
      const rows = storeData.map(d => {
        const avgTicket = (d.total_transactions || 0) > 0 ? Math.round((d.total_sales || 0) / d.total_transactions) : 0;
        return [
          d.date || '',
          storeName || '',
          d.total_sales || 0,
          d.total_tickets || 0,
          d.total_transactions || 0,
          d.total_suggested || 0,
          avgTicket
        ];
      });
      return [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\r\n');
    } else {
      // CSV limpio de cajeros - una fila por turno
      const headers = ['Fecha', 'Hora', 'Cajero', 'Tienda', 'Turno', 'Ventas', 'Tickets', 'Transacciones', 'Sugeridos', 'Ticket Promedio'];
      const shiftHours = { morning: '08:00', afternoon: '14:00', night: '19:00' };
      const shiftNames = { morning: 'Manana', afternoon: 'Tarde', night: 'Noche' };
      
      const rows = cashierData.map(d => {
        const avgTicket = (d.tickets || 0) > 0 ? Math.round((d.sales || 0) / d.tickets) : 0;
        return [
          d.date || '',
          shiftHours[d.shift] || '',
          d.cashierName || '',
          storeName || '',
          shiftNames[d.shift] || '',
          d.sales || 0,
          d.tickets || 0,
          d.transactions || 0,
          d.suggested_sales || 0,
          avgTicket
        ];
      });
      return [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\r\n');
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