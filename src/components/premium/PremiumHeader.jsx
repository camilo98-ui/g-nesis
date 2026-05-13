import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Sparkles } from 'lucide-react';

export default function PremiumHeader({ userName }) {
  const hours = new Date().getHours();
  const greeting = hours < 12 ? '¡Buenos días' : hours < 18 ? '¡Buenas tardes' : '¡Buenas noches';

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-64 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-40 flex items-center px-8"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {userName}! 👋
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Aquí tienes el resumen de tu tienda hoy.</p>
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-4">
        <button className="p-2.5 rounded-lg hover:bg-slate-100 transition relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg transition">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Nova AI</span>
        </button>
      </div>
    </motion.div>
  );
}