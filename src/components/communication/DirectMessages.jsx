import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Plus, Check, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function DirectMessages({ currentUser, storeId }) {
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedTab, setSelectedTab] = useState('inbox');

  const queryClient = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: async () => {
      const cashiers = await base44.entities.Cashier.filter({ store_id: storeId, is_active: true });
      return cashiers.map(c => c.name);
    }
  });

  const { data: inbox = [] } = useQuery({
    queryKey: ['directMessages', 'inbox', currentUser],
    queryFn: async () => {
      const all = await base44.entities.DirectMessage.list('-created_date');
      return all.filter(m => m.to_user === currentUser);
    }
  });

  const { data: sent = [] } = useQuery({
    queryKey: ['directMessages', 'sent', currentUser],
    queryFn: async () => {
      const all = await base44.entities.DirectMessage.list('-created_date');
      return all.filter(m => m.from_user === currentUser);
    }
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.DirectMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
      setShowNewMessage(false);
      setRecipient('');
      setMessageContent('');
      toast.success('Mensaje enviado');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.DirectMessage.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    }
  });

  const handleSend = () => {
    if (!recipient || !messageContent.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    sendMutation.mutate({
      from_user: currentUser,
      to_user: recipient,
      message: messageContent.trim(),
      store_id: storeId
    });
  };

  const unreadCount = inbox.filter(m => !m.is_read).length;

  const messages = selectedTab === 'inbox' ? inbox : sent;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-500" />
          <h3 className="text-xl font-bold text-slate-800">Mensajes Directos</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <Button onClick={() => setShowNewMessage(!showNewMessage)} size="sm" className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Mensaje
        </Button>
      </div>

      <AnimatePresence>
        {showNewMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border-2 border-blue-200 p-4 space-y-3"
          >
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecciona destinatario...</option>
              {allUsers.filter(u => u !== currentUser).map((user) => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
            <Textarea
              placeholder="Escribe tu mensaje..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="h-24"
            />
            <div className="flex gap-2">
              <Button onClick={handleSend} disabled={sendMutation.isPending} className="flex-1 bg-blue-500 hover:bg-blue-600">
                <Send className="w-4 h-4 mr-1" />
                Enviar
              </Button>
              <Button onClick={() => setShowNewMessage(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <Button
          onClick={() => setSelectedTab('inbox')}
          variant={selectedTab === 'inbox' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
        >
          Recibidos ({inbox.length})
        </Button>
        <Button
          onClick={() => setSelectedTab('sent')}
          variant={selectedTab === 'sent' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
        >
          Enviados ({sent.length})
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => selectedTab === 'inbox' && !msg.is_read && markAsReadMutation.mutate(msg.id)}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
              selectedTab === 'inbox' && !msg.is_read
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-sm text-slate-800">
                  {selectedTab === 'inbox' ? `De: ${msg.from_user}` : `Para: ${msg.to_user}`}
                </span>
                {selectedTab === 'inbox' && msg.is_read && (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              <span className="text-xs text-slate-500">
                {format(new Date(msg.created_date), "d MMM, HH:mm", { locale: es })}
              </span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.message}</p>
          </motion.div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-slate-400 py-8">No hay mensajes</p>
        )}
      </div>
    </div>
  );
}