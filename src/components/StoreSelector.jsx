import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Lock, Eye, EyeOff, Settings, Save, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { BASE_STORES } from '@/components/StoreManager';

const STORES = BASE_STORES;


// Helper para obtener nombre corto sin BTA/código
const getDisplayName = (code) => {
  const store = STORES.find((s) => s.code === code);
  return store?.displayName || store?.name || code;
};

export { STORES, getDisplayName };

// Componente para editar contraseñas por rol
function RolePasswordsEditor({ storeCode, rolePasswords, onUpdate }) {
  const [liderPassword, setLiderPassword] = useState('');
  const [embajadorPassword, setEmbajadorPassword] = useState('');
  const [showLider, setShowLider] = useState(false);
  const [showEmbajador, setShowEmbajador] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (storeCode) {
      const lider = rolePasswords.find(p => p.store_code === storeCode && p.role === 'lider');
      const embajador = rolePasswords.find(p => p.store_code === storeCode && p.role === 'embajador');
      setLiderPassword(lider?.password || '');
      setEmbajadorPassword(embajador?.password || '');
    }
  }, [storeCode, rolePasswords]);

  const saveMutation = useMutation({
    mutationFn: async ({ role, password }) => {
      const existing = rolePasswords.find(p => p.store_code === storeCode && p.role === role);
      if (password) {
        if (existing) {
          return base44.entities.RolePassword.update(existing.id, { password });
        } else {
          return base44.entities.RolePassword.create({ store_code: storeCode, role, password });
        }
      } else if (existing) {
        return base44.entities.RolePassword.delete(existing.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePasswords'] });
      onUpdate();
    }
  });

  return (
    <div className="space-y-4 border-t pt-4">
      <p className="text-sm font-semibold text-gray-700">Contraseñas por Rol</p>
      
      {/* Líder */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">👑 Líder</Badge>
        </div>
        <div className="relative">
          <Input
            type={showLider ? "text" : "password"}
            placeholder="Contraseña para líderes"
            value={liderPassword}
            onChange={(e) => setLiderPassword(e.target.value)}
            className="pr-20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLider(!showLider)}
              className="text-gray-400 hover:text-gray-600">
              {showLider ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate({ role: 'lider', password: liderPassword })}
              disabled={saveMutation.isPending}
              className="h-7 px-2 text-xs"
            >
              {saveMutation.isPending ? '...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Embajador */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-pink-100 text-pink-700 border-pink-200">💫 Embajador</Badge>
        </div>
        <div className="relative">
          <Input
            type={showEmbajador ? "text" : "password"}
            placeholder="Contraseña para embajadores"
            value={embajadorPassword}
            onChange={(e) => setEmbajadorPassword(e.target.value)}
            className="pr-20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmbajador(!showEmbajador)}
              className="text-gray-400 hover:text-gray-600">
              {showEmbajador ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate({ role: 'embajador', password: embajadorPassword })}
              disabled={saveMutation.isPending}
              className="h-7 px-2 text-xs"
            >
              {saveMutation.isPending ? '...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoreSelector({ selectedStore, onStoreChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [passwordDialog, setPasswordDialog] = useState({ open: false, store: null });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [editPasswordDialog, setEditPasswordDialog] = useState({ open: false, store: null });
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [storeConfig, setStoreConfig] = useState(null); // { activeStoreCodes, customStores }

  const queryClient = useQueryClient();

  const [customStores, setCustomStores] = useState([]);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.store_config) setStoreConfig(user.store_config);
    }).catch(() => {});
    // Leer tiendas custom desde entidad compartida (excluir las que ya están en BASE_STORES)
    base44.entities.Store.list().then(stores => {
      const baseCodes = new Set(STORES.map(s => s.code));
      setCustomStores(stores.filter(s => !baseCodes.has(s.code)).map(s => ({ code: s.code, name: s.name, displayName: s.name })));
    }).catch(() => {});
  }, []);

  // Fetch store passwords
  const { data: storePasswords = [] } = useQuery({
    queryKey: ['storePasswords'],
    queryFn: () => base44.entities.StorePassword.list()
  });

  // Fetch role passwords
  const { data: rolePasswords = [] } = useQuery({
    queryKey: ['rolePasswords'],
    queryFn: () => base44.entities.RolePassword.list()
  });

  // Mutation to save password
  const savePasswordMutation = useMutation({
    mutationFn: async ({ storeCode, password }) => {
      const existing = storePasswords.find((p) => p.store_code === storeCode);
      if (existing) {
        return base44.entities.StorePassword.update(existing.id, { password });
      } else {
        return base44.entities.StorePassword.create({ store_code: storeCode, password });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storePasswords'] });
      setEditPasswordDialog({ open: false, store: null });
      setNewPassword('');
    }
  });

  // Calcular lista de tiendas activas según storeConfig
  const activeStores = useMemo(() => {
    const allStores = [...STORES, ...customStores];
    if (!storeConfig?.activeStoreCodes) return allStores;
    return allStores.filter(s => storeConfig.activeStoreCodes.includes(s.code));
  }, [storeConfig, customStores]);

  const filteredStores = useMemo(() => {
    if (!search.trim()) return activeStores;
    const term = search.toLowerCase().trim();
    return activeStores.filter((s) => {
      const code = s.code.toLowerCase();
      const name = s.name.toLowerCase();
      const displayName = (s.displayName || '').toLowerCase();
      // Extraer solo el número del código (ej: "BTA 11" -> "11")
      const codeNumber = code.replace(/[^0-9]/g, '');
      return (
        code.includes(term) ||
        name.includes(term) ||
        displayName.includes(term) ||
        codeNumber.includes(term) ||
        // Buscar por iniciales de palabras (ej: "pi" -> "PLAZA IMPERIAL")
        name.split(' ').some(word => word.toLowerCase().startsWith(term)) ||
        displayName.split(' ').some(word => word.toLowerCase().startsWith(term))
      );
    });
  }, [search, activeStores]);

  const selectedStoreName = [...STORES, ...customStores].find((s) => s.code === selectedStore)?.name || '';

  const handleStoreClick = (store) => {
    onStoreChange(store.code);
    setOpen(false);
    setSearch('');
  };

  const handlePasswordSubmit = () => {
    const storePassword = storePasswords.find((p) => p.store_code === passwordDialog.store.code);
    if (passwordInput === storePassword?.password) {
      onStoreChange(passwordDialog.store.code);
      setPasswordDialog({ open: false, store: null });
      setPasswordInput('');
      setOpen(false);
      setSearch('');
    } else {
      setPasswordError('Contraseña incorrecta');
    }
  };

  const handleSavePassword = () => {
    if (!newPassword.trim()) return;
    savePasswordMutation.mutate({
      storeCode: editPasswordDialog.store.code,
      password: newPassword
    });
  };

  const hasPassword = (storeCode) => {
    const storePass = storePasswords.some((p) => p.store_code === storeCode && p.password);
    const rolePass = rolePasswords.some((p) => p.store_code === storeCode && p.password);
    return storePass || rolePass;
  };

  const getRolePasswords = (storeCode) => {
    return rolePasswords.filter((p) => p.store_code === storeCode);
  };

  return (
    <>
      <div className="relative">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={() => { setOpen(!open); setSearch(''); }}
            className="w-full min-w-[200px] h-11 bg-white border-2 border-rose-200 hover:border-pink-400 transition-all shadow-md hover:shadow-lg rounded-2xl flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-pink-500" />
              {selectedStore
                ? <span className="text-pink-700 font-semibold truncate">{getDisplayName(selectedStore)}</span>
                : <span className="text-gray-500 font-medium">Selecciona una tienda</span>
              }
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </motion.div>

        {open && (
          <>
            {/* Overlay para cerrar al hacer click fuera */}
            <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(''); }} />
            <div className="absolute z-50 mt-2 w-full min-w-[300px] bg-white rounded-2xl shadow-2xl border border-pink-100 p-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                <input
                  autoFocus
                  placeholder="Buscar tienda..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 h-10 text-sm bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 focus:border-pink-400 focus:outline-none rounded-xl placeholder:text-gray-400 font-medium"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                {filteredStores.map((store) => (
                  <div
                    key={store.code}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                      selectedStore === store.code
                        ? 'bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 border-2 border-pink-300 shadow-lg'
                        : 'bg-gradient-to-r from-white to-pink-50/50 hover:from-pink-50 hover:to-rose-50 border-2 border-transparent hover:border-pink-200'
                    }`}
                  >
                    <button
                      onClick={() => handleStoreClick(store)}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                        selectedStore === store.code ? 'bg-white/30' : 'bg-gradient-to-br from-pink-100 to-rose-100'
                      }`}>
                        <MapPin className={`w-4 h-4 ${selectedStore === store.code ? 'text-white' : 'text-pink-500'}`} />
                      </div>
                      <span className={`text-sm font-bold flex-1 ${selectedStore === store.code ? 'text-white' : 'text-gray-800'}`}>
                        {store.displayName}
                      </span>
                      {hasPassword(store.code) && (
                        <Lock className={`w-3 h-3 ${selectedStore === store.code ? 'text-white/80' : 'text-amber-500'}`} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditPasswordDialog({ open: true, store });
                        setNewPassword(storePasswords.find((p) => p.store_code === store.code)?.password || '');
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        selectedStore === store.code ? 'hover:bg-white/20' : 'hover:bg-pink-200/50'
                      }`}
                      title="Configurar contraseña"
                    >
                      <Settings className={`w-3.5 h-3.5 ${selectedStore === store.code ? 'text-white/80' : 'text-pink-400'}`} />
                    </button>
                  </div>
                ))}
                {filteredStores.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No se encontró "{search}"</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      

      
      {/* Edit Password Dialog */}
      <Dialog open={editPasswordDialog.open} onOpenChange={(open) => setEditPasswordDialog({ open, store: editPasswordDialog.store })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Configurar contraseñas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Configura las contraseñas para <strong>{editPasswordDialog.store?.code} - {editPasswordDialog.store?.name}</strong>
            </p>

            {/* Contraseña General */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">General</Badge>
                <p className="text-xs text-gray-500">Para todos los roles si no tienen contraseña específica</p>
              </div>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Contraseña general (opcional)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Contraseñas por Rol */}
            <RolePasswordsEditor 
              storeCode={editPasswordDialog.store?.code}
              rolePasswords={rolePasswords}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ['rolePasswords'] })}
            />

            <p className="text-xs text-gray-400">
              💡 Las contraseñas por rol tienen prioridad sobre la contraseña general
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditPasswordDialog({ open: false, store: null })} className="flex-1">
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button
                onClick={handleSavePassword}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                disabled={savePasswordMutation.isPending}>
                <Save className="w-4 h-4 mr-1" />
                {savePasswordMutation.isPending ? 'Guardando...' : 'Guardar General'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>);

}