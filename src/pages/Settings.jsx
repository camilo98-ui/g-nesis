import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AnimatedIcon from '@/components/AnimatedIcon';
import BackupToGoogleDrive from '@/components/BackupToGoogleDrive';
import StoreManager from '@/components/StoreManager';
import { ArrowLeft, Settings as SettingsIcon, MessageCircle, Bell, Save, Loader2, Check, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    whatsappNumber: '',
    notifyDailySummary: true,
    notifyLowPerformance: true,
    notifyBudgetAlert: true,
    notifyCashierAlerts: false
  });

  useEffect(() => {
    // Load settings from user profile
    base44.auth.me().then(user => {
      if (user?.whatsapp_settings) {
        setSettings(prev => ({ ...prev, ...user.whatsapp_settings }));
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        whatsapp_settings: settings
      });
      toast.success('¡Configuración guardada!');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-fuchsia-50/30 to-purple-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-fuchsia-100">
              <ArrowLeft className="w-5 h-5 text-fuchsia-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <AnimatedIcon icon={SettingsIcon} color="purple" size="md" />
            <h1 className="text-2xl md:text-3xl font-bold text-fuchsia-800">Configuración</h1>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* WhatsApp Integration */}
          <Card className="bg-white/70 backdrop-blur-sm border-fuchsia-100 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Integración WhatsApp</CardTitle>
                  <CardDescription className="text-white/80">
                    Recibe alertas y notificaciones en tu WhatsApp
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  Número de WhatsApp
                </Label>
                <Input 
                  placeholder="Ej: +57 300 123 4567"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="border-fuchsia-200 focus:ring-fuchsia-500"
                />
                <p className="text-xs text-gray-400">Incluye el código de país (+57 para Colombia)</p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-fuchsia-200 to-transparent" />

              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-fuchsia-500" />
                  Alertas a recibir
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-fuchsia-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-700">Resumen diario</p>
                      <p className="text-xs text-gray-500">Recibe un resumen de ventas al final del día</p>
                    </div>
                    <Switch 
                      checked={settings.notifyDailySummary}
                      onCheckedChange={(checked) => setSettings({ ...settings, notifyDailySummary: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-fuchsia-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-700">Alerta de bajo rendimiento</p>
                      <p className="text-xs text-gray-500">Cuando las ventas están por debajo del 80%</p>
                    </div>
                    <Switch 
                      checked={settings.notifyLowPerformance}
                      onCheckedChange={(checked) => setSettings({ ...settings, notifyLowPerformance: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-fuchsia-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-700">Alerta de presupuesto</p>
                      <p className="text-xs text-gray-500">Cuando se acerca o supera el presupuesto</p>
                    </div>
                    <Switch 
                      checked={settings.notifyBudgetAlert}
                      onCheckedChange={(checked) => setSettings({ ...settings, notifyBudgetAlert: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-fuchsia-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-700">Alertas a cajeros</p>
                      <p className="text-xs text-gray-500">Enviar notificaciones a cada cajero</p>
                    </div>
                    <Switch 
                      checked={settings.notifyCashierAlerts}
                      onCheckedChange={(checked) => setSettings({ ...settings, notifyCashierAlerts: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Manager */}
          <StoreManager />

          {/* Google Drive Backup */}
          <BackupToGoogleDrive />

          {/* Save Button */}
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white shadow-lg shadow-fuchsia-500/30"
            size="lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Guardar Configuración
          </Button>
        </motion.div>
      </div>
    </div>
  );
}