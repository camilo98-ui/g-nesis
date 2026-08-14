import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DistrictPicker from '@/components/DistrictPicker';
import StoreSelector from '@/components/StoreSelector';

function StepLabel({ num, children, done }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${done ? 'bg-rose-400 text-white' : 'bg-rose-100 text-rose-500'}`}>
        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : num}
      </span>
      <label className="text-xs font-bold text-slate-900 tracking-wide">{children}</label>
    </div>
  );
}

// Flujo dependiente de login: 01 Distrito → 02 Tienda → 03 Contraseña → Ingresar.
export default function LoginSteps({
  selectedRole, selectedDistrict, onDistrictChange,
  pendingStore, onStoreChange,
  loginPassword, onPasswordChange, showLoginPassword, onTogglePassword, onPasswordKeyDown,
  loginError, isSubmitting, onLogin
}) {
  const isGerente = selectedRole === 'gerente';
  const storeDisabled = !selectedDistrict;
  const passwordDisabled = isSubmitting || !selectedDistrict || (!isGerente && !pendingStore);
  const canSubmit = !!selectedRole && !!selectedDistrict && (isGerente || !!pendingStore) && !isSubmitting;

  return (
    <div className="space-y-4">
      {/* 01 Distrito */}
      <div>
        <StepLabel num="01" done={!!selectedDistrict}>Distrito</StepLabel>
        <DistrictPicker selectedDistrict={selectedDistrict} onDistrictChange={onDistrictChange} />
      </div>

      {/* 02 Tienda (oculto para gerente) */}
      {!isGerente && (
        <div>
          <StepLabel num="02" done={!!pendingStore}>Tienda</StepLabel>
          <StoreSelector
            selectedStore={pendingStore}
            onStoreChange={onStoreChange}
            selectedDistrict={selectedDistrict}
            disabled={storeDisabled}
            placeholder={selectedDistrict ? 'Selecciona una tienda' : 'Primero selecciona un distrito'}
          />
        </div>
      )}

      {/* 03 Contraseña */}
      <div>
        <StepLabel num={isGerente ? '02' : '03'} done={!!loginPassword}>Contraseña</StepLabel>
        <div className="relative">
          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${passwordDisabled ? 'text-slate-300' : 'text-rose-400'}`} />
          <input
            type={showLoginPassword ? 'text' : 'password'}
            placeholder={passwordDisabled ? 'Completa los pasos anteriores' : 'Ingresa tu contraseña'}
            value={loginPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={onPasswordKeyDown}
            disabled={passwordDisabled}
            autoComplete="current-password"
            className={`w-full h-12 pl-11 pr-11 rounded-xl border-2 outline-none text-sm transition-all bg-white/80 backdrop-blur-sm ${passwordDisabled ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-rose-200/60 text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'}`}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            disabled={passwordDisabled}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          >
            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 ml-1">Contraseña asignada por la empresa</p>
      </div>

      {loginError && (
        <div className="p-2.5 bg-red-50/80 border border-red-200/60 rounded-xl">
          <p className="text-[11px] text-red-600 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {loginError}
          </p>
        </div>
      )}

      <motion.div whileHover={{ scale: canSubmit ? 1.02 : 1 }} whileTap={{ scale: canSubmit ? 0.98 : 1 }}>
        <Button
          onClick={onLogin}
          disabled={!canSubmit}
          className="w-full h-12 bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-200/40 border-0"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Entrando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">Ingresar <ChevronRight className="w-4 h-4" /></span>
          )}
        </Button>
      </motion.div>
    </div>
  );
}