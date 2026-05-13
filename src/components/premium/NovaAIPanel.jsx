import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X } from 'lucide-react';

export default function NovaAIPanel({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { type: 'ai', text: '¡Hola! Soy Nova, tu asistente de inteligencia operativa. Te ayudaré a entender el desempeño de tu tienda hoy.' }
  ]);
  const [input, setInput] = useState('');

  const quickChips = [
    'Ventas del día',
    'Proyección mensual',
    'Análisis P&G',
    'Txn por hora',
    'Participación',
    'Comparar con ayer'
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { type: 'user', text: input }]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: 'Las ventas van 81% por debajo de ayer, pero el ticket promedio aumentó 12%. Los cones están impulsando el crecimiento.' 
      }]);
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-slate-200 z-40 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Nova AI</h3>
                <p className="text-xs text-slate-500">Copiloto inteligente</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs rounded-2xl px-4 py-3 ${
                  msg.type === 'user'
                    ? 'bg-pink-500 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick chips */}
          {messages.length === 1 && (
            <div className="px-6 pb-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Preguntas rápidas</p>
              <div className="flex flex-wrap gap-2">
                {quickChips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setInput(chip)}
                    className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-6 border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Pregunta a Nova..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}