import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Save, Loader2, User, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function CashierForm({ storeId, onSuccess }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hire_date: new Date().toISOString().split('T')[0]
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cashier.create({
      ...data,
      store_id: storeId,
      is_active: true
    }),
    onSuccess: () => {
      toast.success('¡Cajero registrado exitosamente!');
      queryClient.invalidateQueries(['cashiers']);
      setFormData({ name: '', email: '', phone: '', hire_date: new Date().toISOString().split('T')[0] });
      setOpen(false);
      onSuccess?.();
    },
    onError: () => {
      toast.error('Error al registrar el cajero');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/30">
          <UserPlus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white/95 backdrop-blur-lg border-pink-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl text-white">
              <User className="w-5 h-5" />
            </div>
            Registrar Nuevo Cajero
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-600 flex items-center gap-2">
              <User className="w-4 h-4 text-pink-500" />
              Nombre completo *
            </Label>
            <Input 
              placeholder="Ej: María García"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border-pink-200 focus:ring-pink-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-600 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" />
              Email
            </Label>
            <Input 
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="border-pink-200 focus:ring-pink-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-600 flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500" />
              Teléfono
            </Label>
            <Input 
              placeholder="300 123 4567"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="border-pink-200 focus:ring-pink-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              Fecha de ingreso
            </Label>
            <Input 
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
              className="border-pink-200 focus:ring-pink-500"
            />
          </div>

          <Button 
            type="submit" 
            disabled={createMutation.isPending}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/30"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Registrar Cajero
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}