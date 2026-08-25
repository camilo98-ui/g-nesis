import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Save, Check, Shield } from 'lucide-react';

const STORAGE_KEY = 'gerenteConfigs';

export function getGerenteConfigs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getGerenteConfig(district) {
  if (!district) return null;
  return getGerenteConfigs()[district] || null;
}

export default function GerenteConfigModal({ open, onClose, district }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open && district) {
      const cfg = getGerenteConfig(district);
      setName(cfg?.name || '');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSaved(false);
    }
  }, [open, district]);

  const handleSave = () => {
    if (!name.trim()) { setError('Ingresa el nombre del gerente'); return; }
    if (!password) { setError('Ingresa una contraseña'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 3) { setError('La contraseña debe tener al menos 3 caracteres'); return; }

    const configs = getGerenteConfigs();
    configs[district] = { name: name.trim(), password };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    setSaved(true);
    setTimeout(() => { onClose(); }, 900);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 18, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(71,85,105,0.12)' }}>
                  <Shield className="w-4.5 h-4.5" style={{ color: '#475569', width: 18, height: 18 }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Configuración de Gerente</h2>
                  <p className="text-[11px] text-slate-400">{district || 'Distrito'}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Define el nombre del gerente del distrito y la contraseña para iniciar sesión en modo gerente.
              </p>

              {/* Nombre */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del gerente</label>
                <div className="relative mt-1">
                  <User className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="Ej: Camilo Rodríguez"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-800 focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contraseña de gerente</label>
                <div className="relative mt-1">
                  <Lock className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••"
                    className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-800 focus:border-slate-500 focus:outline-none"
                  />
                  <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-[10px] font-bold">
                    {showPwd ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmar contraseña</label>
                <div className="relative mt-1">
                  <Lock className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="••••••"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-800 focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-rose-500 font-medium">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={onClose} className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="h-9 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5">
                {saved ? <><Check className="w-3.5 h-3.5" /> Guardado</> : <><Save className="w-3.5 h-3.5" /> Guardar</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}