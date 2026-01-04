import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Save, Settings, Gift, Clock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_PRIZES_TIENDA = [
  { id: 1, name: 'Descanso remunerado', value: 0, color: '#FFB5C5', emoji: '🏖️' },
  { id: 2, name: 'Bono $30.000 Olímpica', value: 30000, color: '#D4A5D8', emoji: '💳' },
  { id: 3, name: 'Malteada chocolate', value: 0, color: '#A5D8FF', emoji: '🍫' },
  { id: 4, name: 'Entradas Cinecolombia', value: 0, color: '#FFD9A5', emoji: '🎬' },
  { id: 5, name: 'Domingo remunerado', value: 0, color: '#C9FFD4', emoji: '☀️' },
];

const DEFAULT_PRIZES_DISTRITO = [
  { id: 1, name: 'Pase Piscilago 4 personas', value: 0, color: '#FFB5C5', emoji: '🏊' },
  { id: 2, name: 'Domingo remunerado', value: 0, color: '#D4A5D8', emoji: '☀️' },
  { id: 3, name: 'Descanso remunerado', value: 0, color: '#A5D8FF', emoji: '🏖️' },
  { id: 4, name: 'Entradas Cine PREMIUM', value: 0, color: '#FFD9A5', emoji: '🎥' },
  { id: 5, name: 'Litro de helado', value: 0, color: '#C9FFD4', emoji: '🍦' },
  { id: 6, name: 'Descanso + Malteada', value: 0, color: '#FFE5CC', emoji: '🍹' },
  { id: 7, name: 'Bono $80.000 Olímpica', value: 80000, color: '#FFD0E5', emoji: '💰' },
];

const COLORS = ['#FFB5C5', '#D4A5D8', '#A5D8FF', '#FFD9A5', '#C9FFD4', '#FFE5CC', '#FFD0E5', '#B5E7FF'];
const EMOJIS = ['🏖️', '💳', '🍫', '🎬', '☀️', '🍦', '🍹', '💰', '🎁', '🏊', '🎥', '🌟'];

