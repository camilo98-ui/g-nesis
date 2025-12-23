import React, { useState, useMemo } from 'react';
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

const STORES = [
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
{ code: "TUNJA 2", name: "CC VIVA TUNJA", displayName: "VIVA TUNJA" }];


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

  const queryClient = useQueryClient();

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

  const filteredStores = useMemo(() => {
    if (!search.trim()) return STORES;
    const term = search.toLowerCase();
    return STORES.filter((s) =>
    s.code.toLowerCase().includes(term) ||
    s.name.toLowerCase().includes(term)
    );
  }, [search]);

  const selectedStoreName = STORES.find((s) => s.code === selectedStore)?.name || '';

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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full md:w-[300px] bg-white border-gray-200 hover:border-pink-300 transition-all shadow-md hover:shadow-lg rounded-xl justify-between group">

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-500" />
              {selectedStore ?
              <span className="text-pink-700 font-medium truncate">{getDisplayName(selectedStore)}</span> :

              <span className="text-gray-500">Selecciona una tienda</span>
              }
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-2" align="start" side="bottom" sideOffset={5}>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar tienda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm bg-gray-50 placeholder:text-gray-600" />

          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredStores.map((store) =>
            <motion.div
              key={store.code}
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              whileHover={{ x: 5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              selectedStore === store.code ?
              'bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 border-2 border-pink-300 shadow-lg shadow-pink-500/30' :
              'bg-gradient-to-r from-white to-pink-50/50 hover:from-pink-50 hover:to-rose-50 border-2 border-transparent hover:border-pink-200'}`
              }>

                    <button
                onClick={() => handleStoreClick(store)}
                className="flex-1 flex items-center gap-3 text-left">

                      <motion.div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedStore === store.code ?
                  'bg-white/30 backdrop-blur-sm' :
                  'bg-gradient-to-br from-pink-100 to-rose-100'}`
                  }>

                        <MapPin className={`w-4 h-4 ${selectedStore === store.code ? 'text-white' : 'text-pink-500'}`} />
                      </motion.div>
                      <span className={`text-sm font-medium flex-1 ${
                selectedStore === store.code ?
                'text-white' :
                'text-gray-700'}`
                }>
                        {store.displayName}
                      </span>
                      {hasPassword(store.code) &&
                <Lock className={`w-3 h-3 ${selectedStore === store.code ? 'text-white/80' : 'text-amber-500'}`} />
                }
                    </button>
                    <motion.button
                whileHover={{ rotate: 90 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditPasswordDialog({ open: true, store });
                  setNewPassword(storePasswords.find((p) => p.store_code === store.code)?.password || '');
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                selectedStore === store.code ?
                'hover:bg-white/20' :
                'hover:bg-pink-200/50'}`
                }
                title="Configurar contraseña">

                      <Settings className={`w-3.5 h-3.5 ${selectedStore === store.code ? 'text-white/80' : 'text-pink-400'}`} />
                    </motion.button>
                  </motion.div>
            )}
            {filteredStores.length === 0 &&
            <p className="text-center text-gray-400 text-sm py-4">No se encontró "{search}"</p>
            }
          </div>
        </PopoverContent>
      </Popover>
      

      
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