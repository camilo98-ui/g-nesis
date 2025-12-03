import React, { useState, useMemo } from 'react';
import { MapPin, Search, Lock, Eye, EyeOff, Settings, Save, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

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
  { code: "TUNJA 2", name: "CC VIVA TUNJA", displayName: "VIVA TUNJA" },
];

// Helper para obtener nombre corto sin BTA/código
const getDisplayName = (code) => {
  const store = STORES.find(s => s.code === code);
  return store?.displayName || store?.name || code;
};

export { STORES, getDisplayName };

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
    queryFn: () => base44.entities.StorePassword.list(),
  });
  
  // Mutation to save password
  const savePasswordMutation = useMutation({
    mutationFn: async ({ storeCode, password }) => {
      const existing = storePasswords.find(p => p.store_code === storeCode);
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
    return STORES.filter(s => 
      s.code.toLowerCase().includes(term) || 
      s.name.toLowerCase().includes(term)
    );
  }, [search]);
  
  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  
  const handleStoreClick = (store) => {
    const storePassword = storePasswords.find(p => p.store_code === store.code);
    if (storePassword?.password) {
      setPasswordDialog({ open: true, store });
      setPasswordInput('');
      setPasswordError('');
    } else {
      onStoreChange(store.code);
      setOpen(false);
      setSearch('');
    }
  };
  
  const handlePasswordSubmit = () => {
    const storePassword = storePasswords.find(p => p.store_code === passwordDialog.store.code);
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
    return storePasswords.some(p => p.store_code === storeCode && p.password);
  };
  
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full md:w-[300px] bg-white border-gray-200 hover:border-pink-300 transition-all shadow-md hover:shadow-lg rounded-xl justify-between group"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-500" />
              {selectedStore ? (
                    <span className="truncate text-pink-600 font-medium">{getDisplayName(selectedStore)}</span>
                  ) : (
                    <span className="text-gray-500">Selecciona una tienda</span>
                  )}
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
              className="pl-8 h-9 text-sm bg-gray-50 placeholder:text-gray-600"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredStores.map((store) => (
              <div 
                key={store.code}
                className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  selectedStore === store.code 
                    ? 'bg-pink-100 text-pink-700' 
                    : 'hover:bg-pink-50'
                }`}
              >
                <button
                  onClick={() => handleStoreClick(store)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <svg viewBox="0 0 24 32" className="w-5 h-6">
                    <circle cx="12" cy="8" r="7" fill="#FFB5C5" stroke="#ec4899" strokeWidth="1"/>
                    <polygon points="5,12 12,30 19,12" fill="#D4A574" stroke="#c99a5e" strokeWidth="0.5"/>
                    <line x1="7" y1="15" x2="17" y2="15" stroke="#c99a5e" strokeWidth="0.5" opacity="0.6"/>
                    <line x1="8" y1="19" x2="16" y2="19" stroke="#c99a5e" strokeWidth="0.5" opacity="0.6"/>
                  </svg>
                  <span className="font-medium text-pink-600">{store.displayName}</span>
                  {hasPassword(store.code) && (
                    <Lock className="w-3 h-3 text-amber-500 ml-auto" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditPasswordDialog({ open: true, store });
                    setNewPassword(storePasswords.find(p => p.store_code === store.code)?.password || '');
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Configurar contraseña"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            ))}
            {filteredStores.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No se encontró "{search}"</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Password Entry Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={(open) => setPasswordDialog({ open, store: passwordDialog.store })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Ingresa la contraseña
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              La tienda <strong>{passwordDialog.store?.code}</strong> está protegida con contraseña.
            </p>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm"
              >
                {passwordError}
              </motion.p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPasswordDialog({ open: false, store: null })} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handlePasswordSubmit} className="flex-1 bg-pink-500 hover:bg-pink-600">
                Ingresar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Password Dialog */}
      <Dialog open={editPasswordDialog.open} onOpenChange={(open) => setEditPasswordDialog({ open, store: editPasswordDialog.store })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Configurar contraseña
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Configura la contraseña para <strong>{editPasswordDialog.store?.code} - {editPasswordDialog.store?.name}</strong>
            </p>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Nueva contraseña (dejar vacío para quitar)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              💡 Deja el campo vacío y guarda para quitar la contraseña de esta tienda.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditPasswordDialog({ open: false, store: null })} className="flex-1">
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSavePassword} 
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                disabled={savePasswordMutation.isPending}
              >
                <Save className="w-4 h-4 mr-1" />
                {savePasswordMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}