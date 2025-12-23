import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, AlertTriangle, Info, Lock, Eye, EyeOff,
  TrendingUp, Users, Award, Home, Settings, Search,
  Download, Bell, Calendar, Heart, Star, Zap
} from 'lucide-react';

export default function DesignSystemGuide() {
  const [selectedSection, setSelectedSection] = useState('colors');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sections = [
    { id: 'colors', name: 'Colores', icon: '🎨' },
    { id: 'typography', name: 'Tipografía', icon: '📝' },
    { id: 'buttons', name: 'Botones', icon: '🔘' },
    { id: 'inputs', name: 'Inputs', icon: '📝' },
    { id: 'cards', name: 'Cards', icon: '📇' },
    { id: 'badges', name: 'Badges', icon: '🏷️' },
    { id: 'states', name: 'Estados', icon: '⚡' },
    { id: 'icons', name: 'Iconos', icon: '✨' },
    { id: 'spacing', name: 'Espaciado', icon: '📏' },
    { id: 'accessibility', name: 'Accesibilidad', icon: '♿' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
            Popsy Management
          </h1>
          <p className="text-xl text-gray-600">Design System v1.0</p>
          <p className="text-sm text-gray-500 mt-1">
            Sistema de diseño completo para aplicación SaaS de gestión empresarial retail
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-4 sticky top-6">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Secciones</h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedSection === section.id
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                        : 'text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Colores */}
            {selectedSection === 'colors' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Paleta de Colores">
                  <div className="space-y-6">
                    {/* Primarios */}
                    <ColorGroup
                      title="Primarios (Pink/Rose)"
                      colors={[
                        { name: 'pink-50', hex: '#fdf2f8', class: 'bg-pink-50' },
                        { name: 'pink-100', hex: '#fce7f3', class: 'bg-pink-100' },
                        { name: 'pink-500', hex: '#ec4899', class: 'bg-pink-500' },
                        { name: 'pink-600', hex: '#db2777', class: 'bg-pink-600' },
                        { name: 'rose-500', hex: '#f43f5e', class: 'bg-rose-500' }
                      ]}
                    />

                    {/* Secundarios */}
                    <ColorGroup
                      title="Secundarios (Violet/Purple)"
                      colors={[
                        { name: 'violet-500', hex: '#8b5cf6', class: 'bg-violet-500' },
                        { name: 'violet-600', hex: '#7c3aed', class: 'bg-violet-600' },
                        { name: 'purple-500', hex: '#a855f7', class: 'bg-purple-500' }
                      ]}
                    />

                    {/* Especiales */}
                    <ColorGroup
                      title="Especiales (Amber)"
                      colors={[
                        { name: 'amber-400', hex: '#fbbf24', class: 'bg-amber-400' },
                        { name: 'amber-500', hex: '#f59e0b', class: 'bg-amber-500' }
                      ]}
                    />

                    {/* Estados */}
                    <ColorGroup
                      title="Estados"
                      colors={[
                        { name: 'emerald-500 (Success)', hex: '#10b981', class: 'bg-emerald-500' },
                        { name: 'red-500 (Error)', hex: '#ef4444', class: 'bg-red-500' },
                        { name: 'amber-500 (Warning)', hex: '#f59e0b', class: 'bg-amber-500' },
                        { name: 'blue-500 (Info)', hex: '#3b82f6', class: 'bg-blue-500' }
                      ]}
                    />

                    {/* Gradientes */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Gradientes Principales</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="h-20 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-semibold text-sm">
                          from-pink-500 to-rose-500
                        </div>
                        <div className="h-20 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          from-violet-500 to-purple-500
                        </div>
                        <div className="h-20 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center text-white font-semibold text-sm">
                          from-amber-400 to-yellow-500
                        </div>
                        <div className="h-20 rounded-lg bg-gradient-to-br from-pink-50/80 via-purple-50/60 to-amber-50/80 border border-pink-100 flex items-center justify-center text-gray-700 font-semibold text-sm">
                          Background Sutil
                        </div>
                      </div>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Tipografía */}
            {selectedSection === 'typography' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Jerarquía Tipográfica">
                  <div className="space-y-6">
                    <div className="border-l-4 border-pink-500 pl-4">
                      <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-1">
                        H1 - Título Principal
                      </h1>
                      <code className="text-xs text-gray-500">text-4xl md:text-5xl font-black</code>
                    </div>

                    <div className="border-l-4 border-pink-400 pl-4">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        H2 - Sección Principal
                      </h2>
                      <code className="text-xs text-gray-500">text-2xl md:text-3xl font-bold</code>
                    </div>

                    <div className="border-l-4 border-pink-300 pl-4">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                        H3 - Subsección
                      </h3>
                      <code className="text-xs text-gray-500">text-xl md:text-2xl font-bold</code>
                    </div>

                    <div className="border-l-4 border-pink-200 pl-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        H4 - Card Title
                      </h4>
                      <code className="text-xs text-gray-500">text-lg font-semibold</code>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-base text-gray-700 leading-relaxed">
                        Párrafo principal: text-base text-gray-700 leading-relaxed
                      </p>
                      <p className="text-sm text-gray-600">
                        Párrafo secundario: text-sm text-gray-600
                      </p>
                      <p className="text-xs text-gray-500">
                        Helper text: text-xs text-gray-500
                      </p>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Botones */}
            {selectedSection === 'buttons' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Botones">
                  <div className="space-y-4">
                    <ButtonExample
                      title="Primary Button"
                      description="Acción principal, máxima jerarquía"
                    >
                      <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                        Acción Principal
                      </Button>
                    </ButtonExample>

                    <ButtonExample
                      title="Secondary Button"
                      description="Acción secundaria importante"
                    >
                      <Button className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                        Acción Secundaria
                      </Button>
                    </ButtonExample>

                    <ButtonExample
                      title="Ghost Button"
                      description="Acción terciaria, menos énfasis"
                    >
                      <Button variant="ghost" className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 transition-colors duration-200">
                        Acción Terciaria
                      </Button>
                    </ButtonExample>

                    <ButtonExample
                      title="Outline Button"
                      description="Acción alternativa"
                    >
                      <Button variant="outline" className="border-pink-200 hover:border-pink-400 text-pink-700 hover:bg-pink-50 transition-all duration-200">
                        Acción Alternativa
                      </Button>
                    </ButtonExample>

                    <ButtonExample
                      title="Loading State"
                      description="Estado de carga con spinner"
                    >
                      <Button
                        disabled
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white opacity-50"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Procesando...
                      </Button>
                    </ButtonExample>

                    <ButtonExample
                      title="Disabled State"
                      description="Estado deshabilitado"
                    >
                      <Button disabled className="bg-gradient-to-r from-pink-500 to-rose-500 text-white opacity-50 cursor-not-allowed">
                        Deshabilitado
                      </Button>
                    </ButtonExample>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Inputs */}
            {selectedSection === 'inputs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Inputs y Formularios">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="example-input" className="block text-sm font-semibold text-gray-700 mb-2">
                        Input Estándar
                      </label>
                      <Input
                        id="example-input"
                        type="text"
                        placeholder="Ingresa información"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="password-input" className="block text-sm font-semibold text-gray-700 mb-2">
                        Password Input
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="password-input"
                          type={showPassword ? "text" : "password"}
                          placeholder="Tu contraseña"
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="error-input" className="block text-sm font-semibold text-gray-700 mb-2">
                        Input con Error
                      </label>
                      <Input
                        id="error-input"
                        type="text"
                        placeholder="Campo inválido"
                        className="w-full border-red-300 focus:ring-red-500"
                        aria-invalid="true"
                      />
                      <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Este campo es obligatorio
                      </p>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Cards */}
            {selectedSection === 'cards' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Cards">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Standard Card */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 p-6"
                    >
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Standard Card</h4>
                      <p className="text-sm text-gray-600">
                        Card estándar con hover effect
                      </p>
                    </motion.div>

                    {/* Gradient Card */}
                    <div className="bg-gradient-to-br from-pink-100/90 to-rose-100/80 backdrop-blur-sm rounded-2xl border border-pink-200/50 shadow-lg p-6">
                      <h4 className="text-lg font-semibold text-pink-900 mb-2">Gradient Card</h4>
                      <p className="text-sm text-pink-700">
                        Card destacado con gradiente
                      </p>
                    </div>

                    {/* Metric Card */}
                    <div className="bg-gradient-to-br from-slate-100/90 to-gray-100/80 rounded-2xl border border-white/50 backdrop-blur-sm p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200/60 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 text-sm">Ventas</h4>
                          <p className="text-2xl font-black text-slate-900">$45K</p>
                        </div>
                      </div>
                    </div>

                    {/* Violet Card */}
                    <div className="bg-gradient-to-br from-violet-100/90 to-purple-100/80 rounded-2xl border border-violet-200/50 shadow-md p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-violet-200/60 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-violet-700 text-sm">Equipo</h4>
                          <p className="text-2xl font-black text-violet-900">28</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Badges */}
            {selectedSection === 'badges' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Badges y Tags">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Estados</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          Activo
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          Pendiente
                        </Badge>
                        <Badge className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          Inactivo
                        </Badge>
                        <Badge className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          Recomendado
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Con Iconos</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="flex items-center gap-1 border-pink-200 text-pink-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                          <TrendingUp className="w-3 h-3" />
                          +12%
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Completado
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 border-violet-200 text-violet-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                          <Star className="w-3 h-3" />
                          Destacado
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Estados */}
            {selectedSection === 'states' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Estados y Feedback">
                  <div className="space-y-4">
                    {/* Success */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle className="w-5 h-5" />
                        <p className="font-medium">Operación exitosa</p>
                      </div>
                    </motion.div>

                    {/* Error */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="font-medium">Error en la operación</p>
                      </div>
                    </motion.div>

                    {/* Warning */}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Advertencia importante
                      </p>
                    </div>

                    {/* Info */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Información adicional
                      </p>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Iconos */}
            {selectedSection === 'icons' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Iconografía">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Tamaños</h4>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <Home className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                          <code className="text-xs text-gray-500">w-4 h-4</code>
                        </div>
                        <div className="text-center">
                          <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                          <code className="text-xs text-gray-500">w-5 h-5</code>
                        </div>
                        <div className="text-center">
                          <Award className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                          <code className="text-xs text-gray-500">w-6 h-6</code>
                        </div>
                        <div className="text-center">
                          <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-1" />
                          <code className="text-xs text-gray-500">w-10 h-10</code>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Color Coding</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Success</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Error</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <Info className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Info</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <Heart className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Primary</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Iconos Comunes</h4>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                        {[Home, Users, Award, TrendingUp, Settings, Search, Download, Bell, Calendar, Heart, Star, Zap].map((Icon, i) => (
                          <div key={i} className="flex items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-pink-50 transition-colors">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Espaciado */}
            {selectedSection === 'spacing' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Sistema de Espaciado">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Escala de Espaciado</h4>
                      <div className="space-y-2">
                        {[
                          { size: 'gap-1', value: '4px', desc: 'Elementos muy juntos' },
                          { size: 'gap-2', value: '8px', desc: 'Elementos relacionados' },
                          { size: 'gap-3', value: '12px', desc: 'Separación estándar' },
                          { size: 'gap-4', value: '16px', desc: 'Separación clara' },
                          { size: 'gap-6', value: '24px', desc: 'Secciones' },
                          { size: 'gap-8', value: '32px', desc: 'Bloques grandes' }
                        ].map((item) => (
                          <div key={item.size} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-8 bg-pink-500 rounded" style={{ width: item.value }} />
                            </div>
                            <div className="flex-1">
                              <code className="text-xs font-bold text-pink-600">{item.size}</code>
                              <p className="text-xs text-gray-600">{item.value} - {item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Accesibilidad */}
            {selectedSection === 'accessibility' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Section title="Accesibilidad">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Estándar WCAG AAA
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>✓ Contraste mínimo 4.5:1 para texto</li>
                        <li>✓ Contraste mínimo 3:1 para UI</li>
                        <li>✓ Focus visible en todos los elementos interactivos</li>
                        <li>✓ Navegación completa por teclado</li>
                        <li>✓ ARIA labels y roles correctos</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Ejemplo: Focus States</h4>
                      <div className="flex flex-wrap gap-3">
                        <Button className="bg-gradient-to-r from-pink-500 to-rose-500 focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2">
                          Tab para ver focus
                        </Button>
                        <Input
                          placeholder="Focus en input"
                          className="focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <h4 className="font-bold text-emerald-900 mb-2">✓ Buenas Prácticas</h4>
                      <ul className="text-sm text-emerald-800 space-y-1">
                        <li>• Usar labels descriptivos en todos los inputs</li>
                        <li>• Incluir alt text en imágenes</li>
                        <li>• No usar solo color para transmitir información</li>
                        <li>• Proporcionar feedback visual y textual</li>
                        <li>• Mantener orden lógico de tab</li>
                      </ul>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ColorGroup({ title, colors }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-gray-900 mb-3">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {colors.map((color) => (
          <div key={color.name} className="space-y-2">
            <div className={`${color.class} h-16 rounded-lg shadow-md border border-gray-200`} />
            <div>
              <p className="text-xs font-semibold text-gray-900">{color.name}</p>
              <p className="text-[10px] text-gray-500">{color.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ButtonExample({ title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}