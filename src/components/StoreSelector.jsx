import React, { useState, useMemo } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const STORES = [
  { code: "BTA 11", name: "CC PALATINO" },
  { code: "BTA 37", name: "HOMECENTER CALLE 170" },
  { code: "BTA 62", name: "CC FONTANAR" },
  { code: "BTA 49", name: "HOMECENTER CEDRITOS" },
  { code: "BTA 42", name: "CC BULEVAR NIZA" },
  { code: "BTA 85", name: "MANSION CAJICA" },
  { code: "BTA 52", name: "CC CENTRO SUBA" },
  { code: "BTA 21", name: "CC CENTRO CHIA" },
  { code: "BTA 78", name: "CC PLAZA IMPERIAL 2" },
  { code: "BTA 18", name: "CC PLAZA IMPERIAL" },
  { code: "TUNJA 1", name: "CC UNICENTRO" },
  { code: "BTA 90", name: "CC PORTAL 80" },
  { code: "BTA 59", name: "JUMBO 170" },
  { code: "BTA 14", name: "CC PORTAL CL80 #2" },
  { code: "BTA 28", name: "CC DIVERPLAZA" },
  { code: "BTA 89", name: "CC DIVERPLAZA 2" },
  { code: "BTA 16", name: "CC SAN RAFAEL" },
  { code: "BTA 13", name: "CC PORTAL CL 80 #1" },
  { code: "TUNJA 2", name: "CC VIVA TUNJA" },
];

export { STORES };

export default function StoreSelector({ selectedStore, onStoreChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredStores = useMemo(() => {
    if (!search.trim()) return STORES;
    const term = search.toLowerCase();
    return STORES.filter(s => 
      s.code.toLowerCase().includes(term) || 
      s.name.toLowerCase().includes(term)
    );
  }, [search]);
  
  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full md:w-[300px] bg-white border-gray-200 hover:border-pink-300 transition-all shadow-md hover:shadow-lg rounded-xl justify-between group"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pink-500" />
            {selectedStore ? (
              <span className="truncate">{selectedStore} - {selectedStoreName}</span>
            ) : (
              <span className="text-gray-500">Selecciona una tienda</span>
            )}
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start" side="bottom" sideOffset={5}>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input 
            placeholder="Buscar tienda..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-gray-50 placeholder:text-gray-600"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {filteredStores.map((store) => (
            <button
              key={store.code}
              onClick={() => {
                onStoreChange(store.code);
                setOpen(false);
                setSearch('');
              }}
              className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                selectedStore === store.code 
                  ? 'bg-pink-100 text-pink-700' 
                  : 'hover:bg-pink-50'
              }`}
            >
              {/* Icono de cono con bolita */}
              <svg viewBox="0 0 24 32" className="w-5 h-6">
                <circle cx="12" cy="8" r="7" fill="#FFB5C5" stroke="#ec4899" strokeWidth="1"/>
                <polygon points="5,12 12,30 19,12" fill="#D4A574" stroke="#c99a5e" strokeWidth="0.5"/>
                <line x1="7" y1="15" x2="17" y2="15" stroke="#c99a5e" strokeWidth="0.5" opacity="0.6"/>
                <line x1="8" y1="19" x2="16" y2="19" stroke="#c99a5e" strokeWidth="0.5" opacity="0.6"/>
              </svg>
              <span className="font-medium text-gray-800">{store.code}</span>
              <span className="text-gray-400 text-xs truncate">- {store.name}</span>
            </button>
          ))}
          {filteredStores.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">No se encontró "{search}"</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}