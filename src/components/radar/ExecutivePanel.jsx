import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Target, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildFallbackNarrative, fmtInt, fmtPct } from './radarModel';

function buildSummary(m) {
  return {
    periodo: m.periodLabel,
    comparado_con: m.comparisonLabel,
    posicion_competitiva: m.hero.verdict === 'winning' ? 'POPSY ganando' : m.hero.verdict === 'losing' ? 'POPSY perdiendo' : m.hero.verdict === 'close' ? 'competencia muy cercana' : 'sin veredicto',
    ventaja_vs_promedio_competidores_pct: m.hero.advantagePct == null ? null : Number(m.hero.advantagePct.toFixed(1)),
    transacciones_popsy: m.popsy.total,
    crecimiento_popsy_pct: m.popsy.growth == null ? null : Number(m.popsy.growth.toFixed(1)),
    transacciones_competencia: m.competition.total,
    crecimiento_competencia_pct: m.competition.growth == null ? null : Number(m.competition.growth.toFixed(1)),
    participacion_popsy_pct: m.participation == null ? null : Number(m.participation.toFixed(1)),
    tomas_ganadas: `${m.hero.won}/${m.hero.totalComparisons}`,
    tomas_perdidas: m.hero.lost,
    tomas_empatadas: m.hero.near,
    duelos: m.duels.filter((d) => d.obs > 0).map((d) => ({
      competidor: d.name,
      transacciones_popsy: d.popsy,
      transacciones_competidor: d.comp,
      diferencia_pct: d.marginPct == null ? null : Number(d.marginPct.toFixed(1)),
      resultado: d.winner === 'popsy' ? 'POPSY gana' : d.winner === 'comp' ? 'POPSY pierde' : 'muy cerca',
      ultima_toma: d.last ? `${d.last.p} vs ${d.last.c}` : null,
    })),
    clasificacion_amenazas: m.threats.map((t) => ({
      competidor: t.name,
      nivel: t.level === 'threat' ? 'amenaza alta' : t.level === 'opportunity' ? 'oportunidad' : 'vigilancia',
      volumen_transacciones: t.total,
      crecimiento_vs_periodo_anterior_pct: t.growth == null ? null : Number(t.growth.toFixed(1)),
      razon_calculada: t.reason,
    })),
    cruces_detectados: m.crossings.map((c) => ({
      evento: c.type === 'up' ? `POPSY superó a ${c.name} en la toma ${c.take}` : `${c.name} superó a POPSY en la toma ${c.take}`,
    })),
    mapa_por_tienda: m.storeMatrix.map((s) => ({
      tienda: s.storeId,
      resultados: s.cells.map((c) => `${c.name}:${c.status === 'win' ? 'POPSY gana' : c.status === 'lose' ? 'POPSY pierde' : c.status === 'tie' ? 'muy cerca' : 'sin datos'}`),
    })),
    participacion_por_marca: m.shareRows.map((r) => ({
      marca: r.name,
      pct_actual: r.currPct == null ? null : Number(r.currPct.toFixed(1)),
      pct_periodo_anterior: r.prevPct == null ? null : Number(r.prevPct.toFixed(1)),
    })),
  };
}

export default function ExecutivePanel({ model }) {
  const fallback = useMemo(() => buildFallbackNarrative(model), [model]);
  const summary = useMemo(() => buildSummary(model), [model]);

  const ai = useQuery({
    queryKey: ['radarExecutive', summary],
    enabled: !model.insufficient,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un analista senior de inteligencia competitiva de POPSY (heladería colombiana). Analiza los datos del estudio de competencia (transacciones estimadas por diferencia de seriales de facturas en centros comerciales) y redacta dos textos ejecutivos en español, directos y accionables.

REGLAS ESTRICTAS:
- Usa EXCLUSIVAMENTE los datos del JSON. NUNCA inventes cifras, marcas, tendencias ni conclusiones.
- Cita marcas, tiendas y cifras reales de los datos.
- Si los datos no alcanzan para alguna conclusión, omitela. Si en general son insuficientes, responde exactamente: "No hay información suficiente para generar una conclusión."

LECTURA EJECUTIVA (máx 120 palabras): qué está pasando, qué cambió, contra quién, dónde (tiendas), qué vigilar, cuál es la oportunidad.
RECOMENDACIÓN (máx 60 palabras): una acción concreta basada en los datos (tiendas o competidores específicos).

DATOS:
${JSON.stringify(summary)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            lectura: { type: 'string' },
            recomendacion: { type: 'string' },
          },
        },
      });
      return { lectura: res?.lectura || '', recomendacion: res?.recomendacion || '' };
    },
  });

  const lectura = model.insufficient ? fallback.lectura : (ai.data?.lectura || fallback.lectura);
  const recomendacion = model.insufficient ? fallback.recomendacion : (ai.data?.recomendacion || fallback.recomendacion);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
      {/* Lectura ejecutiva */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card card-elevated relative overflow-hidden rounded-2xl p-5 lg:col-span-3">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.08) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-2.5 mb-3 relative">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.14), rgba(194,24,117,0.04))', border: '1px solid rgba(194,24,117,0.12)' }}>
            <Brain className="w-4 h-4" style={{ color: '#C21875' }} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-[0.16em] uppercase text-slate-500">09 · Lectura Ejecutiva</p>
            <p className="text-[9px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" style={{ color: '#f59e0b' }} />
              {model.insufficient ? 'análisis local' : ai.isLoading ? 'analizando datos reales...' : ai.isError ? 'análisis local (IA no disponible)' : 'generada con IA sobre datos reales'}
            </p>
          </div>
        </div>
        {ai.isLoading && !model.insufficient ? (
          <div className="space-y-2 py-2">
            {[90, 100, 75, 60].map((w, i) => (
              <div key={i} className="h-3 rounded-full shimmer" style={{ width: `${w}%`, background: '#fce7f3' }} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-slate-600 font-medium leading-relaxed relative">{lectura}</p>
        )}
      </motion.div>

      {/* Recomendación */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card card-elevated relative overflow-hidden rounded-2xl p-5 lg:col-span-2 flex flex-col">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.14)' }}>
            <Target className="w-4 h-4" style={{ color: '#10b981' }} />
          </div>
          <p className="text-[10px] font-black tracking-[0.16em] uppercase text-slate-500">10 · Recomendación</p>
        </div>
        {ai.isLoading && !model.insufficient ? (
          <div className="space-y-2 py-2">
            {[100, 85, 70].map((w, i) => (
              <div key={i} className="h-3 rounded-full shimmer" style={{ width: `${w}%`, background: '#fce7f3' }} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl px-4 py-3 flex-1" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.14)' }}>
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{recomendacion}</p>
          </div>
        )}
        <p className="text-[9px] text-slate-300 font-medium mt-3 text-right italic">
          La información nos da ventaja. La acción nos hace ganar. <span className="font-black" style={{ color: '#C21875' }}>— POPSY</span>
        </p>
      </motion.div>
    </div>
  );
}