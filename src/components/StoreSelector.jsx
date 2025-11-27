import React from 'react';
import { Store, ChevronDown, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return (
    <div className="relative">
      <Select value={selectedStore} onValueChange={onStoreChange}>
        <SelectTrigger className="w-full md:w-[280px] bg-white/90 backdrop-blur-sm border-orange-200 hover:border-orange-400 transition-all shadow-lg">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            <SelectValue placeholder="Selecciona una tienda" />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[400px] bg-white/95 backdrop-blur-lg border-orange-200">
          {STORES.map((store) => (
            <SelectItem 
              key={store.code} 
              value={store.code}
              className="hover:bg-orange-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-400" />
                <span className="font-medium text-gray-800">{store.code}</span>
                <span className="text-gray-500 text-sm">({store.name})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}