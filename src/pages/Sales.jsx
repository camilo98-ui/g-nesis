import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import ShiftRecordForm from '@/components/forms/ShiftRecordForm';
import DailySalesForm from '@/components/forms/DailySalesForm';
import CashierForm from '@/components/forms/CashierForm';
import { ArrowLeft, TrendingUp, Clock, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Sales() {
  const [selectedStore, setSelectedStore] = useState('');
  const [activeTab, setActiveTab] = useState('shift');

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                Registrar Ventas
              </h1>
              {selectedStore && (
                <p className="text-sm text-gray-500 mt-1">{selectedStore} - {selectedStoreName}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            {selectedStore && <CashierForm storeId={selectedStore} />}
          </div>
        </div>

        {selectedStore ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="w-full bg-white/80 backdrop-blur-sm border border-orange-100 p-1 rounded-xl">
                <TabsTrigger 
                  value="shift" 
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Por Turno
                </TabsTrigger>
                <TabsTrigger 
                  value="daily" 
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Total del Día
                </TabsTrigger>
              </TabsList>

              <TabsContent value="shift">
                <ShiftRecordForm storeId={selectedStore} />
              </TabsContent>

              <TabsContent value="daily">
                <DailySalesForm storeId={selectedStore} />
              </TabsContent>
            </Tabs>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-500">Para registrar ventas y turnos</p>
          </div>
        )}
      </div>
    </div>
  );
}