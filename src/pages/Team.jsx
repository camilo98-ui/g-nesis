import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import CashierForm from '@/components/forms/CashierForm';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';
import { ArrowLeft, Users, User, Mail, Phone, Calendar, MoreVertical, Trash2, Edit, UserCheck, UserX } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Team() {
  const [selectedStore, setSelectedStore] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, cashier: null });
  const queryClient = useQueryClient();

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const { data: cashiers = [], isLoading } = useQuery({
    queryKey: ['cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Cashier.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cashiers']);
      toast.success('Estado actualizado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cashier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['cashiers']);
      toast.success('Cajero eliminado');
      setDeleteDialog({ open: false, cashier: null });
    }
  });

  const activeCashiers = cashiers.filter(c => c.is_active !== false);
  const inactiveCashiers = cashiers.filter(c => c.is_active === false);

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
              <h1 className="text-2xl md:text-3xl font-black text-gray-800">Equipo</h1>
              {selectedStore && (
                <p className="text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Active Cashiers */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-500" />
                Cajeros Activos ({activeCashiers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {activeCashiers.map((cashier, index) => (
                    <motion.div
                      key={cashier.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-md hover:shadow-lg transition-all">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                <User className="w-7 h-7" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 text-lg">{cashier.name}</h4>
                                <div className="flex flex-col gap-1 mt-1 text-sm text-gray-500">
                                  {cashier.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {cashier.email}
                                    </span>
                                  )}
                                  {cashier.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {cashier.phone}
                                    </span>
                                  )}
                                  {cashier.hire_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      Desde {format(new Date(cashier.hire_date), 'MMM yyyy', { locale: es })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => toggleActiveMutation.mutate({ id: cashier.id, is_active: false })}
                                  className="text-yellow-600"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Desactivar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteDialog({ open: true, cashier })}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {activeCashiers.length === 0 && (
                <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay cajeros activos</p>
                  <p className="text-sm text-gray-400">Agrega el primer cajero</p>
                </div>
              )}
            </div>

            {/* Inactive Cashiers */}
            {inactiveCashiers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-gray-400" />
                  Cajeros Inactivos ({inactiveCashiers.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inactiveCashiers.map((cashier, index) => (
                    <motion.div
                      key={cashier.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-gray-50 border-gray-200 opacity-70">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white">
                                <User className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-600">{cashier.name}</h4>
                                <Badge variant="secondary" className="mt-1">Inactivo</Badge>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleActiveMutation.mutate({ id: cashier.id, is_active: true })}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-7xl mb-4"
            >
              👥
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para gestionar el equipo de cajeros</p>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar cajero?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente a <strong>{deleteDialog.cashier?.name}</strong> y todos sus registros asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deleteDialog.cashier?.id)}
                className="bg-red-500 hover:bg-red-600"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}