import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BADGE_CONFIG } from './BadgesDisplay';
import { 
  Settings, Save, X, Target, DollarSign, Receipt, 
  Gift, Calendar, Loader2, CheckCircle, Edit2, Plus, Award, Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';

const KPI_OPTIONS = [
  { value: 'sales', label: 'Ventas Totales', icon: DollarSign, unit: '$' },
  { value: 'ticket_avg', label: 'Ticket Promedio', icon: Receipt, unit: '$' },
  { value: 'transactions', label: 'Transacciones', icon: Zap, unit: '' },
  { value: 'suggested', label: 'Sugeridos', icon: Gift, unit: '' },
  { value: 'days_worked', label: 'Días Trabajados', icon: Calendar, unit: '' },
];

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
];

export default function BadgeConfigManager({ storeId, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [editingBadge, setEditingBadge] = useState(null);
  const [formData, setFormData] = useState({
    kpi_type: 'sales',
    goal_value: '',
    goal_period: 'monthly',
    points_awarded: 10,
    is_active: true,
    description: ''
  });

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['badgeConfigs', storeId],
    queryFn: () => base44.entities.BadgeConfig.filter({ store_id: storeId }),
    enabled: !!storeId && isOpen
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const configData = {
        store_id: storeId,
        badge_type: editingBadge,
        kpi_type: data.kpi_type,
        goal_value: parseFloat(data.goal_value) || 0,
        goal_period: data.goal_period,
        points_awarded: parseInt(data.points_awarded) || 10,
        is_active: data.is_active,
        description: data.description
      };

      const existing = configs.find(c => c.badge_type === editingBadge);
      if (existing?.id) {
        return base44.entities.BadgeConfig.update(existing.id, configData);
      }
      return base44.entities.BadgeConfig.create(configData);
    },
    onSuccess: () => {
      toast.success('Configuración guardada');
      queryClient.invalidateQueries(['badgeConfigs']);
      setEditingBadge(null);
    }
  });

  const handleEdit = (badgeType) => {
    const existing = configs.find(c => c.badge_type === badgeType);
    setFormData({
      kpi_type: existing?.kpi_type || 'sales',
      goal_value: existing?.goal_value || '',
      goal_period: existing?.goal_period || BADGE_CONFIG[badgeType]?.goalType || 'monthly',
      points_awarded: existing?.points_awarded || 10,
      is_active: existing?.is_active !== false,
      description: existing?.description || ''
    });
    setEditingBadge(badgeType);
  };

  const getConfigForBadge = (badgeType) => {
    return configs.find(c => c.badge_type === badgeType);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-violet-500" />
            Configurar Metas por Insignia
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Define qué KPI y meta necesita cada cajero para ganar cada insignia.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(BADGE_CONFIG).map(([badgeType, config]) => {
                const Icon = config.icon;
                const savedConfig = getConfigForBadge(badgeType);
                const isConfigured = !!savedConfig;

                return (
                  <motion.div
                    key={badgeType}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isConfigured 
                        ? 'border-emerald-200 bg-emerald-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-violet-200'
                    }`}
                    onClick={() => handleEdit(badgeType)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{config.label}</p>
                        {isConfigured ? (
                          <p className="text-xs text-emerald-600">
                            {KPI_OPTIONS.find(k => k.value === savedConfig.kpi_type)?.label}: {savedConfig.goal_value.toLocaleString()} • {savedConfig.points_awarded}pts
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">Sin configurar</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isConfigured && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal de edición */}
        <AnimatePresence>
          {editingBadge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setEditingBadge(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  {BADGE_CONFIG[editingBadge] && (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${BADGE_CONFIG[editingBadge].color} flex items-center justify-center`}>
                      {React.createElement(BADGE_CONFIG[editingBadge].icon, { className: "w-6 h-6 text-white" })}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{BADGE_CONFIG[editingBadge]?.label}</h3>
                    <p className="text-xs text-gray-500">{BADGE_CONFIG[editingBadge]?.desc}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-600">KPI a Medir</Label>
                    <Select value={formData.kpi_type} onValueChange={(v) => setFormData({ ...formData, kpi_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KPI_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <opt.icon className="w-4 h-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Meta a Alcanzar</Label>
                    <Input
                      type="number"
                      placeholder="Ej: 5000000"
                      value={formData.goal_value}
                      onChange={(e) => setFormData({ ...formData, goal_value: e.target.value })}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {KPI_OPTIONS.find(k => k.value === formData.kpi_type)?.unit === '$' ? 'Valor en pesos' : 'Cantidad'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Período</Label>
                      <Select value={formData.goal_period} onValueChange={(v) => setFormData({ ...formData, goal_period: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERIOD_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Puntos</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={formData.points_awarded}
                        onChange={(e) => setFormData({ ...formData, points_awarded: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Descripción (opcional)</Label>
                    <Input
                      placeholder="Descripción personalizada..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Insignia Activa</span>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setEditingBadge(null)} className="flex-1">
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                  <Button
                    onClick={() => saveMutation.mutate(formData)}
                    disabled={saveMutation.isPending || !formData.goal_value}
                    className="flex-1 bg-violet-500 hover:bg-violet-600"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Guardar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}