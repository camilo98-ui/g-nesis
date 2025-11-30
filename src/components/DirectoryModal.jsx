import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Mail, Search, User, Building, Wrench, Shield, Truck, Edit2, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_CONTACTS = [
  {
    category: 'Gerencia',
    icon: Building,
    color: 'from-pink-500 to-rose-500',
    contacts: [
      { name: 'Gerente de Zona', phone: '311 234 5678', email: 'gerente.zona@popsy.com', role: 'Supervisión general' },
      { name: 'Coordinador Operativo', phone: '312 345 6789', email: 'coord.operativo@popsy.com', role: 'Operaciones diarias' },
    ]
  },
  {
    category: 'Soporte Técnico',
    icon: Wrench,
    color: 'from-blue-500 to-cyan-500',
    contacts: [
      { name: 'Mesa de Ayuda TI', phone: '601 555 1234', email: 'soporte@popsy.com', role: 'Sistemas y POS' },
      { name: 'Mantenimiento Equipos', phone: '313 456 7890', email: 'mantenimiento@popsy.com', role: 'Neveras y equipos' },
    ]
  },
  {
    category: 'Recursos Humanos',
    icon: User,
    color: 'from-purple-500 to-violet-500',
    contacts: [
      { name: 'RRHH Zona Norte', phone: '314 567 8901', email: 'rrhh.norte@popsy.com', role: 'Nómina y personal' },
      { name: 'Bienestar Laboral', phone: '315 678 9012', email: 'bienestar@popsy.com', role: 'Apoyo empleados' },
    ]
  },
  {
    category: 'Seguridad',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    contacts: [
      { name: 'Seguridad 24/7', phone: '316 789 0123', email: 'seguridad@popsy.com', role: 'Emergencias' },
      { name: 'Monitoreo CCTV', phone: '317 890 1234', email: 'cctv@popsy.com', role: 'Vigilancia' },
    ]
  },
  {
    category: 'Logística',
    icon: Truck,
    color: 'from-green-500 to-emerald-500',
    contacts: [
      { name: 'Centro de Distribución', phone: '318 901 2345', email: 'logistica@popsy.com', role: 'Pedidos y entregas' },
      { name: 'Inventarios', phone: '319 012 3456', email: 'inventarios@popsy.com', role: 'Stock y faltantes' },
    ]
  }
];

export default function DirectoryModal({ onClose }) {
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);
  const [editingContact, setEditingContact] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('directoryContacts');
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  }, []);

  const saveContacts = (newContacts) => {
    setContacts(newContacts);
    localStorage.setItem('directoryContacts', JSON.stringify(newContacts));
  };

  const handleEditContact = (catIndex, contactIndex, field, value) => {
    const updated = [...contacts];
    updated[catIndex].contacts[contactIndex][field] = value;
    saveContacts(updated);
  };

  const handleDeleteContact = (catIndex, contactIndex) => {
    const updated = [...contacts];
    updated[catIndex].contacts.splice(contactIndex, 1);
    saveContacts(updated);
  };

  const handleAddContact = (catIndex) => {
    const updated = [...contacts];
    updated[catIndex].contacts.push({ name: 'Nuevo Contacto', phone: '', email: '', role: 'Rol' });
    saveContacts(updated);
  };

  const filteredContacts = contacts.map(cat => ({
    ...cat,
    contacts: cat.contacts.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.contacts.length > 0);

  const handleCall = (phone) => {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-7 h-7" />
              <div>
                <h2 className="text-xl font-bold">Directorio</h2>
                <p className="text-white/80 text-sm">Contactos de emergencia y soporte</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setEditMode(!editMode)} 
                className={`text-white hover:bg-white/20 rounded-full ${editMode ? 'bg-white/20' : ''}`}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar contacto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredContacts.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.category}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-700">{category.category}</h3>
                </div>
                
                <div className="space-y-2 ml-2">
                  {category.contacts.map((contact, idx) => {
                    const catIndex = contacts.findIndex(c => c.category === category.category);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-gray-50 rounded-xl p-3"
                      >
                        {editMode ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={contact.name}
                                onChange={(e) => handleEditContact(catIndex, idx, 'name', e.target.value)}
                                placeholder="Nombre"
                                className="h-8 text-sm"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteContact(catIndex, idx)}
                                className="w-8 h-8 text-red-500 hover:bg-red-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <Input
                              value={contact.role}
                              onChange={(e) => handleEditContact(catIndex, idx, 'role', e.target.value)}
                              placeholder="Rol"
                              className="h-8 text-sm"
                            />
                            <div className="flex gap-2">
                              <Input
                                value={contact.phone}
                                onChange={(e) => handleEditContact(catIndex, idx, 'phone', e.target.value)}
                                placeholder="Teléfono"
                                className="h-8 text-sm"
                              />
                              <Input
                                value={contact.email}
                                onChange={(e) => handleEditContact(catIndex, idx, 'email', e.target.value)}
                                placeholder="Email"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 text-sm">{contact.name}</p>
                              <p className="text-xs text-gray-500">{contact.role}</p>
                              <p className="text-xs text-blue-600 mt-1">{contact.phone}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleCall(contact.phone)}
                                className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 text-green-600"
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                              <a href={`mailto:${contact.email}`}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </a>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  {editMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddContact(contacts.findIndex(c => c.category === category.category))}
                      className="w-full mt-2 text-xs border-dashed"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Agregar contacto
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            📞 En caso de emergencia, contacta primero a Seguridad 24/7
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}