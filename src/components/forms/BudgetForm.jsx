import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Target, DollarSign, Receipt, Zap, Gift, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

const ACCENT = '#e879f9';
const BLUE = '#818cf8';

const glass = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

function DarkInput({ label, icon: Icon, color, type = 'number', placeholder = '0', value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(255,255,255,0.35)' }}>
        <Icon className="w-3 h-3" style={{ color }} />
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none transition-all placeholder:text-white/20"
          style={{
            background: focused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused ? color + '60' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: focused ? `0 0 0 3px ${color}15` : 'none',
          }}
        />
      </div>
    </div>
  );
}

export default function BudgetForm({ storeId, onSuccess, editingBudget, onClearEdit }) {
  const queryClient = useQueryClient();
  const currentDate = new Date();

  const [formData, setFormData] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    sales_budget: '',
    tickets_budget: '',
    transactions_budget: '',
    suggested_budget: ''
  });

  React.useEffect(() => {
    if (editingBudget) {
      setFormData({
        month: editingBudget.month,
        year: editingBudget.year,
        sales_budget: editingBudget.sales_budget || '',
        tickets_budget: editingBudget.tickets_budget || '',
        transactions_budget: editingBudget.transactions_budget || '',
        suggested_budget: editingBudget.suggested_budget || ''
      });
    }
  }, [editingBudget]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (editingBudget) {
        return base44.entities.Budget.update(editingBudget.id, {
          store_id: storeId,
          month: parseInt(data.month),
          year: parseInt(data.year),
          sales_budget: parseFloat(data.sales_budget) || 0,
          tickets_budget: parseInt(data.tickets_budget) || 0,
          transactions_budget: parseInt(data.transactions_budget) || 0,
          suggested_budget: parseInt(data.suggested_budget) || 0
        });
      }
      const existing = await base44.entities.Budget.filter({
        store_id: storeId, month: parseInt(data.month), year: parseInt(data.year)
      });
      const budgetData = {
        store_id: storeId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        sales_budget: parseFloat(data.sales_budget) || 0,
        tickets_budget: parseInt(data.tickets_budget) || 0,
        transactions_budget: parseInt(data.transactions_budget) || 0,
        suggested_budget: parseInt(data.suggested_budget) || 0
      };
      if (existing.length > 0) return base44.entities.Budget.update(existing[0].id, budgetData);
      return base44.entities.Budget.create(budgetData);
    },
    onSuccess: () => {
      toast.success('¡Presupuesto guardado!');
      queryClient.invalidateQueries(['budgets']);
      onSuccess?.();
      onClearEdit?.();
      setFormData({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        sales_budget: '', tickets_budget: '', transactions_budget: '', suggested_budget: ''
      });
    },
    onError: () => toast.error('Error al guardar el presupuesto'),
  });

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);
  const set = (k) => (e) => setFormData(f => ({ ...f, [k]: e.target.value }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-2xl overflow-hidden" style={{ ...glass, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: editingBudget ? `linear-gradient(135deg, ${ACCENT}10, transparent)` : 'transparent' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT}40, ${BLUE}30)`, boxShadow: `0 0 20px ${ACCENT}25` }}>
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {editingBudget ? `Modificando ${MONTHS.find(m => m.value === editingBudget.month)?.label} ${editingBudget.year}` : 'Configurar metas mensuales'}
              </p>
            </div>
          </div>
          {editingBudget && (
            <button onClick={() => {
              onClearEdit?.();
              setFormData({ month: currentDate.getMonth() + 1, year: currentDate.getFullYear(), sales_budget: '', tickets_budget: '', transactions_budget: '', suggested_budget: '' });
            }} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X className="w-3.5 h-3.5 text-white/50" />
            </button>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}
          className="p-5 space-y-5">

          {/* Month / Year selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.35)' }}>Mes</label>
              <Select value={formData.month.toString()}
                onValueChange={(val) => setFormData(f => ({ ...f, month: parseInt(val) }))}>
                <SelectTrigger className="rounded-xl text-white text-sm font-semibold h-11 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'none' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {MONTHS.map(m => (
                    <SelectItem key={m.value} value={m.value.toString()}
                      className="text-white/80 hover:text-white focus:text-white text-sm">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.35)' }}>Año</label>
              <Select value={formData.year.toString()}
                onValueChange={(val) => setFormData(f => ({ ...f, year: parseInt(val) }))}>
                <SelectTrigger className="rounded-xl text-white text-sm font-semibold h-11 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'none' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()}
                      className="text-white/80 hover:text-white focus:text-white text-sm">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

          {/* Metric inputs */}
          <div className="grid grid-cols-2 gap-4">
            <DarkInput label="Ventas" icon={DollarSign} color="#34d399"
              value={formData.sales_budget} onChange={set('sales_budget')} />
            <DarkInput label="Ticket Prom." icon={Receipt} color={BLUE}
              value={formData.tickets_budget} onChange={set('tickets_budget')} />
            <DarkInput label="Transacciones" icon={Zap} color={ACCENT}
              value={formData.transactions_budget} onChange={set('transactions_budget')} />
            <DarkInput label="Sugeridos" icon={Gift} color="#fb923c"
              value={formData.suggested_budget} onChange={set('suggested_budget')} />
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={createMutation.isPending}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${BLUE})`,
              boxShadow: `0 0 30px ${ACCENT}35, 0 4px 20px rgba(0,0,0,0.4)`,
            }}>
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.05)' }} />
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {editingBudget ? 'Actualizar Presupuesto' : 'Guardar Presupuesto'}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}