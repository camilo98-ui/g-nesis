import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import AnimatedIcon from '@/components/AnimatedIcon';
import { ArrowLeft, FileText, Download, Loader2, BarChart3, TrendingUp, Users, Award } from 'lucide-react';
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

  // Calculate report data
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

    // Get current budget
    const now = new Date();
    const currentBudget = budgets.find(b => b.month === now.getMonth() + 1 && b.year === now.getFullYear()) || {};

    // Calculate rankings
    const cashierStats = {};
    filteredRecords.forEach(record => {
      if (!cashierStats[record.cashier_id]) {
        cashierStats[record.cashier_id] = { sales: 0, suggested: 0, tickets: 0 };
      }
      cashierStats[record.cashier_id].sales += record.sales || 0;
      cashierStats[record.cashier_id].suggested += record.suggested_sales || 0;
      cashierStats[record.cashier_id].tickets += record.tickets || 0;
    });

    const topSeller = Object.entries(cashierStats)
      .sort(([,a], [,b]) => b.sales - a.sales)
      .map(([id, stats]) => ({ 
        cashier: cashiers.find(c => c.id === id), 
        ...stats 
      }))[0];

    const topSuggested = Object.entries(cashierStats)
      .sort(([,a], [,b]) => b.suggested - a.suggested)
      .map(([id, stats]) => ({ 
        cashier: cashiers.find(c => c.id === id), 
        ...stats 
      }))[0];

    return {
      totals,
      budget: currentBudget,
      topSeller,
      topSuggested,
      daysWorked: filteredSales.length,
      avgDaily: filteredSales.length > 0 ? totals.sales / filteredSales.length : 0,
      avgTicket: totals.tickets > 0 ? totals.sales / totals.tickets : 0,
      compliance: currentBudget.sales_budget ? (totals.sales / currentBudget.sales_budget * 100) : 0
    };
  }, [dailySales, shiftRecords, cashiers, budgets, dateRange]);

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      const storeName = STORES.find(s => s.code === selectedStore)?.name || selectedStore;
      
      const reportContent = `
        REPORTE GERENCIAL - POPSY
        ========================
        
        Tienda: ${selectedStore} - ${storeName}
        Período: ${format(dateRange.from, 'dd/MM/yyyy', { locale: es })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: es })}
        
        RESUMEN EJECUTIVO
        -----------------
        • Ventas Totales: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(reportData.totals.sales)}
        • Cumplimiento vs Presupuesto: ${reportData.compliance.toFixed(1)}%
        • Tickets Generados: ${reportData.totals.tickets.toLocaleString()}
        • Ticket Promedio: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(reportData.avgTicket)}
        • Transacciones: ${reportData.totals.transactions.toLocaleString()}
        • Sugeridos Vendidos: ${reportData.totals.suggested.toLocaleString()}
        
        INDICADORES
        -----------
        • Días Operados: ${reportData.daysWorked}
        • Venta Promedio Diaria: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(reportData.avgDaily)}
        
        TOP CAJEROS
        -----------
        • Mejor Vendedor: ${reportData.topSeller?.cashier?.name || 'N/A'} - ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(reportData.topSeller?.sales || 0)}
        • Top Sugeridos: ${reportData.topSuggested?.cashier?.name || 'N/A'} - ${reportData.topSuggested?.suggested || 0} sugeridos
        
        PRESUPUESTO
        -----------
        • Presupuesto Mensual: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(reportData.budget.sales_budget || 0)}
        • Faltante: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.max(0, (reportData.budget.sales_budget || 0) - reportData.totals.sales))}
        
        ========================
        Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
        Sistema de Gestión Popsy
      `;

      // Create blob and download
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_${selectedStore}_${format(new Date(), 'yyyyMMdd')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setGenerating(false);
    }
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-fuchsia-50/30 to-purple-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-fuchsia-100">
                <ArrowLeft className="w-5 h-5 text-fuchsia-600" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <AnimatedIcon icon={FileText} color="fuchsia" size="md" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-fuchsia-800">Reportes</h1>
                {selectedStore && (
                  <p className="text-sm text-fuchsia-600/70">{selectedStore} - {selectedStoreName}</p>
                )}
              </div>
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Date Filter */}
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/70 backdrop-blur-sm border-fuchsia-100">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-500">Ventas</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(reportData.totals.sales)}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/70 backdrop-blur-sm border-fuchsia-100">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500">Cumplimiento</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{reportData.compliance.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card className="bg-white/70 backdrop-blur-sm border-fuchsia-100">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-500">Tickets</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{reportData.totals.tickets.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/70 backdrop-blur-sm border-fuchsia-100">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-pink-500" />
                    <span className="text-xs text-gray-500">Sugeridos</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{reportData.totals.suggested.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Generate Report Button */}
            <Card className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-none shadow-xl">
              <CardContent className="py-8 text-center">
                <h3 className="text-xl font-bold mb-2">Generar Reporte Gerencial</h3>
                <p className="text-white/80 mb-6">Descarga un reporte completo con todas las estadísticas</p>
                <Button 
                  size="lg"
                  onClick={generatePDF}
                  disabled={generating}
                  className="bg-white text-fuchsia-600 hover:bg-white/90 shadow-lg"
                >
                  {generating ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 mr-2" />
                  )}
                  Descargar Reporte
                </Button>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.topSeller?.cashier && (
                <Card className="bg-white/70 backdrop-blur-sm border-fuchsia-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="text-xl">🏆</span> Mejor Vendedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-gray-800">{reportData.topSeller.cashier.name}</p>
                    <p className="text-fuchsia-600">{formatCurrency(reportData.topSeller.sales)}</p>
                  </CardContent>
                </Card>
              )}
              {reportData.topSuggested?.cashier && (
                <Card className="bg-white/70 backdrop-blur-sm border-fuchsia-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="text-xl">⭐</span> Top Sugeridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-gray-800">{reportData.topSuggested.cashier.name}</p>
                    <p className="text-pink-600">{reportData.topSuggested.suggested} sugeridos</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              📊
            </motion.div>
            <h2 className="text-xl font-bold text-fuchsia-700 mb-2">Selecciona una tienda</h2>
            <p className="text-fuchsia-600/60">Para generar reportes</p>
          </div>
        )}
      </div>
    </div>
  );
}