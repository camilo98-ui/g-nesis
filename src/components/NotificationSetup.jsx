import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageCircle, Mail, Bell, BellRing, CheckCircle2, 
  AlertTriangle, Trophy, TrendingDown, Calendar, Save, Loader2, X, Smartphone
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export default function NotificationSetup({ storeId, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    whatsapp_number: '',
    email: '',
    alert_daily_summary: true,
    alert_low_performance: true,
    alert_budget_risk: true,
    alert_top_performer: true,
    alert_threshold_percentage: 70
  });

  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['notificationSettings', storeId],
    queryFn: async () => {
      const results = await base44.entities.NotificationSettings.filter({ store_id: storeId });
      return results[0] || null;
    },
    enabled: !!storeId && isOpen
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings({
        whatsapp_number: existingSettings.whatsapp_number || '',
        email: existingSettings.email || '',
        alert_daily_summary: existingSettings.alert_daily_summary ?? true,
        alert_low_performance: existingSettings.alert_low_performance ?? true,
        alert_budget_risk: existingSettings.alert_budget_risk ?? true,
        alert_top_performer: existingSettings.alert_top_performer ?? true,
        alert_threshold_percentage: existingSettings.alert_threshold_percentage || 70
      });
    }
  }, [existingSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSettings?.id) {
        return base44.entities.NotificationSettings.update(existingSettings.id, data);
      } else {
        return base44.entities.NotificationSettings.create({ ...data, store_id: storeId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationSettings', storeId]);
      toast.success('¡Configuración guardada! Las alertas llegarán a tus canales');
      onClose();
    },
    onError: () => {
      toast.error('Error al guardar la configuración');
    }
  });

  const handleSave = () => {
    if (!settings.whatsapp_number && !settings.email) {
      toast.error('Agrega al menos un canal de notificación (WhatsApp o Email)');
      return;
    }
    saveMutation.mutate(settings);
  };

  const sendTestMessage = async (channel) => {
    const message = `🍦 ¡Hola desde Popsy!\n\nEsta es una prueba de notificación.\n\n📊 Tus alertas están configuradas correctamente.\n\n¡Gracias por usar el sistema de gestión Popsy!`;
    
    if (channel === 'whatsapp' && settings.whatsapp_number) {
      const cleanNumber = settings.whatsapp_number.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Abriendo WhatsApp...');
    } else if (channel === 'email' && settings.email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: settings.email,
          subject: '🍦 Prueba de Notificación - Popsy',
          body: message.replace(/\n/g, '<br>')
        });
        toast.success('Correo de prueba enviado');
      } catch (e) {
        toast.error('Error al enviar el correo');
      }
    }
  };

  if (!isOpen) return null;

  const alertTypes = [
    { 
      key: 'alert_daily_summary', 
      label: 'Resumen Diario', 
      description: 'Recibe un resumen al final del día con ventas y rendimiento',
      icon: Calendar,
      color: 'text-blue-500'
    },
    { 
      key: 'alert_budget_risk', 
      label: 'Alerta de Presupuesto', 
      description: 'Notifica cuando hay riesgo de no cumplir la meta mensual',
      icon: AlertTriangle,
      color: 'text-amber-500'
    },
    { 
      key: 'alert_low_performance', 
      label: 'Bajo Rendimiento', 
      description: 'Alerta cuando un cajero está por debajo del promedio',
      icon: TrendingDown,
      color: 'text-red-500'
    },
    { 
      key: 'alert_top_performer', 
      label: 'Top Performers', 
      description: 'Celebra cuando un cajero supera sus metas',
      icon: Trophy,
      color: 'text-amber-500'
    },
    { 
      key: 'alert_quality_checklist', 
      label: 'Calidad & Aseo', 
      description: 'Notifica cuando se completa un checklist de limpieza',
      icon: CheckCircle2,
      color: 'text-teal-500'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 p-5 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BellRing className="w-7 h-7" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">Configurar Alertas</h2>
                <p className="text-sm text-white/80">WhatsApp y Correo</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* WhatsApp */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-gray-700 font-medium">
                <MessageCircle className="w-5 h-5 text-green-500" />
                WhatsApp
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="+57 300 123 4567"
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                    className="pl-10 border-gray-200 focus:border-green-400"
                  />
                </div>
                {settings.whatsapp_number && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendTestMessage('whatsapp')}
                    className="border-green-300 text-green-600 hover:bg-green-50"
                  >
                    Probar
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400">Incluye código de país (ej: +57 para Colombia)</p>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-gray-700 font-medium">
                <Mail className="w-5 h-5 text-blue-500" />
                Correo Electrónico
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                    className="pl-10 border-gray-200 focus:border-blue-400"
                  />
                </div>
                {settings.email && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendTestMessage('email')}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    Probar
                  </Button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-pink-500" />
                Tipos de Alertas
              </h3>

              <div className="space-y-4">
                {alertTypes.map((alert) => {
                  const Icon = alert.icon;
                  return (
                    <motion.div
                      key={alert.key}
                      whileHover={{ x: 3 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                          <Icon className={`w-5 h-5 ${alert.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{alert.label}</p>
                          <p className="text-xs text-gray-500">{alert.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings[alert.key]}
                        onCheckedChange={(checked) => setSettings({...settings, [alert.key]: checked})}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Threshold */}
            <div className="space-y-3 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
              <Label className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Umbral de Alerta</span>
                <span className="text-amber-600 font-bold">{settings.alert_threshold_percentage}%</span>
              </Label>
              <Slider
                value={[settings.alert_threshold_percentage]}
                onValueChange={(v) => setSettings({...settings, alert_threshold_percentage: v[0]})}
                min={50}
                max={90}
                step={5}
                className="py-2"
              />
              <p className="text-xs text-gray-500">
                Recibirás alertas cuando el cumplimiento esté por debajo de {settings.alert_threshold_percentage}%
              </p>
            </div>

            {/* Save Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-6 rounded-xl shadow-lg shadow-pink-500/30"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Guardar Configuración
              </Button>
            </motion.div>

            {/* Info */}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-700 text-center">
                💡 Las alertas se enviarán automáticamente según tu configuración
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}