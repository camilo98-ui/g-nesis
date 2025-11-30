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
          className="w-full md:w-[300px] bg-white border-gray-200 hover:border-pink-300 transition-all shadow-sm rounded-xl justify-start"
        >
          <MapPin className="w-4 h-4 text-pink-500 mr-2" />
          {selectedStore ? (
            <span className="truncate">{selectedStore} - {selectedStoreName}</span>
          ) : (
            <span className="text-gray-400">Selecciona una tienda</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Buscar tienda..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-gray-50"
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
              <span className="text-lg">🍦</span>
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