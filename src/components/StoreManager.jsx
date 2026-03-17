import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Store, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Lista base de tiendas (hardcoded)
const BASE_STORES = [
  { code: "BTA 11", name: "CC PALATINO", displayName: "PALATINO" },
  { code: "BTA 37", name: "HOMECENTER CALLE 170", displayName: "HOMECENTER 170" },
  { code: "BTA 62", name: "CC FONTANAR", displayName: "FONTANAR" },
  { code: "BTA 49", name: "HOMECENTER CEDRITOS", displayName: "HOMECENTER CEDRITOS" },
  { code: "BTA 42", name: "CC BULEVAR NIZA", displayName: "BULEVAR NIZA" },
  { code: "BTA 85", name: "MANSION CAJICA", displayName: "MANSIÓN CAJICÁ" },
  { code: "BTA 52", name: "CC CENTRO SUBA", displayName: "CENTRO SUBA" },
  { code: "BTA 21", name: "CC CENTRO CHIA", displayName: "CENTRO CHÍA" },
  { code: "BTA 78", name: "CC PLAZA IMPERIAL 2", displayName: "PLAZA IMPERIAL 2" },
  { code: "BTA 18", name: "CC PLAZA IMPERIAL", displayName: "PLAZA IMPERIAL" },
  { code: "TUNJA 1", name: "CC UNICENTRO", displayName: "UNICENTRO TUNJA" },
  { code: "BTA 90", name: "CC PORTAL 80", displayName: "PORTAL 80" },
  { code: "BTA 59", name: "JUMBO 170", displayName: "JUMBO 170" },
  { code: "BTA 14", name: "CC PORTAL CL80 #2", displayName: "PORTAL 80 #2" },
  { code: "BTA 28", name: "CC DIVERPLAZA", displayName: "DIVERPLAZA" },
  { code: "BTA 89", name: "CC DIVERPLAZA 2", displayName: "DIVERPLAZA 2" },
  { code: "BTA 16", name: "CC SAN RAFAEL", displayName: "SAN RAFAEL" },
  { code: "BTA 13", name: "CC PORTAL CL 80 #1", displayName: "PORTAL 80 #1" },
  { code: "TUNJA 2", name: "CC VIVA TUNJA", displayName: "VIVA TUNJA" },
  { code: "BTA 92", name: "BOGOTA 92", displayName: "BOGOTÁ 92" },
  { code: "BTA 93", name: "CC COLINA", displayName: "CC COLINA" },
  { code: "BTA 94", name: "CC ECO PLAZA", displayName: "ECO PLAZA" },
  { code: "BTA 95", name: "CC CASA BLANCA", displayName: "CASA BLANCA" },
  { code: "BTA 96", name: "AV CHILE", displayName: "AV. CHILE" },
];

export { BASE_STORES };

