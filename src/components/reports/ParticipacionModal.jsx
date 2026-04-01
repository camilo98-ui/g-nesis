import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatCurrency(val) {
  if (!val && val !== 0) return '$0';
  return '$' + Math.round(val).toLocaleString('es-CO');
}

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const upper = storeId.toUpperCase();
  const match = upper.match(/(BTA\s*\d+|TUNJA\s*\d+)/);
  return match ? match[1].replace(/\s+/, ' ') : null;
}

export default function ParticipacionModal({ onClose, storeId }) {
  const [expandedDepts, setExpandedDepts] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  // Determinar store_code de esta tienda
  const storeCode = useMemo(() => extractStoreCode(storeId), [storeId]);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['salesReport', storeCode],
    queryFn: async () => {
      if (!storeCode) return [];
      // Get all records for this store, then filter to latest report_id
      const all = await base44.entities.SalesReport.filter({ store_code: storeCode });
      if (!all.length) return [];
      // Find the most recent report_id by uploaded_at
      const latestUploadedAt = all.reduce((max, r) => r.uploaded_at > max ? r.uploaded_at : max, '');
      const latestReportId = all.find(r => r.uploaded_at === latestUploadedAt)?.report_id;
      return latestReportId ? all.filter(r => r.report_id === latestReportId) : all;
    },
    enabled: !!storeCode,
  });

  // Agrupar datos: Dept -> Sección -> Productos
  const hierarchy = useMemo(() => {
    if (!records.length) return [];

    // Calcular venta total de la tienda
    const totalVenta = records.reduce((sum, r) => sum + (r.total_sales || 0), 0);

    const deptMap = {};
    for (const r of records) {
      const dept = r.department || 'Sin Departamento';
      const sec = r.section || 'Sin Sección';
      if (!deptMap[dept]) deptMap[dept] = {};
      if (!deptMap[dept][sec]) deptMap[dept][sec] = [];
      deptMap[dept][sec].push(r);
    }

    return Object.entries(deptMap).map(([dept, sections]) => {
      const deptVenta = Object.values(sections).flat().reduce((s, r) => s + (r.total_sales || 0), 0);
      const deptPart = totalVenta > 0 ? (deptVenta / totalVenta) * 100 : 0;

      const sectionsList = Object.entries(sections).map(([sec, prods]) => {
        const secVenta = prods.reduce((s, r) => s + (r.total_sales || 0), 0);
        const secPart = totalVenta > 0 ? (secVenta / totalVenta) * 100 : 0;
        return {
          name: sec,
          venta: secVenta,
          participation: secPart,
          products: prods.map(p => ({
            description: p.product || p.section || '',
            participation: (p.participation || 0) * 100,
            venta: p.total_sales || 0,
          })).filter(p => p.description).sort((a, b) => b.venta - a.venta),
        };
      }).sort((a, b) => b.venta - a.venta);

      return { dept, venta: deptVenta, participation: deptPart, sections: sectionsList };
    }).sort((a, b) => b.venta - a.venta);
  }, [records]);

  const toggleDept = (dept) => setExpandedDepts(p => ({ ...p, [dept]: !p[dept] }));
  const toggleSection = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Participación del Negocio</h2>
              <p className="text-white/70 text-xs">{storeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : !storeCode ? (
            <div className="text-center py-20 text-slate-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No se pudo identificar el código de tienda</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">El gerente aún no ha cargado el reporte</p>
              <p className="text-sm mt-1">Cuando se suba el archivo, los datos aparecerán aquí</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-800 text-white">
                  <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider w-8"></th>
                  <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider min-w-[160px]">Departamento</th>
                  <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider min-w-[140px]">Sección</th>
                  <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider min-w-[200px]">Descripción Prod.</th>
                  <th className="py-3 px-3 text-right font-semibold text-xs uppercase tracking-wider min-w-[110px]">% Part. Catálogo</th>
                  <th className="py-3 px-3 text-right font-semibold text-xs uppercase tracking-wider min-w-[120px]">Venta Bruta</th>
                </tr>
              </thead>
              <tbody>
                {hierarchy.map(({ dept, venta, participation, sections }) => {
                  const deptExpanded = expandedDepts[dept];
                  return (
                    <React.Fragment key={dept}>
                      {/* Dept row */}
                      <tr className="bg-white border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => toggleDept(dept)}
                            className="w-5 h-5 border-2 border-slate-400 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-sm text-xs font-bold font-mono leading-none"
                          >
                            {deptExpanded ? '⊟' : '⊞'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 text-sm uppercase">{dept}</td>
                        <td className="py-2.5 px-3"></td>
                        <td className="py-2.5 px-3"></td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-500 text-sm">{participation.toFixed(2)}%</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-500 text-sm">{formatCurrency(venta)}</td>
                      </tr>

                      {deptExpanded && sections.map(section => {
                        const sectionKey = `${dept}__${section.name}`;
                        const sectionExpanded = expandedSections[sectionKey];
                        return (
                          <React.Fragment key={sectionKey}>
                            {/* Section row */}
                            <tr className="bg-slate-50/80 border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                              <td className="py-2 px-3">
                                {section.products.length > 0 && (
                                  <button
                                    onClick={() => toggleSection(sectionKey)}
                                    className="w-5 h-5 border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-sm text-xs font-bold font-mono leading-none"
                                  >
                                    {sectionExpanded ? '⊟' : '⊞'}
                                  </button>
                                )}
                              </td>
                              <td className="py-2 px-3"></td>
                              <td className="py-2 px-3 font-semibold text-slate-700 text-sm pl-5">{section.name}</td>
                              <td className="py-2 px-3"></td>
                              <td className="py-2 px-3 text-right text-rose-400 font-semibold text-sm">{section.participation.toFixed(2)}%</td>
                              <td className="py-2 px-3 text-right text-rose-400 font-semibold text-sm">{formatCurrency(section.venta)}</td>
                            </tr>

                            {sectionExpanded && section.products.map((prod, idx) => (
                              <tr key={idx} className="bg-white border-b border-slate-50 hover:bg-pink-50/20 transition-colors">
                                <td className="py-1.5 px-3"></td>
                                <td className="py-1.5 px-3"></td>
                                <td className="py-1.5 px-3"></td>
                                <td className="py-1.5 px-3 text-slate-600 text-xs pl-10">{prod.description}</td>
                                <td className="py-1.5 px-3 text-right text-rose-400 text-xs font-medium">{prod.participation.toFixed(2)}%</td>
                                <td className="py-1.5 px-3 text-right text-rose-500 text-xs font-bold">{formatCurrency(prod.venta)}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-3 border-t flex-shrink-0 flex justify-end">
          <Button variant="outline" onClick={onClose} size="sm">Cerrar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}