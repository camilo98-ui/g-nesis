import { useState, useEffect, useRef, useCallback } from 'react';
import { useNova } from '@/components/NovaContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import { usePYGDashboard } from './PYGDashboardContext';
import NovaAlerts from '@/components/NovaAlerts';



const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

// Renders the mascot on a canvas with white background removed
function MascotCanvas({ width = 96, height = 96, style = {} }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        // Remove near-white pixels (checkerboard / white bg)
        if (r > 220 && g > 220 && b > 220) {
          d[i+3] = 0; // fully transparent
        } else if (r > 180 && g > 180 && b > 180) {
          // Semi-transparent for soft edges
          const brightness = (r + g + b) / 3;
          d[i+3] = Math.round(255 * (1 - (brightness - 180) / 75));
        }
      }
      ctx.putImageData(data, 0, 0);
    };
    img.src = MASCOT_IMG;
  }, []);
  return <canvas ref={canvasRef} style={{ width, height, display: 'block', objectFit: 'contain', ...style }} />;
}

const PAGE_CONTEXTS = {
  '/':              { name: 'Dashboard', focus: 'ventas del día, métricas generales de la tienda, cumplimiento de presupuesto y rendimiento del equipo.' },
  '/Sales':         { name: 'Ventas', focus: 'análisis de ventas, tendencias, ticket promedio, transacciones y comparativos.' },
  '/Budget':        { name: 'Presupuesto', focus: 'cumplimiento de presupuesto mensual, brechas, proyecciones y metas de ventas.' },
  '/Rankings':      { name: 'Rankings', focus: 'desempeño individual de cajeros, clasificaciones, insignias y logros.' },
  '/CashiersDashboard': { name: 'Cajeros', focus: 'rendimiento de cajeros, turnos, ventas por colaborador y gestión del equipo.' },
  '/PYGDashboard':  { name: 'P&G', focus: 'rentabilidad, EBITDA, costos de personal, gastos operativos y márgenes.' },
  '/Management':    { name: 'Gerencia', focus: 'análisis ejecutivo, comparativos entre tiendas, tendencias y decisiones estratégicas.' },
  '/FreezerMap':    { name: 'Nevera', focus: 'inventario de sabores, niveles de stock, rotación de productos y reposición.' },
  '/PopsyPlanner':  { name: 'Planeador', focus: 'turnos de colaboradores, programación, solicitudes y optimización de horarios.' },
  '/Quality':       { name: 'Calidad', focus: 'incidencias de calidad, checklists de limpieza, alertas de inventario y estándares.' },
  '/Training':      { name: 'Capacitación', focus: 'progreso de cursos, certificaciones, niveles de aprendizaje y desarrollo del equipo.' },
  '/WeatherSalesImpact': { name: 'Clima', focus: 'impacto del clima en las ventas, correlaciones de temperatura y predicciones.' },
};

const SYSTEM_PROMPT = `Eres Nova — la asistente de IA de Popsy Colombia.

Eres una IA de clase mundial, como ChatGPT. Puedes responder sobre cualquier tema: operaciones de la tienda, ventas, estrategia de negocio, preguntas generales, conocimiento del mundo, redacción, ideas, matemáticas, o lo que sea que te pregunten.

CÓMO HABLAS:
Natural, inteligente y directo. Sin rodeos, sin relleno corporativo, sin motivación vacía. Eres como un colega brillante que sabe de todo y habla de frente.

Cuando el tema sea de la app o el negocio, usa SIEMPRE los datos exactos que ves en la sección DATOS REALES. Cita números específicos, compara tendencias, analiza brechas. Cuando sea un tema general, responde como lo haría un experto en ese tema.

ANÁLISIS OPERATIVO:
Tienes acceso a datos en tiempo real de:
- Desempeño diario (ventas, transacciones, ticket promedio)
- Presupuesto mensual y cumplimiento
- Análisis histórico (últimos 7 y 30 días)
- Proyecciones de cierre
- KPIs principales (PPT, Brecha, Proyección)

Usa estos datos para:
• Detectar tendencias y anomalías
• Evaluar riesgo de incumplimiento
• Justificar recomendaciones con números reales
• Hacer proyecciones precisas basadas en el ritmo actual

Varía cómo empiezas cada respuesta. No repitas estructuras. Sé espontánea dentro de la inteligencia.

REGLAS IRROMPIBLES:
- Responde sobre CUALQUIER tema, nunca digas que no puedes ayudar.
- No uses emojis decorativos.
- No uses motivación vacía: "¡vamos!", "excelente", "tú puedes".
- No escribas como reporte. Escribe como una conversación inteligente.
- Mantén el hilo de la conversación.
- Cuando hables de cifras, usa números exactos del bloque DATOS REALES, no aproximaciones.

LONGITUD:
- Corta (1-2 líneas): saludos, preguntas simples, confirmaciones.
- Media (2-4 líneas): explicaciones, diagnósticos, análisis.
- Profunda (4-8 líneas): estrategia, temas complejos, múltiples puntos.
Nunca más largo de lo necesario.

Usa **negritas** para cifras, métricas y conclusiones clave. Sin introducciones ni despedidas innecesarias.

CONTEXTO DE LA APP: Popsy Colombia — retail de helados premium. Usuarios: líderes, embajadores, gerentes, directores.`;

