import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import ShiftRecordForm from '@/components/forms/ShiftRecordForm';
import DailySalesForm from '@/components/forms/DailySalesForm';
import SalesActivityLog from '@/components/sales/SalesActivityLog';

import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
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
              <h1 className="text-2xl md:text-3xl font-black">
                <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-400 bg-clip-text text-transparent">Registrar Ventas</span>
              </h1>
              {selectedStore && (
                <p className="text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>
              )}
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Log de actividad */}
            <div className="flex justify-end">
              <SalesActivityLog storeId={selectedStore} />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="w-full bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
                <TabsTrigger 
                  value="shift" 
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white rounded-lg"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Por Turno
                </TabsTrigger>
                <TabsTrigger 
                  value="daily" 
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-lg"
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
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              📝
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para registrar ventas y turnos</p>
          </div>
        )}
      </div>
    </div>
  );
}