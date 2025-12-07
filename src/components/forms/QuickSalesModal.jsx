import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShiftRecordForm from './ShiftRecordForm';
import DailySalesForm from './DailySalesForm';

export default function QuickSalesModal({ isOpen, onClose, storeId }) {
  const [activeTab, setActiveTab] = useState('shift');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            Registrar Ventas
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="shift" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              Por Turno
            </TabsTrigger>
            <TabsTrigger value="daily" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Del Día
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shift">
            <ShiftRecordForm storeId={storeId} onSuccess={onClose} />
          </TabsContent>

          <TabsContent value="daily">
            <DailySalesForm storeId={storeId} onSuccess={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}