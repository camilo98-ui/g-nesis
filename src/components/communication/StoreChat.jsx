import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function StoreChat({ storeId, userName, userRole }) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', storeId],
    queryFn: async () => {
      const all = await base44.entities.ChatMessage.list('-created_date');
      return all.filter(m => m.store_id === storeId).reverse();
    },
    refetchInterval: 5000
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      setMessage('');
      setMessageType('text');
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate({
      store_id: storeId,
      user_name: userName,
      user_role: userRole,
      message: message.trim(),
      message_type: messageType
    });
  };

  const typeConfig = {
    text: { bg: 'bg-white', border: 'border-slate-200' },
    alert: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle, iconColor: 'text-amber-500' },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-500' }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-violet-500" />
        <h3 className="text-xl font-bold text-slate-800">Chat de Tienda</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4 bg-slate-50 rounded-xl p-4 max-h-[400px]">
        {messages.map((msg, idx) => {
          const config = typeConfig[msg.message_type] || typeConfig.text;
          const Icon = config.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${config.bg} border ${config.border} rounded-lg p-3`}
            >
              <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className={`w-4 h-4 ${config.iconColor}`} />}
                <span className="font-bold text-sm text-slate-800">{msg.user_name}</span>
                <span className="text-xs text-slate-500">({msg.user_role})</span>
                <span className="text-xs text-slate-400 ml-auto">
                  {format(new Date(msg.created_date), 'HH:mm', { locale: es })}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.message}</p>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMessageType('text')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              messageType === 'text' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setMessageType('alert')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              messageType === 'alert' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'
            }`}
          >
            Alerta
          </button>
          <button
            onClick={() => setMessageType('success')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              messageType === 'success' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            Éxito
          </button>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} disabled={sendMutation.isPending} className="bg-violet-500 hover:bg-violet-600">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}