export default function StoreManager() {
  const [expanded, setExpanded] = useState(false);
  const [activeStoreCodes, setActiveStoreCodes] = useState(null); // null = todas activas
  const [newStore, setNewStore] = useState({ code: '', name: '', displayName: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [customStores, setCustomStores] = useState([]); // tiendas adicionales creadas por usuario
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Cargar preferencias del usuario (qué tiendas están activas)
    base44.auth.me().then(user => {
      if (user?.store_config?.activeStoreCodes !== undefined) {
        setActiveStoreCodes(user.store_config.activeStoreCodes);
      }
    }).catch(() => {});
    // Cargar tiendas custom desde entidad compartida (visible para todos los usuarios)
    base44.entities.Store.list().then(stores => {
      setCustomStores(stores.map(s => ({ code: s.code, name: s.name, displayName: s.name, _entityId: s.id })));
    }).catch(() => {});
  }, []);

  const allStores = [...BASE_STORES, ...customStores];

  const isActive = (code) => {
    if (activeStoreCodes === null) return true;
    if (activeStoreCodes.includes(code)) return true;
    // Tiendas BASE nuevas (no en la config guardada) = activas por defecto
    const customCodes = new Set(customStores.map(s => s.code));
    if (!customCodes.has(code)) return true;
    return false;
  };

  const toggleStore = (code) => {
    if (activeStoreCodes === null) {
      // desactivar todas menos esta
      setActiveStoreCodes(allStores.map(s => s.code).filter(c => c !== code));
    } else {
      if (activeStoreCodes.includes(code)) {
        setActiveStoreCodes(activeStoreCodes.filter(c => c !== code));
      } else {
        setActiveStoreCodes([...activeStoreCodes, code]);
      }
    }
  };

  const activateAll = () => setActiveStoreCodes(null);

  const handleAddStore = async () => {
    if (!newStore.code.trim() || !newStore.name.trim()) {
      toast.error('El código y nombre son obligatorios');
      return;
    }
    const exists = allStores.find(s => s.code.toLowerCase() === newStore.code.toLowerCase());
    if (exists) {
      toast.error('Ya existe una tienda con ese código');
      return;
    }
    const displayName = (newStore.displayName.trim() || newStore.name.trim()).toUpperCase();
    const store = {
      code: newStore.code.trim().toUpperCase(),
      name: displayName,
    };
    setSaving(true);
    try {
      // Guardar en entidad Store (compartida entre todos los usuarios)
      const created = await base44.entities.Store.create(store);
      setCustomStores(prev => [...prev, { ...store, displayName, _entityId: created.id }]);
      setNewStore({ code: '', name: '', displayName: '' });
      setShowAddForm(false);
      toast.success(`Tienda ${displayName} añadida`);
    } catch {
      toast.error('Error al guardar la tienda');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCustomStore = async (code) => {
    const store = customStores.find(s => s.code === code);
    if (store?._entityId) {
      try {
        await base44.entities.Store.delete(store._entityId);
      } catch { }
    }
    setCustomStores(prev => prev.filter(s => s.code !== code));
    if (activeStoreCodes) setActiveStoreCodes(prev => prev.filter(c => c !== code));
    toast.success('Tienda eliminada');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ store_config: { activeStoreCodes } });
      toast.success('¡Configuración de tiendas guardada!');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = activeStoreCodes === null ? allStores.length : activeStoreCodes.length;

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-fuchsia-100 shadow-xl overflow-hidden">
      <CardHeader
        className="bg-gradient-to-r from-rose-500 to-pink-500 text-white cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Gestión de Tiendas</CardTitle>
              <p className="text-white/80 text-sm mt-0.5">
                {activeCount} tienda{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''} de {allStores.length}
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-white/80" /> : <ChevronDown className="w-5 h-5 text-white/80" />}
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <CardContent className="pt-5 space-y-4">

              {/* Acciones rápidas */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={activateAll} className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  ✅ Activar todas
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(s => !s)} className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50">
                  <Plus className="w-3 h-3 mr-1" />
                  Nueva tienda
                </Button>
              </div>

              {/* Formulario nueva tienda */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3"
                  >
                    <p className="text-sm font-semibold text-rose-800">➕ Agregar nueva tienda</p>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600">Código (ej: BTA 99) *</Label>
                        <Input
                          placeholder="BTA 99"
                          value={newStore.code}
                          onChange={e => setNewStore(s => ({ ...s, code: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Nombre completo *</Label>
                        <Input
                          placeholder="CC NOMBRE CENTRO COMERCIAL"
                          value={newStore.name}
                          onChange={e => setNewStore(s => ({ ...s, name: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Nombre corto (opcional)</Label>
                        <Input
                          placeholder="NOMBRE CORTO"
                          value={newStore.displayName}
                          onChange={e => setNewStore(s => ({ ...s, displayName: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddStore} className="bg-rose-500 hover:bg-rose-600 text-white text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Agregar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)} className="text-xs">
                        <X className="w-3 h-3 mr-1" /> Cancelar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lista de tiendas */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {/* Tiendas personalizadas primero */}
                {customStores.length > 0 && (
                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mt-1">Tiendas agregadas</p>
                )}
                {customStores.map(store => (
                  <div key={store.code} className="flex items-center gap-2 p-2.5 rounded-lg border border-rose-200 bg-rose-50">
                    <button
                      onClick={() => toggleStore(store.code)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive(store.code) ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'
                      }`}
                    >
                      {isActive(store.code) && <span className="text-white text-xs">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-800 truncate block">{store.displayName}</span>
                      <span className="text-xs text-gray-500">{store.code}</span>
                    </div>
                    <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px]">Nueva</Badge>
                    <button onClick={() => handleRemoveCustomStore(store.code)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {customStores.length > 0 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Tiendas del sistema</p>
                )}

                {/* Tiendas base */}
                {BASE_STORES.map(store => (
                  <div key={store.code} className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                    isActive(store.code) ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <button
                      onClick={() => toggleStore(store.code)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive(store.code) ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'
                      }`}
                    >
                      {isActive(store.code) && <span className="text-white text-xs">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium truncate block ${isActive(store.code) ? 'text-gray-800' : 'text-gray-400'}`}>
                        {store.displayName}
                      </span>
                      <span className="text-xs text-gray-400">{store.code}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guardar */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
                size="sm"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                💡 Los cambios afectan qué tiendas aparecen en el selector principal
              </p>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}