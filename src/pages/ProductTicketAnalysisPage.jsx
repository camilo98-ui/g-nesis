import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STORES } from '@/components/StoreSelector';
import ProductTicketAnalysis from '@/components/reports/ProductTicketAnalysis';
import FloatingIceCreamsBg from '@/components/FloatingIceCreamsBg';

export default function ProductTicketAnalysisPage() {
  const [selectedStore, setSelectedStore] = useState(STORES[0]?.code || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 relative">
      <FloatingIceCreamsBg />
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to="/Reports">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-100">
                <ArrowLeft className="w-5 h-5 text-indigo-600" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800">
                  Análisis Producto × Ticket Promedio
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> Inteligencia Comercial
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Cruza participación de productos con ventas reales para detectar motores de ticket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-52 bg-white shadow-sm">
                <SelectValue placeholder="Seleccionar tienda" />
              </SelectTrigger>
              <SelectContent>
                {STORES.map(s => (
                  <SelectItem key={s.code} value={s.code}>{s.code} — {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { label: 'Motor', icon: '🚀', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', desc: 'Alta part. + alto valor' },
            { label: 'Impulsor', icon: '⬆️', color: 'bg-blue-50 border-blue-200 text-blue-700', desc: 'Sólido en ambos' },
            { label: 'Volumen Bajo Valor', icon: '⚠️', color: 'bg-amber-50 border-amber-200 text-amber-700', desc: 'Mueve volumen sin valor' },
            { label: 'Premium Dormido', icon: '💎', color: 'bg-purple-50 border-purple-200 text-purple-700', desc: 'Alto valor, baja exposición' },
            { label: 'Sin Tracción', icon: '📉', color: 'bg-red-50 border-red-200 text-red-700', desc: 'Participación crítica' },
          ].map(l => (
            <div key={l.label} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${l.color}`}>
              <span>{l.icon}</span>
              <span>{l.label}</span>
              <span className="opacity-60">— {l.desc}</span>
            </div>
          ))}
        </div>

        {/* Main Analysis */}
        {selectedStore ? (
          <ProductTicketAnalysis storeId={selectedStore} />
        ) : (
          <div className="text-center py-20 text-slate-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Selecciona una tienda para comenzar el análisis</p>
          </div>
        )}
      </div>
    </div>
  );
}