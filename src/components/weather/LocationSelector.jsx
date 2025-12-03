import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Check, Plus, Trash2, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
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

// Ubicaciones predefinidas para Colombia
const DEFAULT_LOCATIONS = [
  { id: 'bogota', name: 'Bogotá', lat: 4.6097, lon: -74.0817, zone: 'Centro' },
  { id: 'bogota-norte', name: 'Bogotá Norte', lat: 4.7110, lon: -74.0721, zone: 'Noroccidente' },
  { id: 'bogota-sur', name: 'Bogotá Sur', lat: 4.5709, lon: -74.1060, zone: 'Sur' },
  { id: 'chia', name: 'Chía', lat: 4.8637, lon: -74.0409, zone: 'Sabana Norte' },
  { id: 'cajica', name: 'Cajicá', lat: 4.9189, lon: -74.0283, zone: 'Sabana Norte' },
  { id: 'tunja', name: 'Tunja', lat: 5.5353, lon: -73.3678, zone: 'Boyacá' },
  { id: 'medellin', name: 'Medellín', lat: 6.2442, lon: -75.5812, zone: 'Antioquia' },
  { id: 'cali', name: 'Cali', lat: 3.4516, lon: -76.5320, zone: 'Valle' },
  { id: 'barranquilla', name: 'Barranquilla', lat: 10.9639, lon: -74.7964, zone: 'Atlántico' },
  { id: 'cartagena', name: 'Cartagena', lat: 10.3910, lon: -75.4794, zone: 'Bolívar' },
  { id: 'bucaramanga', name: 'Bucaramanga', lat: 7.1254, lon: -73.1198, zone: 'Santander' },
];

export default function LocationSelector({ selectedLocation, onLocationChange, customLocations = [], onAddCustomLocation, onRemoveCustomLocation }) {
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLocation, setNewLocation] = useState({ name: '', lat: '', lon: '' });
  const [searching, setSearching] = useState(false);
  
  const allLocations = [...DEFAULT_LOCATIONS, ...customLocations];
  
  const filteredLocations = allLocations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.zone?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    const zone = loc.zone || 'Otros';
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(loc);
    return acc;
  }, {});
  
  const handleSelect = (location) => {
    onLocationChange(location);
    setOpen(false);
    setSearchTerm('');
  };
  
  const handleAddLocation = () => {
    if (!newLocation.name || !newLocation.lat || !newLocation.lon) return;
    
    const location = {
      id: `custom-${Date.now()}`,
      name: newLocation.name,
      lat: parseFloat(newLocation.lat),
      lon: parseFloat(newLocation.lon),
      zone: 'Personalizado',
      isCustom: true
    };
    
    onAddCustomLocation?.(location);
    setNewLocation({ name: '', lat: '', lon: '' });
    setShowAddDialog(false);
  };
  
  // Buscar coordenadas por nombre usando Nominatim (OpenStreetMap)
  const searchCoordinates = async () => {
    if (!newLocation.name) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLocation.name + ', Colombia')}&limit=1`
      );
      const data = await res.json();
      if (data?.[0]) {
        setNewLocation({
          ...newLocation,
          lat: data[0].lat,
          lon: data[0].lon
        });
      }
    } catch (e) {
      console.error('Error buscando coordenadas:', e);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 bg-white shadow-sm h-10">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span className="font-medium">{selectedLocation?.name || 'Seleccionar ubicación'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto p-2">
            {Object.entries(groupedLocations).map(([zone, locations]) => (
              <div key={zone} className="mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
                  {zone}
                </p>
                {locations.map((loc) => (
                  <motion.button
                    key={loc.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(loc)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      selectedLocation?.id === loc.id 
                        ? 'bg-sky-100 text-sky-700' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-4 h-4 ${selectedLocation?.id === loc.id ? 'text-sky-500' : 'text-gray-400'}`} />
                      <span className="font-medium text-sm">{loc.name}</span>
                      {loc.isCustom && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    {selectedLocation?.id === loc.id && (
                      <Check className="w-4 h-4 text-sky-500" />
                    )}
                    {loc.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCustomLocation?.(loc.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    )}
                  </motion.button>
                ))}
              </div>
            ))}
            
            {filteredLocations.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">
                No se encontró "{searchTerm}"
              </p>
            )}
          </div>
          
          <div className="p-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                setOpen(false);
                setShowAddDialog(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Agregar ubicación personalizada
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Dialog para agregar ubicación */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              Agregar Ubicación
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Nombre del lugar
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Centro Comercial Andino"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={searchCoordinates}
                  disabled={searching || !newLocation.name}
                  title="Buscar coordenadas"
                >
                  <Search className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Latitud
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="4.6097"
                  value={newLocation.lat}
                  onChange={(e) => setNewLocation({ ...newLocation, lat: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Longitud
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="-74.0817"
                  value={newLocation.lon}
                  onChange={(e) => setNewLocation({ ...newLocation, lon: e.target.value })}
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-400">
              💡 Tip: Escribe el nombre y presiona 🔍 para buscar las coordenadas automáticamente
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddLocation}
              disabled={!newLocation.name || !newLocation.lat || !newLocation.lon}
              className="bg-sky-500 hover:bg-sky-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { DEFAULT_LOCATIONS };