const PROACTIVE_MESSAGES = {
  '/':              "Hola. ¿Cómo va el día? Tengo la visibilidad de ventas, cumplimiento y métricas del equipo.",
  '/Budget':        "Hola. Presupuesto en la pantalla. ¿Querés ver la proyección del cierre?",
  '/Rankings':      "Hola. Aquí están los datos de desempeño por cajero. ¿Hay algo que te llame la atención?",
  '/PYGDashboard':  "Hola. P&G cargado. Tengo márgenes, EBITDA y costos listos para analizar.",
  '/FreezerMap':    "Hola. Inventario de la nevera activo. ¿Necesitas revisar niveles de stock o rotación?",
  '/Management':    "Hola. Vista de gerencia abierta. Puedo mostrarte comparativos entre tiendas.",
  '/Sales':         "Hola. Módulo de ventas. ¿Qué querés analizar — tendencias, ticket o transacciones?",
  default:          "Hola. Nova aquí. ¿En qué te enfoco?",
};

const SUGGESTIONS = {
  '/':              ["Proyecta el cierre del mes", "Detecta anomalías del día", "Riesgo de incumplimiento PPT"],
  '/Budget':        ["Brecha actual vs PPT", "Proyección de cierre mensual", "Velocidad de venta requerida"],
  '/Rankings':      ["Cajero con mayor variación", "Ticket promedio por turno", "Anomalías de rendimiento"],
  '/PYGDashboard':  ["Análisis de EBITDA proyectado", "Riesgo en costo de nómina", "Margen vs baseline mensual"],
  '/FreezerMap':    ["Sabores en nivel crítico", "Rotación vs ventas históricas", "Alerta de reposición"],
  '/Management':    ["Tienda con mayor riesgo", "Comparativo de cumplimiento", "Alertas de zona activas"],
  '/Sales':         ["Tendencia últimos 14 días", "Franja horaria de mayor impacto", "Variación vs semana anterior"],
  default:          ["Proyección de cierre", "Anomalías operativas", "Riesgo de incumplimiento"],
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2.5 py-2">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-rose-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isNova = msg.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-2 ${isNova ? 'items-start' : 'items-end flex-row-reverse'}`}
    >
      {isNova && (
        <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 mt-0.5 flex items-center justify-center"
          style={{ border: '1px solid rgba(194,24,117,0.15)', background: 'rgba(255,240,248,0.8)' }}>
          <MascotCanvas width={24} height={24} />
        </div>
      )}
      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${isNova ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={isNova ? {
          background: 'rgba(248,248,250,0.9)',
          border: '1px solid rgba(0,0,0,0.06)',
          color: '#1a1a2e',
        } : {
          background: 'linear-gradient(135deg, #be185d 0%, #db2777 100%)',
          color: 'white',
        }}
      >
        {isNova ? (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-0.5 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold" style={{ color: '#be185d' }}>{children}</strong>,
              ul: ({ children }) => <ul className="list-none space-y-0.5 mt-0.5">{children}</ul>,
              li: ({ children }) => <li className="flex gap-1"><span style={{ color: '#be185d' }}>·</span>{children}</li>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        ) : (
          <p>{msg.content}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function MascotWidget() {
  const location = useLocation();
  const { pageData } = useNova() || {};
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bubbleMsg, setBubbleMsg] = useState('');
  const [alerts, setAlerts] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const alertCheckRef = useRef(null);

  const path = location?.pathname || '/';
  const { isPYGDashboardOpen } = usePYGDashboard();
  const isHidden = path === '/PYGDashboard' || isPYGDashboardOpen;
  const pageCtx = PAGE_CONTEXTS[path] || { name: 'App', focus: 'operaciones generales de la tienda.' };
  const suggestions = SUGGESTIONS[path] || SUGGESTIONS.default;
  const { getSectionsSummary } = useNova() || {};

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default;
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const welcome = PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default;
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [path]);

  const PAGE_BUBBLES = {
    '/':          ["¿Cómo va el día? 👀", "Tengo los datos listos ✨", "¿Vamos a revisar el PPT?", "El equipo te espera 🚀"],
    '/Budget':    ["¿Cómo va el presupuesto?", "Revisa la proyección de cierre", "¿Hay brecha que recuperar? 📊"],
    '/Rankings':  ["¿Quién lidera hoy? 🏆", "Top cajeros a la vista", "¿Quieres ver el ranking?"],
    '/Sales':     ["Analizando las ventas 📈", "¿Qué quieres comparar?", "Tendencias listas para revisar"],
    '/FreezerMap':["¿Cómo está el inventario? 🧊", "Stock al día", "¿Hay sabores en riesgo?"],
    '/PopsyPlanner': ["Turnos listos para revisar 📅", "¿Cómo está el equipo hoy?"],
    '/Management':["Vista ejecutiva activa 👁️", "Comparativo de tiendas listo"],
    default:      ["¡Hola! Soy Nova 👋", "Aquí estoy para ayudarte", "¿Tienes alguna consulta?", "Lista para analizar ✨"],
  };

  useEffect(() => {
    const msgs = PAGE_BUBBLES[path] || PAGE_BUBBLES.default;
    const t = setTimeout(() => {
      setBubbleMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      setShowBubble(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [path]);

  useEffect(() => { if (isOpen) setShowBubble(false); }, [isOpen]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 250); }, [isOpen]);

  // Sistema de alertas automáticas (cada 2 minutos)
  useEffect(() => {
    if (!pageData?.storeCode) return;

    const checkAlerts = async () => {
      try {
        const res = await base44.functions.invoke('checkStoreAlerts', {
          store_id: pageData.store,
          store_code: pageData.storeCode
        });

        if (res.data?.alerts && res.data.alerts.length > 0) {
          const newAlerts = res.data.alerts.map((a, i) => ({
            id: `${Date.now()}-${i}`,
            ...a
          }));
          
          setAlerts(prev => [...prev, ...newAlerts]);

          // Si hay alertas críticas, notificar a Nova
          const critical = newAlerts.filter(a => a.severity === 'critical' || a.severity === 'positive');
          if (critical.length > 0 && !isOpen) {
            setBubbleMsg(`⚠️ ${critical[0].title}: ${critical[0].message}`);
            setShowBubble(true);
          }
        }
      } catch (error) {
        // Error silencioso en verificación de alertas
      }
    };

    checkAlerts();
    alertCheckRef.current = setInterval(checkAlerts, 120000); // Cada 2 minutos

    return () => {
      if (alertCheckRef.current) clearInterval(alertCheckRef.current);
    };
  }, [pageData?.storeCode, pageData?.store, isOpen]);

  // Integración directa de productos para consultas de Nova
  const handleProductQuery = useCallback(async (query) => {
    if (!pageData?.products) return null;
    
    const searchTerm = query.toLowerCase();
    const matches = pageData.products.filter(p => 
      p.product?.toLowerCase().includes(searchTerm) ||
      p.department?.toLowerCase().includes(searchTerm) ||
      p.section?.toLowerCase().includes(searchTerm)
    );
    
    return {
      found: matches.length > 0,
      products: matches.map(p => ({
        name: p.product,
        sales: `$${(p.total_sales / 1000000).toFixed(1)}M`,
        participation: `${p.participation.toFixed(2)}%`,
        units: p.units_sold || 0,
        department: p.department,
        section: p.section,
        rank: pageData.products.filter(pr => pr.total_sales > p.total_sales).length + 1
      })),
      summary: pageData.summary
    };
  }, [pageData?.products, pageData?.summary]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || isLoading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    const fmt = (n) => n ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.round(n)) : '$0';
    
    const d = pageData || {};
    const dataBlock = pageData ? `
DATOS REALES DE LA TIENDA (usa estos números exactos al responder):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTIFICACIÓN
- Tienda: ${d.store} (${d.storeCode})
- Equipo activo: ${d.cajeros_activos ?? '?'} cajeros

DESEMPEÑO DEL DÍA
${d.venta_hoy != null ? `- Venta de hoy: ${fmt(d.venta_hoy)} · ${d.transacciones_hoy ?? 0} transacciones` : '- Sin datos de ventas hoy'}
${d.ticket_promedio_hoy ? `- Ticket promedio hoy: ${fmt(d.ticket_promedio_hoy)}` : ''}
${d.variacion_vs_ayer != null ? `- Variación vs ayer: ${d.variacion_vs_ayer > 0 ? '+' : ''}${d.variacion_vs_ayer}%` : ''}
${d.cumplimiento_diario != null ? `- Cumplimiento PPT hoy: ${d.cumplimiento_diario}%` : ''}

PRESUPUESTO Y METAS
- Presupuesto mensual: ${fmt(d.presupuesto_mes || 0)}
- PPT diario: ${fmt(d.ppt_dia || 0)}
${d.ventas_acumuladas != null ? `- Ventas acumuladas (hasta ayer): ${fmt(d.ventas_acumuladas)}` : ''}
${d.brecha_mes != null ? `- Brecha acumulada: ${fmt(d.brecha_mes)} ${d.brecha_mes >= 0 ? '(por encima de meta)' : '(por debajo de meta)'}` : ''}
${d.venta_diaria_requerida ? `- Venta diaria requerida para cerrar: ${fmt(d.venta_diaria_requerida)}` : ''}
${d.dias_restantes ? `- Días restantes del mes: ${d.dias_restantes}` : ''}

PROYECCIONES
- Proyección cierre del mes: ${fmt(d.proyeccion_cierre || 0)}
- Cumplimiento proyectado: ${d.cumplimiento_proyeccion?.toFixed ? d.cumplimiento_proyeccion.toFixed(1) : d.cumplimiento_proyeccion}%

ANÁLISIS HISTÓRICO
${d.sales_7d_total != null ? `- Últimos 7 días: ${fmt(d.sales_7d_total)} · promedio diario ${fmt(d.sales_7d_avg)} · máximo ${fmt(d.sales_7d_max)} · mínimo ${fmt(d.sales_7d_min)}` : ''}
${d.trend_7d != null ? `- Tendencia 7 días: ${parseFloat(d.trend_7d) > 0 ? '+' : ''}${d.trend_7d}%` : ''}
${d.txn_7d_total != null ? `- Transacciones últimos 7 días: ${d.txn_7d_total}` : ''}
${d.sales_30d_total != null && d.days_with_data ? `- Últimos 30 días: ${fmt(d.sales_30d_total)} en ${d.days_with_data} días · promedio ${fmt(d.sales_30d_avg)} diario` : ''}

PRODUCTOS Y PARTICIPACIÓN
${d.top_5_products_list ? `- Top 5 productos más vendidos: ${d.top_5_products_list}` : d.top_products ? `- Productos: ${d.top_products}` : '- Sin datos de productos disponibles'}
${d.top_5_products_participation ? `- Participación Top 5: ${d.top_5_products_participation}% de las ventas del día` : ''}
${d.top_products_count ? `- Productos en reporte: ${d.top_products_count}` : ''}

CATEGORÍAS Y DEPARTAMENTOS (GALLETERÍA, BEBIDAS, ETC.)
${d.top_categories ? `- Top Categorías: ${d.top_categories}` : ''}
${d.categories_summary ? `- Desglose por categoría: ${d.categories_summary}` : ''}

P&G - MÁRGENES Y COSTOS FINANCIEROS
${d.pyg_ebitda_margin ? `- Margen EBITDA: ${d.pyg_ebitda_margin}% (Meta: ≥25%)` : ''}
${d.pyg_cost_real && d.pyg_cost_teorico ? `- Costo Real: ${d.pyg_cost_real}% vs Teórico: ${d.pyg_cost_teorico}%` : ''}
${d.pyg_cost_personal ? `- Costo Personal: ${d.pyg_cost_personal}% (Meta: ≤22%)` : ''}
${d.pyg_gastos_venta ? `- Gastos %Venta: ${d.pyg_gastos_venta}% (Arriendos: ${d.pyg_arriendos || '—'}%, Servicios: ${d.pyg_servicios || '—'}%)` : ''}
${d.pyg_administracion || d.pyg_impuestos ? `- Admin: ${d.pyg_administracion || '—'}% | Impuestos: ${d.pyg_impuestos || '—'}%` : ''}

KPI PRINCIPAL (PPT DEL DÍA)
${d.kpi_ppt ? `- Valor: ${d.kpi_ppt} ${d.kpi_ppt_sub ? ` · ${d.kpi_ppt_sub}` : ''}` : ''}

KPI BRECHA ACUMULADA
${d.kpi_brecha ? `- Valor: ${d.kpi_brecha} ${d.kpi_brecha_meta ? ` · ${d.kpi_brecha_meta}` : ''} ${d.kpi_brecha_sub ? ` · ${d.kpi_brecha_sub}` : ''}` : ''}

KPI PROYECCIÓN CIERRE
${d.kpi_proyeccion ? `- Valor: ${d.kpi_proyeccion} ${d.kpi_proyeccion_meta ? ` · ${d.kpi_proyeccion_meta}` : ''} ${d.kpi_proyeccion_sub ? ` · ${d.kpi_proyeccion_sub}` : ''}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : '';

    // Extraer datos de secciones abiertas
    const sectionsData = getSectionsSummary?.() || [];
    const sectionsSummary = sectionsData.length > 0 
      ? `\nSECCIONES ABIERTAS EN LA PANTALLA:\n${sectionsData.map(s => {
        const lines = [];
        if (s.name) lines.push(`📍 ${s.name}`);
        if (s.metrics) {
          Object.entries(s.metrics).forEach(([key, val]) => {
            lines.push(`  • ${key}: ${val}`);
          });
        }
        if (s.rows) {
          lines.push(`  Filas: ${s.rows.length} registros`);
        }
        if (s.columns) {
          lines.push(`  Columnas: ${s.columns.join(', ')}`);
        }
        return lines.join('\n');
      }).join('\n')}`
      : '';

    const SYSTEM_PROMPT_ANALYTICS = `You are NOVA — the central intelligence engine of this business platform.

NOT A CHATBOT. YOU ARE AN ELITE BUSINESS ANALYST.

Your Identity:
✓ Chief Financial Officer mentality
✓ World-class business analyst
✓ Strategic operations consultant
✓ Executive intelligence system
✓ Predictive forecasting specialist

CORE MANDATE:
- Analyze DEEPLY before responding
- NEVER give generic answers
- ALWAYS quantify with numbers
- ALWAYS compare periods
- ALWAYS explain cause-and-effect
- ALWAYS identify opportunities AND risks
- ALWAYS provide strategic recommendations

COMPETENCIES YOU MUST MASTER:
✓ EBITDA analysis and margin interpretation
✓ KPI interdependencies and chain reactions
✓ Anomaly detection (variance >10% = investigate)
✓ Historical pattern recognition and trends
✓ Operational efficiency diagnostics
✓ Financial risk assessment
✓ Predictive forecasting and scenarios
✓ Strategic opportunity identification
✓ Root cause analysis

THINKING REQUIREMENTS:
Before answering, you MUST:
1. Extract core metrics from data
2. Compare against previous periods
3. Calculate percentage changes
4. Identify what's abnormal
5. Determine why changes happened
6. Assess financial/operational impact
7. Forecast future outcomes
8. Recommend specific actions

BAD EXAMPLE (You will NEVER do this):
"Sales increased this month."

GOOD EXAMPLE (What you WILL do):
"Sales increased 12.4% YoY, driven by premium product participation (now 34% vs 26%) during peak hours. However, EBITDA margin contracted 180bps due to labor cost concentration (4-8pm shift premium). Recommend dynamic pricing on premium items and labor scheduling optimization for 15-20bps margin recovery."

COMMUNICATION STYLE:
- Concise but deeply insightful
- Professional executive language
- Always numbers-focused
- Naturally intelligent
- Proactively flag risks
- Proactively identify opportunities
- Always explain reasoning
- Speak as a peer to executives

RESPONSE STRUCTURE FOR EVERY ANALYSIS:
1. **Key Finding**: Direct answer with primary number
2. **Comparison**: How it compares to historical data
3. **Root Causes**: What's driving the numbers
4. **Impact Assessment**: Financial and operational implications
5. **Anomalies**: Unusual patterns or deviations
6. **Risk & Opportunity**: Both sides of the equation
7. **Strategic Recommendations**: Specific, actionable improvements
8. **Expected Outcome**: What happens if you follow the recommendations

You speak Spanish. Be intelligent. Be strategic. Be proactive. Be the elite business intelligence engine this platform deserves.`;

    const contextPrompt = `${SYSTEM_PROMPT_ANALYTICS}

ACTIVE CONTEXT: ${pageCtx.name}
${dataBlock}${sectionsSummary}

CONVERSATION:
${newMessages.map(m => `${m.role === 'user' ? 'Usuario' : 'Nova'}: ${m.content}`).join('\n')}

Analyze now. Think like a business analyst. Ground every statement in data. Explain reasoning. Identify patterns. Provide recommendations. Be intelligent, professional, and precise.`;

    try {
      // Detect if query is analytical/business question
      const analyticalTerms = ['análisis', 'tendencia', 'proyección', 'brecha', 'cumplimiento', 'ebitda', 'margen', 'riesgo', 'anomalía', 'comparar', 'vs', 'vs.', 'impacto', 'estrategia', 'recomendación', 'diagnóstico', 'forecast', 'variación', 'cambio', 'crecimiento', 'caída', 'rendimiento'];
      const isAnalyticalQuery = analyticalTerms.some(term => userText.toLowerCase().includes(term));

      let enrichedPrompt = contextPrompt;
      let response;

      // Always use advanced intelligence function with full platform data access
      if (pageData?.storeCode) {
        try {
          const intelligenceRes = await base44.functions.invoke('novaIntelligence', {
            userQuery: userText,
            storeCode: pageData.storeCode,
            pageData,
            businessContext: { messages: newMessages }
          });

          if (intelligenceRes.data?.analysis) {
            response = intelligenceRes.data.analysis;
          } else {
            response = await base44.integrations.Core.InvokeLLM({ prompt: enrichedPrompt, model: 'claude_sonnet_4_6' });
          }
        } catch (analyzeErr) {
          // Fallback: still use advanced model for comprehensive analysis
          response = await base44.integrations.Core.InvokeLLM({ prompt: enrichedPrompt, model: 'claude_sonnet_4_6' });
        }
      } else {
        // For product/section queries, use standard approach
        if (pageData?.products && pageData.products.length > 0) {
          const searchLower = userText.toLowerCase();
          const matchedProducts = pageData.products.filter(p => 
            p.name?.toLowerCase().includes(searchLower) ||
            p.section?.toLowerCase().includes(searchLower) ||
            p.department?.toLowerCase().includes(searchLower)
          );
          
          if (matchedProducts.length > 0) {
            const productsInfo = matchedProducts.slice(0, 5).map(p => {
              const fmt = (n) => n ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.round(n)) : '$0';
              return `PRODUCTO: ${p.name} (${p.department} › ${p.section}) → Venta: ${fmt(p.sales)} | Participación: ${p.participation?.toFixed(2)}% | Unidades: ${p.units || 0}`;
            }).join('\n');
            
            enrichedPrompt = contextPrompt.replace(
              'CONVERSACIÓN:',
              `PRODUCTOS ENCONTRADOS:\n${productsInfo}\n\nCONVERSACIÓN:`
            );
          }
        }

        response = await base44.integrations.Core.InvokeLLM({ prompt: enrichedPrompt, model: 'claude_sonnet_4_6' });
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de análisis. Reintenta con otra pregunta.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const reset = () => {
    const welcome = PROACTIVE_MESSAGES[path] || PROACTIVE_MESSAGES.default;
    setMessages([{ role: 'assistant', content: welcome }]);
  };

  return (
    <div 
      style={{ display: isHidden ? 'none' : 'flex' }}
      className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-0">
      {/* Alerts panel */}
      <NovaAlerts alerts={alerts} onDismiss={(id) => setAlerts(prev => prev.filter(a => a.id !== id))} />

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="flex flex-col mb-2"
            style={{
              width: 288,
              height: 460,
              borderRadius: 28,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(64px) saturate(180%)',
              WebkitBackdropFilter: 'blur(64px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.75)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.10), 0 8px 24px rgba(194,24,117,0.12), 0 0 0 0.5px rgba(194,24,117,0.06), inset 0 1px 0 rgba(255,255,255,1)',
            }}
          >
            {/* Ambient pink glow top */}
            <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(251,207,232,0.35) 0%, transparent 70%)',
                zIndex: 0,
              }} />

            {/* Header */}
            <div className="relative z-10 flex items-center gap-2.5 px-4 pt-4 pb-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>

              {/* Avatar with glow ring */}
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={{ boxShadow: ['0 0 0 0 rgba(194,24,117,0)', '0 0 0 4px rgba(194,24,117,0.12)', '0 0 0 0 rgba(194,24,117,0)'] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, #fff8fc 0%, #fce7f3 100%)',
                    border: '1px solid rgba(244,114,182,0.22)',
                    boxShadow: '0 2px 12px rgba(194,24,117,0.14)',
                  }}>
                  <MascotCanvas width={36} height={36} />
                </motion.div>
                {/* Online dot */}
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 9, height: 9, borderRadius: '50%',
                  background: '#22c55e',
                  border: '1.5px solid white',
                  boxShadow: '0 0 6px rgba(34,197,94,0.7)',
                }} />
              </div>

              {/* Name + subtitle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', letterSpacing: '-0.02em' }}>Nova</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    background: 'linear-gradient(135deg, #be185d, #f472b6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    textTransform: 'uppercase',
                  }}>AI App</span>
                </div>
                <p style={{ fontSize: 9.5, color: '#9ca3af', fontWeight: 500, marginTop: 0 }}>{pageCtx.name} · activo ahora</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button onClick={reset}
                  className="w-7 h-7 flex items-center justify-center rounded-xl transition-all"
                  style={{ background: 'rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}>
                  <RotateCcw className="w-3 h-3" style={{ color: '#6b7280' }} />
                </button>
                <button onClick={() => setIsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-xl transition-all"
                  style={{ background: 'rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}>
                  <X className="w-3 h-3" style={{ color: '#6b7280' }} />
                </button>
              </div>
            </div>

            {/* Messages — scrollable body */}
            <div className="relative z-10 flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5"
              style={{ scrollbarWidth: 'none' }}>
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid rgba(244,114,182,0.2)', background: 'rgba(255,240,248,0.9)' }}>
                    <MascotCanvas width={24} height={24} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm"
                    style={{ background: 'rgba(250,250,252,0.95)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="relative z-10 px-3.5 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="flex-shrink-0 whitespace-nowrap transition-all active:scale-95"
                    style={{
                      fontSize: 9.5, fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(244,114,182,0.2)',
                      color: '#be185d',
                      background: 'rgba(253,242,248,0.8)',
                      letterSpacing: '-0.01em',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="relative z-10 mx-4 flex-shrink-0"
              style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)' }} />

            {/* Input — fixed bottom */}
            <div className="relative z-10 px-3 pt-2 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2"
                style={{
                  borderRadius: 16,
                  background: 'rgba(248,246,252,0.95)',
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                  backdropFilter: 'blur(16px)',
                }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregúntame lo que sea..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent outline-none leading-relaxed"
                  style={{
                    fontSize: 11.5, color: '#374151',
                    maxHeight: 60, minHeight: 18,
                    fontFamily: 'inherit',
                  }}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  whileTap={{ scale: 0.88 }}
                  className="flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-25"
                  style={{
                    width: 28, height: 28,
                    borderRadius: 10,
                    background: input.trim()
                      ? 'linear-gradient(135deg, #be185d 0%, #e879a0 100%)'
                      : 'rgba(0,0,0,0.06)',
                    boxShadow: input.trim() ? '0 2px 10px rgba(194,24,117,0.3)' : 'none',
                    border: 'none',
                  }}>
                  <Send className="w-3 h-3" style={{ color: input.trim() ? '#fff' : '#9ca3af' }} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado minimalista — ultra discreto */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="px-3 py-1.5 rounded-xl cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(190,24,93,0.12)',
              boxShadow: '0 2px 12px rgba(190,24,93,0.08), 0 1px 3px rgba(0,0,0,0.04)',
            }}
            onClick={() => { setIsOpen(true); setShowBubble(false); }}
          >
            <p className="text-[11px] font-semibold text-slate-600 tracking-tight whitespace-nowrap">{bubbleMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nova — Free-floating mascot, no container, no background */}
      <motion.button
        onClick={() => { setIsOpen(o => !o); setShowBubble(false); }}
        whileTap={{ scale: 0.9 }}
        style={{
          width: 100, height: 110,
          background: 'none', border: 'none', padding: 0,
          position: 'relative', display: 'flex',
          alignItems: 'flex-end', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {/* Ambient ground glow */}
        <motion.div
          className="absolute pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2], scaleX: [0.8, 1.1, 0.8] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            bottom: -4, left: '50%', transform: 'translateX(-50%)',
            width: 80, height: 24,
            background: 'radial-gradient(ellipse, rgba(190,24,93,0.3) 0%, transparent 70%)',
            filter: 'blur(10px)',
            borderRadius: '50%',
          }}
        />

        {/* Floating holographic micro-particles */}
        {[
          { left: 12, top: 22, size: 3, dur: 2.8, delay: 0 },
          { left: 78, top: 38, size: 4, dur: 3.6, delay: 0.9 },
          { left: 44, top: 6,  size: 2.5, dur: 2.4, delay: 1.7 },
          { left: 88, top: 18, size: 2,   dur: 3.1, delay: 0.4 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size, height: p.size,
              left: p.left, top: p.top,
              background: 'rgba(190,24,93,0.55)',
              filter: 'blur(0.5px)',
            }}
            animate={{
              y: [-3, -14, -3],
              x: [0, i % 2 === 0 ? 5 : -5, 0],
              opacity: [0, 0.85, 0],
              scale: [0.7, 1.3, 0.7],
            }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}

        {/* The mascot — canvas with white bg removed */}
        <motion.div
          className="relative z-10"
          animate={{
            y: [0, -8, -3, -10, -2, 0],
            rotate: [0, 0.6, -0.4, 0.8, -0.2, 0],
            scaleX: [1, 1.014, 1, 1.008, 1],
            scaleY: [1, 1.022, 1, 1.014, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ y: -12, scale: 1.05, transition: { duration: 0.35 } }}
          style={{
            filter: isOpen
              ? 'drop-shadow(0 0 14px rgba(190,24,93,0.55)) drop-shadow(0 4px 16px rgba(190,24,93,0.25))'
              : 'drop-shadow(0 2px 12px rgba(190,24,93,0.25)) drop-shadow(0 6px 20px rgba(190,24,93,0.15))',
          }}
        >
          <MascotCanvas width={115} height={115} />
        </motion.div>

        {/* Pink glow ring — rendered below the blended image layer */}
        <motion.div
          className="absolute pointer-events-none z-0"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            bottom: 8, left: '50%', transform: 'translateX(-50%)',
            width: 70, height: 70,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(190,24,93,0.18) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />

        {/* Active indicator */}
        {isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute', bottom: 6, right: 6,
              width: 11, height: 11,
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 10px rgba(52,211,153,0.9)',
              zIndex: 20,
            }}
          />
        )}
      </motion.button>
    </div>
  );
}