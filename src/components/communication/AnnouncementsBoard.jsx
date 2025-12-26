import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, AlertCircle, Info, Plus, X, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AnnouncementsBoard({ userRole, userName }) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_stores: 'todas',
    expires_date: ''
  });

  const queryClient = useQueryClient();

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const all = await base44.entities.Announcement.list('-created_date');
      return all.filter(a => a.is_active);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowNewForm(false);
      setNewAnnouncement({ title: '', content: '', priority: 'normal', target_stores: 'todas', expires_date: '' });
      toast.success('Anuncio publicado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Anuncio eliminado');
    }
  });

  const handleCreate = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    createMutation.mutate({
      ...newAnnouncement,
      author_name: userName,
      author_role: userRole
    });
  };

  const priorityConfig = {
    normal: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-500', text: 'text-blue-700' },
    importante: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle, iconColor: 'text-amber-500', text: 'text-amber-700' },
    urgente: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle, iconColor: 'text-red-500', text: 'text-red-700' }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-pink-500" />
          Tablón de Anuncios
        </h3>
        {(userRole === 'gerente' || userRole === 'lider') && (
          <Button onClick={() => setShowNewForm(!showNewForm)} size="sm" className="bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Anuncio
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border-2 border-pink-200 p-4 space-y-3"
          >
            <Input
              placeholder="Título del anuncio"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            />
            <Textarea
              placeholder="Contenido del anuncio"
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              className="h-24"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newAnnouncement.priority}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="normal">Normal</option>
                <option value="importante">Importante</option>
                <option value="urgente">Urgente</option>
              </select>
              <Input
                type="date"
                value={newAnnouncement.expires_date}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expires_date: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                Publicar
              </Button>
              <Button onClick={() => setShowNewForm(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {announcements.map((announcement) => {
          const config = priorityConfig[announcement.priority];
          const Icon = config.icon;
          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${config.bg} border-2 ${config.border} rounded-xl p-4`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  <h4 className={`font-bold ${config.text}`}>{announcement.title}</h4>
                </div>
                {(userRole === 'gerente' || announcement.created_by === userName) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(announcement.id)}
                    className="w-7 h-7 hover:bg-red-100"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
              <p className={`text-sm ${config.text} mb-3 whitespace-pre-wrap`}>{announcement.content}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {announcement.author_name} ({announcement.author_role})
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(announcement.created_date), "d 'de' MMM, HH:mm", { locale: es })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}