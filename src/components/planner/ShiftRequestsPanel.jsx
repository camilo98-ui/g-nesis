import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Calendar, Clock, User, FileText, Inbox } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const REQUEST_TYPES = {
  shift_change: { label: 'Cambio de turno', color: 'bg-blue-100 text-blue-700', icon: '🔄' },
  day_off: { label: 'Día libre', color: 'bg-amber-100 text-amber-700', icon: '🏖️' },
  permission: { label: 'Permiso', color: 'bg-violet-100 text-violet-700', icon: '📝' },
  vacation: { label: 'Vacaciones', color: 'bg-emerald-100 text-emerald-700', icon: '✈️' },
};

export default function ShiftRequestsPanel({ requests, storeId }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ShiftRequest.update(id, { 
      status, 
      reviewed_date: format(new Date(), 'yyyy-MM-dd') 
    }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['shiftRequests'] });
      toast.success(status === 'approved' ? 'Solicitud aprobada' : 'Solicitud rechazada');
    }
  });

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-200 rounded-full mx-auto mb-4 flex items-center justify-center"
        >
          <Inbox className="w-10 h-10 text-amber-500" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Sin solicitudes pendientes</h3>
        <p className="text-gray-400 text-sm">Las solicitudes de tu equipo aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request, idx) => {
        const typeConfig = REQUEST_TYPES[request.type] || REQUEST_TYPES.permission;
        
        return (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${typeConfig.color} rounded-xl flex items-center justify-center text-2xl`}>
                {typeConfig.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig.color}`}>
                    {typeConfig.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {request.created_date && format(new Date(request.created_date), "d MMM", { locale: es })}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {request.cashier_name || 'Colaborador'}
                </h3>
                
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {request.request_date && format(new Date(request.request_date), "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                </div>
                
                {request.reason && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 inline mr-1 text-gray-400" />
                    {request.reason}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ id: request.id, status: 'rejected' })}
                    className="rounded-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    size="icon"
                    onClick={() => updateMutation.mutate({ id: request.id, status: 'approved' })}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}