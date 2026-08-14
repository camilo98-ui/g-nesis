import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Lock, Eye, EyeOff, Settings, Save, X, UserRound } from 'lucide-react';
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
      const lider = rolePasswords.find((p) => p.store_code === storeCode && p.role === 'lider');
      const embajador = rolePasswords.find((p) => p.store_code === storeCode && p.role === 'embajador');
      setLiderPassword(lider?.password || '');
      setEmbajadorPassword(embajador?.password || '');
    }
  }, [storeCode, rolePasswords]);

  const saveMutation = useMutation({
    mutationFn: async ({ role, password }) => {
      const existing = rolePasswords.find((p) => p.store_code === storeCode && p.role === role);
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
      <p className="text-sm font-semibold text-gray-700">Contraseña del Líder</p>
      
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
            className="pr-20" />
          
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
              className="h-7 px-2 text-xs">
              
              {saveMutation.isPending ? '...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>

    </div>);

}

export default function StoreSelector({ selectedStore, onStoreChange, selectedDistrict, onDistrictChange, disabled, placeholder }) {
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
  const [leaderName, setLeaderName] = useState('');

  const queryClient = useQueryClient();

  const [customStores, setCustomStores] = useState([]);
  const [storeRecords, setStoreRecords] = useState([]);

  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user?.store_config) setStoreConfig(user.store_config);
    }).catch(() => {});
    // Leer tiendas custom desde entidad compartida (excluir las que ya están en BASE_STORES)
    base44.entities.Store.list('-created_date', 1000).then((stores) => {
      setStoreRecords(stores);
      const baseCodes = new Set(STORES.map((s) => s.code));
      setCustomStores(stores.filter((s) => !baseCodes.has(s.code)).map((s) => ({ code: s.code, name: s.name, displayName: s.name, district: s.district || 'BOGOTA NOROCCIDENTE', lider_name: s.lider_name })));
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

  // Mutation para guardar el nombre del líder en la entidad Store
  const saveLeaderMutation = useMutation({
    mutationFn: async ({ storeId, name }) => base44.entities.Store.update(storeId, { lider_name: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-stores'] });
      // Refrescar registros locales para reflejar el cambio de inmediato
      base44.entities.Store.list('-created_date', 1000).then(setStoreRecords).catch(() => {});
    }
  });

  const handleSaveLeader = () => {
    const store = editPasswordDialog.store;
    if (!store) return;
    const rec = storeRecords.find((s) => s.code === store.code);
    if (rec) saveLeaderMutation.mutate({ storeId: rec.id, name: leaderName.trim() });
  };

  // Calcular lista de tiendas activas según storeConfig y distrito seleccionado
  const baseWithDistrict = (arr) => arr.map((s) => ({ ...s, district: s.district || 'BOGOTA NOROCCIDENTE' }));

  const availableDistricts = useMemo(() => {
    const allStores = [...baseWithDistrict(STORES), ...customStores];
    const districts = new Set();
    allStores.forEach((s) => { if (s.district) districts.add(s.district); });
    return Array.from(districts).sort();
  }, [customStores]);

  const activeStores = useMemo(() => {
    const allStores = [...baseWithDistrict(STORES), ...customStores];
    let result = allStores;
    // El filtro de storeConfig (tiendas activadas personalmente) solo aplica
    // fuera del flujo de login. En login (con selectedDistrict) mostramos
    // todas las tiendas del distrito para que el usuario pueda ingresar.
    if (!selectedDistrict && storeConfig?.activeStoreCodes) {
      const configured = new Set(storeConfig.activeStoreCodes);
      const customCodes = new Set(customStores.map((s) => s.code));
      result = result.filter((s) => {
        if (configured.has(s.code)) return true; // activa explícitamente
        if (customCodes.has(s.code)) return false; // custom no activada = oculta
        return true; // BASE_STORES nueva = mostrar siempre
      });
    }
    // Filtrar por distrito seleccionado cuando se proporcione (selector de login)
    if (selectedDistrict) {
      result = result.filter((s) => s.district === selectedDistrict);
    }
    return result;
  }, [storeConfig, customStores, selectedDistrict]);

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
        name.split(' ').some((word) => word.toLowerCase().startsWith(term)) ||
        displayName.split(' ').some((word) => word.toLowerCase().startsWith(term)));

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
        {onDistrictChange && availableDistricts.length > 0 &&
        <div className="mb-2">
          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Distrito</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400 pointer-events-none" />
            <select
              value={selectedDistrict || ''}
              onChange={(e) => onDistrictChange(e.target.value)}
              className="w-full h-11 pl-10 pr-3 rounded-xl border-2 border-rose-200/60 bg-white/80 text-sm font-medium text-slate-700 focus:border-rose-400 outline-none appearance-none cursor-pointer"
            >
              <option value="">Selecciona un distrito</option>
              {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        }
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button
            onClick={() => { if (!disabled) setOpen(!open); }}
            className={`w-full px-4 py-3 h-11 text-left rounded-xl border-2 transition-all flex items-center justify-between ${disabled ? 'border-slate-200 bg-slate-50/80 cursor-not-allowed' : 'border-rose-200/60 bg-white/80 backdrop-blur-sm hover:border-rose-400'}`}>
            <span className={`text-sm font-medium flex-1 truncate ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>{selectedStoreName || placeholder || 'Selecciona una tienda'}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedStore && !disabled &&
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    const store = filteredStores.find((s) => s.code === selectedStore) ||
                                  [...baseWithDistrict(STORES), ...customStores].find((s) => s.code === selectedStore);
                    if (store) {
                      setEditPasswordDialog({ open: true, store });
                      setNewPassword(storePasswords.find((p) => p.store_code === store.code)?.password || '');
                      setLeaderName(storeRecords.find((r) => r.code === store.code)?.lider_name || '');
                    }
                  }}
                  className="p-1 rounded-lg hover:bg-pink-100 transition-colors"
                  title="Configurar tienda">
                  <Settings className="w-4 h-4 text-pink-500" />
                </span>
              }
              <MapPin className={`w-4 h-4 ${disabled ? 'text-slate-300' : 'text-pink-400'}`} />
            </div>
          </button>









          
        </motion.div>

        {open &&
        <>
            {/* Overlay para cerrar al hacer click fuera */}
            <div className="fixed inset-0 z-40" onClick={() => {setOpen(false);setSearch('');}} />
            <div className="absolute z-50 mt-2 w-full min-w-[300px] bg-white rounded-2xl shadow-2xl border border-pink-100 p-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                <input
                autoFocus
                placeholder="Buscar tienda..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 h-10 text-sm bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 focus:border-pink-400 focus:outline-none rounded-xl placeholder:text-gray-400 font-medium" />
              
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                {filteredStores.map((store) =>
              <div
                key={store.code}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                selectedStore === store.code ?
                'bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 border-2 border-pink-300 shadow-lg' :
                'bg-gradient-to-r from-white to-pink-50/50 hover:from-pink-50 hover:to-rose-50 border-2 border-transparent hover:border-pink-200'}`
                }>
                
                    <button
                  onClick={() => handleStoreClick(store)}
                  className="flex-1 flex items-center gap-3 text-left">
                  
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                  selectedStore === store.code ? 'bg-white/30' : 'bg-gradient-to-br from-pink-100 to-rose-100'}`
                  }>
                        <MapPin className={`w-4 h-4 ${selectedStore === store.code ? 'text-white' : 'text-pink-500'}`} />
                      </div>
                      <span className={`text-sm font-bold flex-1 ${selectedStore === store.code ? 'text-white' : 'text-gray-800'}`}>
                        {store.displayName}
                      </span>
                      {hasPassword(store.code) &&
                  <Lock className={`w-3 h-3 ${selectedStore === store.code ? 'text-white/80' : 'text-amber-500'}`} />
                  }
                    </button>
                    <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditPasswordDialog({ open: true, store });
                    setNewPassword(storePasswords.find((p) => p.store_code === store.code)?.password || '');
                    setLeaderName(storeRecords.find((r) => r.code === store.code)?.lider_name || '');
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                  selectedStore === store.code ? 'hover:bg-white/20' : 'hover:bg-pink-200/50'}`
                  }
                  title="Configurar contraseña">
                  
                      <Settings className={`w-3.5 h-3.5 ${selectedStore === store.code ? 'text-white/80' : 'text-pink-400'}`} />
                    </button>
                  </div>
              )}

                {filteredStores.length === 0 && search.trim() &&
              <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No se encontró "{search}"</p>
                  </div>
              }

                {filteredStores.length === 0 && !search.trim() &&
              <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">
                      {selectedDistrict ? 'Cargando tiendas del distrito...' : 'Selecciona un distrito primero'}
                    </p>
                  </div>
              }
              </div>
            </div>
          </>
        }
      </div>
      

      
      {/* Edit Password Dialog */}
      <Dialog open={editPasswordDialog.open} onOpenChange={(open) => setEditPasswordDialog({ open, store: editPasswordDialog.store })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Configurar tienda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Configura <strong>{editPasswordDialog.store?.code} - {editPasswordDialog.store?.name}</strong>
            </p>

            {/* Nombre del líder (saludo del Home) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-rose-100 text-rose-700 border-rose-200"><UserRound className="w-3 h-3 mr-1" />Líder</Badge>
                <p className="text-xs text-gray-500">Nombre que aparece en el saludo superior del Home</p>
              </div>
              <div className="relative">
                <Input
                  placeholder="Ej: Andrea, Ruth, Camilo..."
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="pr-10" />
                <UserRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
              <Button
                onClick={handleSaveLeader}
                disabled={saveLeaderMutation.isPending || !leaderName.trim()}
                className="w-full bg-rose-500 hover:bg-rose-600">
                <Save className="w-4 h-4 mr-1" />
                {saveLeaderMutation.isPending ? 'Guardando...' : 'Guardar nombre del líder'}
              </Button>
            </div>

            {/* Contraseña del líder */}
            <RolePasswordsEditor
              storeCode={editPasswordDialog.store?.code}
              rolePasswords={rolePasswords}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ['rolePasswords'] })} />

            <div className="flex justify-end pt-1">
              <Button variant="outline" onClick={() => setEditPasswordDialog({ open: false, store: null })}>
                <X className="w-4 h-4 mr-1" />
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>);

}