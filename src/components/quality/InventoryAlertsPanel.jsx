import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, AlertTriangle, Plus, Trash2, Calendar, 
  X, Save, Clock, CheckCircle, Bell
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORIES = [
  { value: 'insumos', label: '🍦 Insumos', color: 'pink' },
  { value: 'empaque', label: '📦 Empaque', color: 'blue' },
  { value: 'limpieza', label: '🧹 Limpieza', color: 'green' },
  { value: 'otros', label: '📋 Otros', color: 'gray' },
];

export default function InventoryAlertsPanel({ storeId, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    category: 'insumos',
    quantity: '',
    min_quantity: '',
    expiry_date: '',
    notes: ''
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['inventoryAlerts', storeId],
    queryFn: () => base44.entities.InventoryAlert.filter({ store_id: storeId }),
    enabled: !!storeId && isOpen
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryAlert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventoryAlerts']);
      toast.success('Producto agregado');
      setNewProduct({ product_name: '', category: 'insumos', quantity: '', min_quantity: '', expiry_date: '', notes: '' });
      setShowAddForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryAlert.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['inventoryAlerts'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryAlert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventoryAlerts']);
      toast.success('Producto eliminado');
    }
  });

  // Calcular estado de cada producto
  const processedAlerts = useMemo(() => {
    return alerts.map(alert => {
      let status = 'ok';
      let daysToExpiry = null;

      if (alert.expiry_date) {
        daysToExpiry = differenceInDays(parseISO(alert.expiry_date), new Date());
        if (daysToExpiry < 0) status = 'expired';
        else if (daysToExpiry <= 3) status = 'critical';
        else if (daysToExpiry <= 7) status = 'low';
      }

      if (alert.quantity && alert.min_quantity && alert.quantity <= alert.min_quantity) {
        if (status === 'ok') status = 'low';
      }

      return { ...alert, status, daysToExpiry };
    }).sort((a, b) => {
      const priority = { expired: 0, critical: 1, low: 2, ok: 3 };
      return priority[a.status] - priority[b.status];
    });
  }, [alerts]);

  const criticalCount = processedAlerts.filter(a => a.status === 'critical' || a.status === 'expired').length;
  const lowCount = processedAlerts.filter(a => a.status === 'low').length;

  const handleSave = () => {
    if (!newProduct.product_name.trim()) {
      toast.error('Ingresa el nombre del producto');
      return;
    }
    createMutation.mutate({
      ...newProduct,
      store_id: storeId,
      quantity: parseFloat(newProduct.quantity) || 0,
      min_quantity: parseFloat(newProduct.min_quantity) || 0
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'expired': return 'bg-red-100 border-red-300 text-red-700';
      case 'critical': return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'low': return 'bg-amber-100 border-amber-300 text-amber-700';
      default: return 'bg-green-100 border-green-300 text-green-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'expired': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'critical': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'low': return <Bell className="w-4 h-4 text-amber-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Package className="w-5 h-5 text-teal-500" />
            </motion.div>
            Alertas de Inventario
            {criticalCount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold"
              >
                {criticalCount} críticos
              </motion.span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Resumen */}
          <div className="grid grid-cols-4 gap-2">
            <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 text-center">
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-xs text-red-500">Críticos</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 text-center">
              <p className="text-2xl font-bold text-amber-600">{lowCount}</p>
              <p className="text-xs text-amber-500">Por vencer</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 text-center">
              <p className="text-2xl font-bold text-green-600">{processedAlerts.filter(a => a.status === 'ok').length}</p>
              <p className="text-xs text-green-500">OK</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-center">
              <p className="text-2xl font-bold text-blue-600">{processedAlerts.length}</p>
              <p className="text-xs text-blue-500">Total</p>
            </motion.div>
          </div>

          {/* Botón agregar */}
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Producto
          </Button>

          {/* Formulario de nuevo producto */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="p-4 bg-teal-50/50 border-teal-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Nombre del producto"
                      value={newProduct.product_name}
                      onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                    />
                    <Select
                      value={newProduct.category}
                      onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Cantidad mínima"
                      value={newProduct.min_quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, min_quantity: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="Fecha vencimiento"
                      value={newProduct.expiry_date}
                      onChange={(e) => setNewProduct({ ...newProduct, expiry_date: e.target.value })}
                    />
                  </div>
                  <Input
                    placeholder="Notas (opcional)"
                    value={newProduct.notes}
                    onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                    <Button onClick={handleSave} className="flex-1 bg-teal-500 hover:bg-teal-600">
                      <Save className="w-4 h-4 mr-1" /> Guardar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lista de productos */}
          <div className="space-y-2">
            {processedAlerts.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-xl border ${getStatusColor(alert.status)} relative`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(alert.status)}
                    <div>
                      <p className="font-bold text-sm">{alert.product_name}</p>
                      <p className="text-xs opacity-70">
                        {CATEGORIES.find(c => c.value === alert.category)?.label || alert.category}
                      </p>
                      {alert.expiry_date && (
                        <p className="text-xs mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Vence: {format(parseISO(alert.expiry_date), 'dd MMM yyyy', { locale: es })}
                          {alert.daysToExpiry !== null && (
                            <span className={`ml-1 font-bold ${alert.daysToExpiry < 0 ? 'text-red-600' : alert.daysToExpiry <= 3 ? 'text-orange-600' : ''}`}>
                              ({alert.daysToExpiry < 0 ? 'Vencido' : `${alert.daysToExpiry} días`})
                            </span>
                          )}
                        </p>
                      )}
                      {alert.quantity > 0 && (
                        <p className="text-xs mt-1">
                          Cant: {alert.quantity} {alert.min_quantity && `(mín: ${alert.min_quantity})`}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(alert.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}

            {processedAlerts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay productos registrados</p>
                <p className="text-xs">Agrega productos para recibir alertas</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}