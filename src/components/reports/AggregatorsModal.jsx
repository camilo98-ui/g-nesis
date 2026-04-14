import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formatCOP = (v) => v ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(v)) : '—';

const CHANNEL_COLORS = {
  'Al Paso': '#10b981',
  'Rappi': '#ef4444',
  'Didi': '#f97316',
  'Domicilios Propios': '#8b5cf6',
};

function getColor(channel) {
  return CHANNEL_COLORS[channel] || '#64748b';
}

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const upper = String(storeId).toUpperCase();
  const bta = upper.match(/(BTA\s*\d+)/);
  if (bta) return bta[1].replace(/\s+/, ' ');
  const tunja = upper.match(/(TUNJA\s*\d+)/);
  if (tunja) return tunja[1].replace(/\s+/, ' ');
  const bogota = upper.match(/(BOGOTA\s*\d+)/);
  if (bogota) return bogota[1].replace(/\s+/, ' ');
  return null;
}

export default function AggregatorsModal({ onClose, storeId }) {
  const storeCode = extractStoreCode(storeId);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['aggregators', storeCode],
    queryFn: async () => {
      if (!storeCode) return [];
      return base44.entities.AggregatorsData.filter({ store_code: storeCode });
    },
    enabled: !!storeCode,
  });

  // Sort by participation desc, filter out zero values
  const channels = [...records]
    .filter(r => r.participation > 0)
    .sort((a, b) => b.participation - a.participation);

  const totalPct = channels.reduce((s, r) => s + r.participation, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Agregadores</h2>
              <p className="text-white/70 text-xs">Participación por canal · {storeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : !storeCode ? (
            <div className="text-center py-16 text-slate-500">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No se pudo identificar la tienda</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-slate-700">Sin datos de agregadores</p>
              <p className="text-sm mt-1 text-slate-400">Esta tienda no tiene datos cargados aún</p>
              <p className="text-xs mt-2 text-slate-400">El gerente puede cargarlos desde el menú principal</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-4">
                Participación de cada canal en la venta bruta de la tienda
              </p>

              {channels.map((ch, idx) => {
                const pct = (ch.participation * 100).toFixed(2);
                const color = getColor(ch.channel);
                const barWidth = totalPct > 0 ? (ch.participation / totalPct) * 100 : 0;

                return (
                  <motion.div
                    key={ch.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="font-semibold text-slate-800 text-sm">{ch.channel}</span>
                      </div>
                      <span className="font-black text-slate-900 text-base">{pct}%</span>
                    </div>
                    {ch.total_sales > 0 && (
                      <p className="text-xs text-slate-500 mb-2 pl-5">{formatCOP(ch.total_sales)}</p>
                    )}
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.7, delay: idx * 0.06 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </motion.div>
                );
              })}

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total participación</span>
                  <span className="font-black text-slate-800">{(totalPct * 100).toFixed(2)}%</span>
                </div>
                {channels.some(c => c.total_sales > 0) && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Total venta canales</span>
                    <span className="font-black text-emerald-700">{formatCOP(channels.reduce((s, c) => s + (c.total_sales || 0), 0))}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <Button variant="outline" onClick={onClose} className="w-full">Cerrar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}