import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnnouncementsBoard from '@/components/communication/AnnouncementsBoard';
import StoreChat from '@/components/communication/StoreChat';
import DirectMessages from '@/components/communication/DirectMessages';
import { MessageSquare, Megaphone, Mail } from 'lucide-react';

export default function Communication() {
  const [selectedStore, setSelectedStore] = useState('');
  const [userName, setUserName] = useState('Usuario');
  const [userRole, setUserRole] = useState('embajador');
  const [activeTab, setActiveTab] = useState('announcements');

  useEffect(() => {
    const store = localStorage.getItem('selectedStore');
    const role = localStorage.getItem('userRole');
    const session = localStorage.getItem('popsySession');
    
    if (store) setSelectedStore(store);
    if (role) setUserRole(role);
    
    if (session) {
      const parsed = JSON.parse(session);
      // En producción, aquí obtendrías el nombre real del usuario
      setUserName(parsed.userName || 'Usuario');
    }
  }, []);

  const tabs = [
    { id: 'announcements', label: 'Anuncios', icon: Megaphone },
    { id: 'chat', label: 'Chat de Tienda', icon: MessageSquare },
    { id: 'messages', label: 'Mensajes Directos', icon: Mail }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Comunicación Interna</h1>
          <p className="text-slate-600">Mantente conectado con tu equipo</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          {activeTab === 'announcements' && (
            <AnnouncementsBoard userRole={userRole} userName={userName} />
          )}
          {activeTab === 'chat' && (
            <StoreChat storeId={selectedStore} userName={userName} userRole={userRole} />
          )}
          {activeTab === 'messages' && (
            <DirectMessages currentUser={userName} storeId={selectedStore} />
          )}
        </motion.div>
      </div>
    </div>
  );
}