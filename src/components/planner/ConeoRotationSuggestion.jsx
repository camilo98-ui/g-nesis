import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Clock, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * Componente que sugiere rotación de coneadores
 * Monitorea cuántos turnos de coneo ha tenido cada colaborador
 * Alerta cuando alguien tiene demasiados turnos de coneo (cuidar las manos)
 */
export default function ConeoRotationSuggestion({ shifts = [], cashiers = [] }) {
  const [showChart, setShowChart] = useState(true);
  const coneoStats = useMemo(() => {
    // Contar turnos de coneo por colaborador
    const coneoCount = {};
    const totalShiftsByPerson = {};
    
    shifts.forEach(shift => {
      if (!totalShiftsByPerson[shift.cashier_id]) {
        totalShiftsByPerson[shift.cashier_id] = 0;
      }
      totalShiftsByPerson[shift.cashier_id]++;
      
      if (shift.role === 'coneo') {
        coneoCount[shift.cashier_id] = (coneoCount[shift.cashier_id] || 0) + 1;
      }
    });
    
    // Mapear a info completa
    const data = cashiers.map(c => {
      const coneoShifts = coneoCount[c.id] || 0;
      const totalShifts = totalShiftsByPerson[c.id] || 0;
      const coneoPercentage = totalShifts > 0 ? (coneoShifts / totalShifts) * 100 : 0;
      
      return {
        id: c.id,
        name: c.name?.split(' ')[0] || 'N/A',
        fullName: c.name,
        coneoShifts,
        totalShifts,
        coneoPercentage,
        needsBreak: coneoShifts >= 3, // Alerta si tiene 3+ turnos de coneo
        isOverloaded: coneoShifts >= 5 // Crítico si tiene 5+ turnos
      };
    }).filter(d => d.coneoShifts > 0).sort((a, b) => b.coneoShifts - a.coneoShifts);
    
    return data;
  }, [shifts, cashiers]);

  const maxConeo = Math.max(...coneoStats.map(c => c.coneoShifts), 1);
  const alertCount = coneoStats.filter(c => c.needsBreak).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
    >
      <Card className="bg-white border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-pink-50 to-rose-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <svg viewBox="0 0 40 65" className="w-8 h-12">
                    <circle cx="20" cy="14" r="12" fill="#6B3410" />
                    <ellipse cx="16" cy="10" rx="5" ry="3" fill="white" opacity="0.3" />
                    <polygon points="10,22 20,58 30,22" fill="#E8D5B0" />
                    <line x1="13" y1="28" x2="27" y2="28" stroke="#d97706" strokeWidth="0.5" opacity="0.7" />
                    <line x1="15" y1="36" x2="25" y2="36" stroke="#d97706" strokeWidth="0.5" opacity="0.7" />
                  </svg>
                </motion.div>
                Rotación de Coneadores
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">Monitoreo de salud ocupacional</p>
            </div>
            <div className="flex items-center gap-2">
              {alertCount > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Badge className="bg-red-500 text-white gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {alertCount} alerta{alertCount > 1 ? 's' : ''}
                  </Badge>
                </motion.div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChart(!showChart)}
                className="text-xs font-medium"
              >
                {showChart ? '📊 Ver Resumen' : '📈 Ver Gráfica'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Explicación */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200"
          >
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong className="font-bold">⚠️ Importante:</strong> El coneo es físicamente demandante para las manos. 
              Se recomienda <strong>rotar a los colaboradores</strong> para evitar lesiones por movimiento repetitivo. 
              Máximo recomendado: <strong>3 turnos de coneo por semana</strong>.
            </p>
          </motion.div>

          {/* Vista condicional: Gráfica o Resumen */}
          <AnimatePresence mode="wait">
            {showChart ? (
              <motion.div 
                key="chart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-72 mb-4"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coneoStats.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Turnos de Coneo', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#475569' }} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-4 rounded-2xl shadow-2xl border-2 border-pink-100"
                          >
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                              <div className="text-3xl">
                                <svg viewBox="0 0 40 65" className="w-10 h-14">
                                  <circle cx="20" cy="14" r="12" fill="#6B3410" />
                                  <polygon points="10,22 20,58 30,22" fill="#E8D5B0" />
                                  <line x1="13" y1="28" x2="27" y2="28" stroke="#d97706" strokeWidth="0.5" opacity="0.7" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-black text-gray-800 text-base">{data.fullName}</p>
                                <p className="text-xs text-gray-500">Análisis de rotación</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">🍫 Turnos coneo:</span>
                                <span className="text-base font-black text-pink-600">{data.coneoShifts}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">📊 Total turnos:</span>
                                <span className="text-sm font-bold text-gray-700">{data.totalShifts}</span>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-sm text-gray-600">% Coneo:</span>
                                <span className="text-base font-black text-violet-600">{Math.round(data.coneoPercentage)}%</span>
                              </div>
                            </div>
                            {data.isOverloaded && (
                              <div className="mt-3 pt-3 border-t border-red-200 bg-red-50 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
                                <p className="text-red-700 font-bold text-xs flex items-center gap-1">
                                  <AlertTriangle className="w-4 h-4" />
                                  ⚠️ Sobrecarga crítica - rotar urgente
                                </p>
                              </div>
                            )}
                            {data.needsBreak && !data.isOverloaded && (
                              <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
                                <p className="text-amber-700 font-bold text-xs flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  ⚡ Necesita rotación pronto
                                </p>
                              </div>
                            )}
                          </motion.div>
                        );
                      }}
                    />
                    <Bar dataKey="coneoShifts" radius={[0, 10, 10, 0]} barSize={24}>
                      {coneoStats.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.isOverloaded ? '#ef4444' : 
                            entry.needsBreak ? '#f59e0b' : 
                            '#ec4899'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -3 }}
                    className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl p-4 text-center border-2 border-pink-200"
                  >
                    <p className="text-2xl mb-1">🍫</p>
                    <p className="text-2xl font-black text-pink-700">{coneoStats.reduce((sum, c) => sum + c.coneoShifts, 0)}</p>
                    <p className="text-xs text-pink-600 font-medium">Turnos Coneo</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -3 }}
                    className="bg-gradient-to-br from-red-100 to-rose-100 rounded-xl p-4 text-center border-2 border-red-200"
                  >
                    <p className="text-2xl mb-1">🚨</p>
                    <p className="text-2xl font-black text-red-700">{coneoStats.filter(c => c.isOverloaded).length}</p>
                    <p className="text-xs text-red-600 font-medium">Sobrecargados</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -3 }}
                    className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl p-4 text-center border-2 border-amber-200"
                  >
                    <p className="text-2xl mb-1">⚡</p>
                    <p className="text-2xl font-black text-amber-700">{coneoStats.filter(c => c.needsBreak && !c.isOverloaded).length}</p>
                    <p className="text-xs text-amber-600 font-medium">En Riesgo</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -3 }}
                    className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-4 text-center border-2 border-green-200"
                  >
                    <p className="text-2xl mb-1">✅</p>
                    <p className="text-2xl font-black text-green-700">{coneoStats.filter(c => !c.needsBreak).length}</p>
                    <p className="text-xs text-green-600 font-medium">Saludables</p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resumen y recomendaciones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {coneoStats.slice(0, 3).map((person, idx) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className={`p-3 rounded-xl border-2 ${
                  person.isOverloaded 
                    ? 'bg-red-50 border-red-200' 
                    : person.needsBreak 
                      ? 'bg-amber-50 border-amber-200' 
                      : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {person.isOverloaded ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : person.needsBreak ? (
                    <Clock className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Award className="w-4 h-4 text-green-500" />
                  )}
                  <span className="font-bold text-sm text-gray-800 truncate">{person.fullName}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Turnos coneo:</span>
                    <span className={`font-bold ${
                      person.isOverloaded ? 'text-red-600' : 
                      person.needsBreak ? 'text-amber-600' : 
                      'text-green-600'
                    }`}>
                      {person.coneoShifts}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">% del total:</span>
                    <span className="font-bold text-gray-700">{person.coneoPercentage.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className={`text-[10px] font-medium ${
                    person.isOverloaded ? 'text-red-700' : 
                    person.needsBreak ? 'text-amber-700' : 
                    'text-green-700'
                  }`}>
                    {person.isOverloaded 
                      ? '🚨 Rotar urgente - riesgo de lesión' 
                      : person.needsBreak 
                        ? '💡 Considera rotarlo pronto' 
                        : '✅ Balance saludable'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Resumen general */}
          {coneoStats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200"
            >
              <p className="text-xs text-pink-800">
                <strong>💡 Tip de gestión:</strong> Alterna roles entre caja, coneo, bebidas y otras estaciones para mantener 
                a tu equipo saludable y versátil. Un colaborador cansado rinde menos y puede lesionarse.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}