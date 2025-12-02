import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Pencil, Trash2, User, Mail, Phone, Loader2, Check, Camera, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CashierManagerModal({ isOpen, onClose, cashiers, storeId }) {
  const [editingCashier, setEditingCashier] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', photo_url: '' });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cashier.create({ ...data, store_id: storeId, is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', photo_url: '' });
      toast.success('Colaborador creado');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cashier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setEditingCashier(null);
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', photo_url: '' });
      toast.success('Colaborador actualizado');
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photo_url: file_url });
      toast.success('Foto subida');
    } catch (err) {
      toast.error('Error al subir la foto');
    }
    setUploading(false);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cashier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      toast.success('Colaborador eliminado');
    }
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (editingCashier) {
      updateMutation.mutate({ id: editingCashier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (cashier) => {
    setEditingCashier(cashier);
    setFormData({ name: cashier.name || '', email: cashier.email || '', phone: cashier.phone || '', photo_url: cashier.photo_url || '' });
    setShowForm(true);
  };

  const handleDelete = (cashier) => {
    if (confirm(`¿Eliminar a ${cashier.name}?`)) {
      deleteMutation.mutate(cashier.id);
    }
  };

  const handleAddNew = () => {
    setEditingCashier(null);
    setFormData({ name: '', email: '', phone: '', photo_url: '' });
    setShowForm(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-violet-500" />
            Gestionar Colaboradores
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!showForm ? (
            <>
              {/* Add Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddNew}
                className="w-full p-4 border-2 border-dashed border-violet-200 rounded-xl text-violet-500 hover:border-violet-400 hover:bg-violet-50 transition-all flex items-center justify-center gap-2 mb-4"
              >
                <Plus className="w-5 h-5" />
                Agregar Colaborador
              </motion.button>

              {/* Cashiers List */}
              <div className="space-y-2">
                {cashiers.map((cashier, idx) => (
                  <motion.div
                    key={cashier.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 group hover:bg-gray-100 transition-colors"
                  >
                    {cashier.photo_url ? (
                      <img src={cashier.photo_url} alt={cashier.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {cashier.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{cashier.name}</p>
                      <p className="text-xs text-gray-400 truncate">{cashier.email || cashier.phone || 'Sin contacto'}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(cashier)}
                        className="h-8 w-8 rounded-lg hover:bg-violet-100 text-violet-500"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(cashier)}
                        className="h-8 w-8 rounded-lg hover:bg-red-100 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {cashiers.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No hay colaboradores registrados</p>
                )}
              </div>
            </>
          ) : (
            /* Form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <div className="relative inline-block">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Foto" className="w-20 h-20 rounded-2xl object-cover mx-auto" />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold">
                      {formData.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-600 transition-colors shadow-lg">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {editingCashier ? 'Editar colaborador' : 'Nuevo colaborador'}
                </p>
                {!formData.photo_url && (
                  <p className="text-xs text-gray-400 mt-1">Toca el ícono de cámara para agregar foto</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre completo"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="300 123 4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setShowForm(false); setEditingCashier(null); setFormData({ name: '', email: '', phone: '', photo_url: '' }); }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingCashier ? 'Guardar' : 'Crear'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}