export default function RouletteConfigManager({ storeId }) {
  const [awardType, setAwardType] = useState('tienda');
  const [prizes, setPrizes] = useState([]);
  const [spinDuration, setSpinDuration] = useState(6500);
  const [validationCedula, setValidationCedula] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['rouletteConfig', storeId],
    queryFn: () => base44.entities.RouletteConfig.filter({ store_id: storeId })
  });

  const activeConfig = configs.find(c => c.is_active);

  React.useEffect(() => {
    if (activeConfig) {
      setAwardType(activeConfig.award_type);
      setPrizes(activeConfig.prizes ? JSON.parse(activeConfig.prizes) : (activeConfig.award_type === 'distrito' ? DEFAULT_PRIZES_DISTRITO : DEFAULT_PRIZES_TIENDA));
      setSpinDuration(activeConfig.spin_duration || 6500);
      setValidationCedula(activeConfig.validation_cedula || '');
    } else {
      setPrizes(awardType === 'distrito' ? DEFAULT_PRIZES_DISTRITO : DEFAULT_PRIZES_TIENDA);
    }
  }, [activeConfig, awardType]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log('💾 Guardando configuración:', { storeId, awardType, prizes });
      
      // PRIMERO: Desactivar TODAS las configs anteriores de este tipo
      const allConfigs = await base44.entities.RouletteConfig.filter({ store_id: storeId });
      const toDeactivate = allConfigs.filter(c => c.award_type === awardType);
      
      console.log('🔄 Desactivando configs anteriores:', toDeactivate.length);
      for (const config of toDeactivate) {
        await base44.entities.RouletteConfig.update(config.id, { is_active: false });
      }
      
      // SEGUNDO: Crear la nueva configuración activa
      const configData = {
        store_id: storeId,
        award_type: awardType,
        prizes: JSON.stringify(prizes),
        spin_duration: spinDuration,
        validation_cedula: validationCedula,
        is_active: true
      };

      console.log('📦 Creando nueva config:', configData);
      const result = await base44.entities.RouletteConfig.create(configData);
      console.log('✅ Config creada:', result);
      console.log('✅ Premios guardados:', prizes);
      
      return result;
    },
    onSuccess: async (data) => {
      console.log('========== GUARDADO EXITOSO ==========');
      console.log('✅ Config guardada:', data);
      console.log('📝 Premios guardados:', prizes);
      console.log('📝 JSON guardado:', JSON.stringify(prizes));

      // Limpiar COMPLETAMENTE el caché
      await queryClient.cancelQueries({ queryKey: ['rouletteConfig'] });
      await queryClient.invalidateQueries({ queryKey: ['rouletteConfig'] });

      // Verificar que se guardó correctamente
      const verify = await base44.entities.RouletteConfig.filter({ 
        store_id: storeId, 
        award_type: awardType, 
        is_active: true 
      });
      console.log('🔍 Verificación - Configs activas:', verify.length);
      console.log('🔍 Verificación - Config:', JSON.stringify(verify[0], null, 2));
      console.log('======================================');

      toast.success('✅ Configuración guardada exitosamente');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      console.error('❌ Error al guardar configuración:', error);
      toast.error(`❌ Error al guardar: ${error.message || 'Intenta de nuevo'}`);
    }
  });

  const addPrize = () => {
    const newId = Math.max(...prizes.map(p => p.id), 0) + 1;
    setPrizes([...prizes, {
      id: newId,
      name: `Nuevo Premio ${newId}`,
      value: 0,
      color: COLORS[newId % COLORS.length],
      emoji: EMOJIS[newId % EMOJIS.length]
    }]);
  };

  const removePrize = (id) => {
    if (prizes.length <= 3) {
      toast.error('Debe haber al menos 3 premios');
      return;
    }
    setPrizes(prizes.filter(p => p.id !== id));
  };

  const updatePrize = (id, field, value) => {
    setPrizes(prizes.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800">Configurar Ruleta</h2>
          <p className="text-sm text-gray-500">Personaliza premios y ajustes</p>
        </div>
      </div>



      {/* Configuración de Seguridad */}
      <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-800">Validación de Acceso</h3>
        </div>
        <p className="text-xs text-gray-600 mb-3">El embajador debe ingresar esta cédula para poder girar la ruleta</p>
        <Input
          placeholder="Ej: 1234567890"
          value={validationCedula}
          onChange={(e) => setValidationCedula(e.target.value)}
          className="bg-white"
        />
      </Card>

      {/* Tiempo de Giro */}
      <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-gray-800">Tiempo de Giro</h3>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={spinDuration}
            onChange={(e) => setSpinDuration(parseInt(e.target.value))}
            className="bg-white max-w-xs"
            min={3000}
            max={15000}
            step={500}
          />
          <span className="text-sm text-gray-600">milisegundos ({(spinDuration / 1000).toFixed(1)}s)</span>
        </div>
      </Card>

      {/* Lista de Premios */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-600" />
            Premios ({prizes.length})
          </h3>
          <Button onClick={addPrize} size="sm" className="bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {prizes.map((prize) => (
            <motion.div
              key={prize.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Emoji</label>
                  <Input
                    value={prize.emoji}
                    onChange={(e) => updatePrize(prize.id, 'emoji', e.target.value)}
                    className="bg-white text-2xl text-center h-10"
                    maxLength={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600 mb-1 block">Nombre del Premio</label>
                  <Input
                    value={prize.name}
                    onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Valor ($)</label>
                  <Input
                    type="number"
                    value={prize.value}
                    onChange={(e) => updatePrize(prize.id, 'value', parseInt(e.target.value) || 0)}
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: prize.color }} />
                <Input
                  type="color"
                  value={prize.color}
                  onChange={(e) => updatePrize(prize.id, 'color', e.target.value)}
                  className="w-10 h-8 p-0 border-0"
                />
              </div>
              <Button
                onClick={() => removePrize(prize.id)}
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Guardar */}
      <Button
        onClick={() => saveMutation.mutate()}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-6 text-lg font-bold"
        disabled={saveMutation.isPending}
      >
        <Save className="w-5 h-5 mr-2" />
        {saveMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
      </Button>

      {/* Mensaje de éxito */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <p className="font-bold text-lg">¡Guardado!</p>
            <p className="text-sm opacity-90">Configuración actualizada correctamente</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}