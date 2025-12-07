import React from 'react';
import { Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ShiftRecordForm from './ShiftRecordForm';

export default function CashierSalesModal({ isOpen, onClose, storeId }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-6 h-6 text-pink-500" />
            Registrar Turno de Cajero
          </DialogTitle>
        </DialogHeader>

        <ShiftRecordForm storeId={storeId} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}