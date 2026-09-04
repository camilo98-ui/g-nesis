import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Target, Lightbulb, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PremiumSection } from './RadarShared';
import { POPSY_KEY, fmtInt } from './radarModel';

function buildFallback(model, trend) {
  const H = [trend.narrative];

  const mainDuel = model.duels.filter((d) => d.obs > 0)
    .sort((a, b) => (b.popsy + b.comp) - (a.popsy + a.comp))[0];
  if (mainDuel) {
    const res = mainDuel.winner === 'popsy' ? 'gana el duelo directo' : mainDuel.winner === 'comp' ? 'pierde el duelo directo' : 'está muy parejo';
    H.push(`Contra ${mainDuel.name}, POPSY ${res}: ${fmtInt(mainDuel.popsy)} vs ${fmtInt(mainDuel.comp)} transacciones en ${mainDuel.obs} toma${mainDuel.obs !== 1 ? 's' : ''} comparable${mainDuel.obs !== 1 ? 's' : ''}.`);
  }

  const top = model.threats.find((t) => t.level === 'threat') || model.threats.find((t) => t.level === 'opportunity');
  if (top) H.push(`${top.name}: ${top.reason}`);
  while (H.length < 3) H.push('No hay suficientes datos comparables para un hallazgo adicional en este periodo.');

  const threat = model.threats.find((t) => t.level === 'threat');
  const opp = model.threats.find((t) => t.level === 'opportunity');
  const storeRef = model.filters.storeId === 'ALL' ? 'la red' : model.filters.storeId;
  let accion;
  if (model.insufficient) {
    accion = 'Registrar más tomas en la tienda para desbloquear recomendaciones accionables.';
  } else if (trend.status === 'declining') {
    accion = `Activar plan de recuperación en ${storeRef}: revisar las causas de la caída en la última medición${threat ? ` y priorizar activaciones frente a ${threat.name}` : ''}.`;
  } else if (trend.status === 'growing') {
    accion = `Sostener la estrategia actual en ${storeRef}${opp ? ` y capitalizar la desaceleración de ${opp.name} con activaciones dirigidas` : ''}.`;
  } else {
    accion = threat
      ? `Buscar aceleración frente a ${threat.name}: ${storeRef} sostiene su ritmo pero la brecha sigue abierta.`
      : `Mantener el plan comercial: ${storeRef} compite de forma estable en el periodo.`;
  }

  return { hallazgos: H.slice(0, 3), accion };
}

function buildSummary(model, trend) {
  return {
    tienda: model.filters.storeId,
    periodo: model.periodLabel,
    comparado_con: model.comparisonLabel,
    tendencia: {
      estado: trend.status,
      narrativa: trend.narrative,
      deltas: trend.deltas.map((d) => ({
        de: d.fromLabel, a: d.toLabel,
        cambio_pct: d.pct == null ? null : Number(d.pct.toFixed(1)),
      })),
    },
    transacciones_popsy: model.popsy.total,
    crecimiento_popsy_pct: model.popsy.growth == null ? null : Number(model.popsy.growth.toFixed(1)),
    tomas_ganadas: model.hero.won,
    tomas_perdidas: model.hero.lost,
    participacion_popsy_pct: model.participation == null ? null : Number(model.participation.toFixed(1)),
    serie_por_medicion: (model.takesSeries.length ? model.takesSeries : model.monthlySeries).map((e) => ({
      medicion: e.label,
      popsy: e[POPSY_KEY] ?? null,
      competencia: Object.fromEntries(model.activeComps.filter((k) => e[k] != null).map((k) => [model.nameOf[k], e[k]])),
    })),
    duelos: model.duels.filter((d) => d.obs > 0).map((d) => ({
      competidor: d.name,
      popsy: d.popsy,
      competencia: d.comp,
      diferencia_pct: d.marginPct == null ? null : Number(d.marginPct.toFixed(1)),
      resultado: d.winner === 'popsy' ? 'POPSY gana' : d.winner === 'comp' ? 'POPSY pierde' : 'muy cerca',
    })),
    clasificacion_competidores: model.threats.map((t) => ({
      competidor: t.name,
      nivel: t.level === 'threat' ? 'amenaza' : t.level === 'opportunity' ? 'oportunidad' : 'vigilancia',
      transacciones: t.total,
      crecimiento_pct: t.growth == null ? null : Number(t.growth.toFixed(1)),
      razon_calculada: t.reason,
    })),
  };
}

