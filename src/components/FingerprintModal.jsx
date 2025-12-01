import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, Fingerprint, UserPlus, Users, TrendingUp, Receipt, Star, Check, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth } from 'date-fns';

export default function FingerprintModal({ storeId, onClose }) {
  const [mode, setMode] = useState('menu'); // menu, register, identify
  const [selectedCashier, setSelectedCashier] = useState('');
  const [scanning, setScanning] = useState(false);
  const [identified, setIdentified] = useState(null);
  const [registeredFingerprints, setRegisteredFingerprints] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('fingerprintRegistry');
    if (saved) setRegisteredFingerprints(JSON.parse(saved));
  }, []);

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const handleRegister = async () => {
    if (!selectedCashier) return;
    setScanning(true);
    
    // Simular escaneo de huella
    await new Promise(r => setTimeout(r, 2000));
    
    const fingerprintId = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updated = { ...registeredFingerprints, [fingerprintId]: selectedCashier };
    setRegisteredFingerprints(updated);
    localStorage.setItem('fingerprintRegistry', JSON.stringify(updated));
    
    setScanning(false);
    setMode('menu');
  };

  const handleIdentify = async () => {
    setScanning(true);
    setIdentified(null);
    
    // Simular escaneo de huella
    await new Promise(r => setTimeout(r, 2000));
    
    // Buscar cajero registrado (simula identificación)
    const entries = Object.entries(registeredFingerprints);
    if (entries.length > 0) {
      const randomEntry = entries[Math.floor(Math.random() * entries.length)];
      const cashierId = randomEntry[1];
      const cashier = cashiers.find(c => c.id === cashierId);
      
      if (cashier) {
        // Calcular estadísticas del cajero
        const fromDate = startOfMonth(new Date());
        const cashierRecords = shiftRecords.filter(r => 
          r.cashier_id === cashierId && new Date(r.date) >= fromDate
        );
        
        const stats = {
          totalSales: cashierRecords.reduce((sum, r) => sum + (r.sales || 0), 0),
          totalTickets: cashierRecords.reduce((sum, r) => sum + (r.tickets || 0), 0),
          totalTransactions: cashierRecords.reduce((sum, r) => sum + (r.transactions || 0), 0),
          totalSuggested: cashierRecords.reduce((sum, r) => sum + (r.suggested_sales || 0), 0),
          shifts: cashierRecords.length
        };
        stats.avgTicket = stats.totalTickets > 0 ? stats.totalSales / stats.totalTickets : 0;
        
        setIdentified({ cashier, stats });
      }
    }
    
    setScanning(false);
  };

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(v);

  const registeredCount = Object.values(registeredFingerprints).filter(id => 
    cashiers.some(c => c.id === id)
  ).length;

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
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Identificación por Huella</h2>
                <p className="text-white/80 text-sm">{registeredCount} cajeros registrados</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* Menu Principal */}
            {mode === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <Button
                  onClick={() => setMode('register')}
                  className="w-full h-16 bg-gradient-to-r from-blue-500 to-cyan-500 text-white justify-start gap-4"
                >
                  <UserPlus className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-bold">Registrar Huella</p>
                    <p className="text-xs text-white/80">Vincular cajero con huella</p>
                  </div>
                </Button>
                
                <Button
                  onClick={() => { setMode('identify'); handleIdentify(); }}
                  className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 text-white justify-start gap-4"
                  disabled={registeredCount === 0}
                >
                  <Fingerprint className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-bold">Identificar Cajero</p>
                    <p className="text-xs text-white/80">Escanear huella para ver resultados</p>
                  </div>
                </Button>
              </motion.div>
            )}

            {/* Registrar Huella */}
            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cajero..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cashiers.map(cashier => (
                      <SelectItem key={cashier.id} value={cashier.id}>
                        {cashier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCashier && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-6"
                  >
                    <motion.div
                      animate={scanning ? { scale: [1, 1.1, 1], opacity: [1, 0.7, 1] } : {}}
                      transition={{ duration: 1, repeat: scanning ? Infinity : 0 }}
                      className={`w-24 h-24 rounded-full flex items-center justify-center ${
                        scanning ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      {scanning ? (
                        <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                      ) : (
                        <Fingerprint className="w-12 h-12 text-gray-400" />
                      )}
                    </motion.div>
                    <p className="mt-4 text-sm text-gray-500">
                      {scanning ? 'Escaneando huella...' : 'Presiona para escanear'}
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setMode('menu')} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleRegister} 
                    disabled={!selectedCashier || scanning}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Identificar */}
            {mode === 'identify' && (
              <motion.div
                key="identify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {scanning ? (
                  <div className="flex flex-col items-center py-8">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
                    >
                      <Fingerprint className="w-12 h-12 text-green-500" />
                    </motion.div>
                    <p className="mt-4 text-gray-500">Identificando cajero...</p>
                  </div>
                ) : identified ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center py-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3"
                      >
                        <Check className="w-8 h-8 text-green-500" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-gray-800">{identified.cashier.name}</h3>
                      <p className="text-sm text-gray-500">Cajero identificado</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="text-xs text-gray-500 text-center mb-3">Resultados del mes actual</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-gray-600">Ventas</span>
                        </div>
                        <span className="font-bold text-emerald-600">{formatCurrency(identified.stats.totalSales)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">Ticket Promedio</span>
                        </div>
                        <span className="font-bold text-blue-600">{formatCurrency(identified.stats.avgTicket)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-600">Transacciones</span>
                        </div>
                        <span className="font-bold text-purple-600">{identified.stats.totalTransactions.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-gray-600">Sugeridos</span>
                        </div>
                        <span className="font-bold text-amber-600">{identified.stats.totalSuggested.toLocaleString()}</span>
                      </div>
                      
                      <div className="pt-2 border-t text-center">
                        <span className="text-xs text-gray-400">{identified.stats.shifts} turnos trabajados</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-8">
                    <Fingerprint className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">No se pudo identificar el cajero</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setMode('menu'); setIdentified(null); }} className="flex-1">
                    Volver
                  </Button>
                  {!scanning && (
                    <Button onClick={handleIdentify} className="flex-1 bg-green-500 hover:bg-green-600">
                      Escanear de nuevo
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}