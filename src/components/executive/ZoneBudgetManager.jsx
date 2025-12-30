import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Save, DollarSign, Calendar, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ZoneBudgetManager({ zoneName, onClose }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    sales_budget: '',
    notes: ''
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['zoneBudgets', zoneName],
    queryFn: () => base44.entities.ZoneBudget.filter({ zone_name: zoneName })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ZoneBudget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['zoneBudgets']);
      setFormData({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), sales_budget: '', notes: '' });
      setEditing(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ZoneBudget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['zoneBudgets']);
      setEditing(null);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (budgetId) => {
      // Primero desactivar todos los presupuestos de la zona
      const allBudgets = await base44.entities.ZoneBudget.filter({ zone_name: zoneName });
      await Promise.all(
        allBudgets.map(b => base44.entities.ZoneBudget.update(b.id, { is_active: false }))
      );
      // Luego activar el seleccionado
      await base44.entities.ZoneBudget.update(budgetId, { is_active: true });
    },
    onSuccess: () => queryClient.invalidateQueries(['zoneBudgets'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ZoneBudget.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['zoneBudgets'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      zone_name: zoneName,
      month: parseInt(formData.month),
      year: parseInt(formData.year),
      sales_budget: parseFloat(formData.sales_budget),
      notes: formData.notes
    };

    if (editing) {
      updateMutation.mutate({ id: editing, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (budget) => {
    setEditing(budget.id);
    setFormData({
      month: budget.month,
      year: budget.year,
      sales_budget: budget.sales_budget,
      notes: budget.notes || ''
    });
  };

  const formatCurrency = (v) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(v);

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Presupuesto de Zona</h2>
                <p className="text-sm text-slate-300">{zoneName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">
              {editing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Mes</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  required
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Año</label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-2 block">Presupuesto de Ventas (COP)</label>
              <Input
                type="number"
                value={formData.sales_budget}
                onChange={(e) => setFormData({ ...formData, sales_budget: e.target.value })}
                placeholder="0"
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-2 block">Notas (opcional)</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
                className="bg-white/10 border-white/20 text-white"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {editing ? 'Actualizar' : 'Crear'}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setFormData({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), sales_budget: '', notes: '' });
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>

          {/* List */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white mb-4">Presupuestos Registrados</h3>
            {budgets.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No hay presupuestos registrados</p>
            ) : (
              budgets
                .sort((a, b) => b.year - a.year || b.month - a.month)
                .map((budget) => (
                  <div
                    key={budget.id}
                    className={`rounded-lg p-4 border flex items-center justify-between transition-all ${
                      budget.is_active 
                        ? 'bg-emerald-500/20 border-emerald-500/50' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <p className="font-bold text-white">
                          {monthNames[budget.month - 1]} {budget.year}
                        </p>
                        {budget.is_active && (
                          <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-black text-white mb-1">
                        {formatCurrency(budget.sales_budget)}
                      </p>
                      {budget.notes && (
                        <p className="text-xs text-slate-400">{budget.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActiveMutation.mutate(budget.id)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          budget.is_active
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        title={budget.is_active ? 'Presupuesto activo' : 'Marcar como activo'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(budget)}
                        className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <Pencil className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(budget.id)}
                        className="w-9 h-9 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}