export default function AIInsight({ model, trend }) {
  const fallback = useMemo(() => buildFallback(model, trend), [model, trend]);
  const summary = useMemo(() => buildSummary(model, trend), [model, trend]);

  const ai = useQuery({
    queryKey: ['radarInsight', summary],
    enabled: !model.insufficient,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un analista senior de inteligencia competitiva de POPSY (heladería colombiana). Los datos provienen de un estudio de competencia por diferencia de seriales de facturas en centros comerciales.

REGLAS ESTRICTAS:
- Usa EXCLUSIVAMENTE los datos del JSON. NUNCA inventes cifras, marcas ni conclusiones.
- Cita marcas, tomas y cifras reales de los datos.
- Si los datos no alcanzan para alguna conclusión, omítela.

Entrega exactamente 3 hallazgos principales (cada uno de máximo 25 palabras, una frase directa con cifras) y 1 acción recomendada (máximo 30 palabras, concreta y ejecutable por el líder de la tienda).

DATOS:
${JSON.stringify(summary)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            hallazgos: { type: 'array', items: { type: 'string' } },
            accion: { type: 'string' },
          },
        },
      });
      const hallazgos = (res?.hallazgos || []).filter((h) => typeof h === 'string' && h.trim());
      return { hallazgos, accion: (res?.accion || '').trim() };
    },
  });

  const hallazgos = model.insufficient ? fallback.hallazgos
    : (ai.data?.hallazgos?.length >= 1 ? ai.data.hallazgos.slice(0, 3) : fallback.hallazgos);
  const accion = model.insufficient ? fallback.accion : (ai.data?.accion || fallback.accion);
  const loading = ai.isLoading && !model.insufficient;

  return (
    <PremiumSection
      title="07 · Insight IA"
      sub={`3 hallazgos y 1 acción para ${model.filters.storeId === 'ALL' ? 'la red' : model.filters.storeId}`}
      tip="Interpretación generada con IA sobre los datos reales del periodo. Si la IA no está disponible, se muestran hallazgos calculados localmente."
      delay={0.24} icon={Brain}
      right={(
        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
          <Sparkles className="w-3 h-3" style={{ color: '#f59e0b' }} />
          {model.insufficient ? 'análisis local' : loading ? 'analizando...' : ai.isError ? 'análisis local (IA no disponible)' : 'generado con IA sobre datos reales'}
        </span>
      )}>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 space-y-2.5">
          {loading ? (
            [92, 100, 78].map((w, i) => (
              <div key={i} className="h-9 rounded-xl shimmer" style={{ width: `${w}%`, background: '#fce7f3' }} />
            ))
          ) : (
            hallazgos.map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5"
                style={{ background: '#fafafa', border: '1px solid #f1f5f9' }}>
                <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(194,24,117,0.08)', color: '#C21875', border: '1px solid rgba(194,24,117,0.15)' }}>
                  {i + 1}
                </div>
                <p className="text-[12px] text-slate-600 font-medium leading-relaxed">{h}</p>
              </motion.div>
            ))
          )}
        </div>
        <div className="xl:col-span-2">
          {loading ? (
            <div className="h-full min-h-[110px] rounded-2xl shimmer" style={{ background: '#fce7f3' }} />
          ) : (
            <div className="rounded-2xl p-4 h-full flex flex-col"
              style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.14)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                <p className="text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: '#059669' }}>Acción recomendada</p>
              </div>
              <p className="text-[12px] text-slate-600 font-bold leading-relaxed flex-1">{accion}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-3 flex items-center gap-1">
                <Lightbulb className="w-2.5 h-2.5" /> Basada exclusivamente en los datos del periodo
              </p>
            </div>
          )}
        </div>
      </div>
    </PremiumSection>
  );
}