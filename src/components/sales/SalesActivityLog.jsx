import React from 'react';
import { motion } from 'framer-motion';
import { History, User, Clock, DollarSign, Edit, Plus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function SalesActivityLog({ storeId }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['salesLogs', storeId],
    queryFn: () => base44.entities.SalesLog.filter({ store_id: storeId }, '-created_date', 50),
    enabled: !!storeId
  });

  const getActionIcon = (action) => {
    switch(action) {
      case 'create': return <Plus className="w-3 h-3" />;
      case 'update': return <Edit className="w-3 h-3" />;
      default: return <History className="w-3 h-3" />;
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'create': return 'text-green-600 bg-green-50';
      case 'update': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionText = (action) => {
    switch(action) {
      case 'create': return 'Registró';
      case 'update': return 'Actualizó';
      default: return 'Modificó';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          Historial de Movimientos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-violet-600" />
            Historial de Movimientos
          </DialogTitle>
          <p className="text-xs text-gray-500">Últimas 50 acciones registradas</p>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {logs.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Sin movimientos registrados</p>
          ) : (
            logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-violet-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-1.5 rounded-lg ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">
                          {getActionText(log.action)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          log.record_type === 'shift_record' 
                            ? 'bg-pink-100 text-pink-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.record_type === 'shift_record' ? 'Turno' : 'Día Completo'}
                        </span>
                      </div>
                      
                      {log.cashier_name && (
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Cajero: {log.cashier_name}
                        </p>
                      )}
                      
                      {log.sales_amount > 0 && (
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${log.sales_amount.toLocaleString()}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(log.created_date), "dd MMM HH:mm", { locale: es })}
                        </span>
                        {log.action_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(log.action_date), "dd MMM", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}