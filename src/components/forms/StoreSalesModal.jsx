import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DailySalesForm from './DailySalesForm';

export default function StoreSalesModal({ isOpen, onClose, storeId }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-6 h-6 text-green-500" />
            Registrar Ventas del Día
          </DialogTitle>
        </DialogHeader>

        <DailySalesForm storeId={storeId} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}