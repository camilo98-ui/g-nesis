import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Download, X, Store, Users, Loader2 } from 'lucide-react';
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

  const convertToCSV = (data, type) => {
    if (!data.length) return '';
    
    let headers, rows;
    
    if (type === 'store') {
      headers = ['Fecha', 'Ventas Totales', 'Tickets', 'Transacciones', 'Sugeridos'];
      rows = data.map(d => [
        d.date,
        d.total_sales || 0,
        d.total_tickets || 0,
        d.total_transactions || 0,
        d.total_suggested || 0
      ]);
    } else {
      headers = ['Cajero', 'Fecha', 'Turno', 'Ventas', 'Tickets', 'Transacciones', 'Sugeridos', 'Ticket Promedio'];
      rows = data.map(d => [
        d.cashierName || 'N/A',
        d.date,
        d.shift === 'morning' ? 'Mañana' : d.shift === 'afternoon' ? 'Tarde' : 'Noche',
        d.sales || 0,
        d.tickets || 0,
        d.transactions || 0,
        d.suggested_sales || 0,
        d.average_ticket || 0
      ]);
    }
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
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