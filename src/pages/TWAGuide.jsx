import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Code, CheckCircle, AlertTriangle, Terminal, Globe, Shield, Download } from 'lucide-react';

export default function TWAGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="w-10 h-10 text-blue-500" />
            <div>
              <h1 className="text-3xl font-black text-slate-800">Guía TWA para Google Play</h1>
              <p className="text-slate-600">Popsy Management - Configuración Completa</p>
            </div>
          </div>

          <div className="space-y-8 text-slate-700">

            {/* Introducción */}
            <section className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                ¿Qué es TWA?
              </h2>
              <p className="leading-relaxed mb-3">
                <strong>Trusted Web Activity (TWA)</strong> es una tecnología de Google que permite empaquetar tu PWA como una app nativa de Android (.AAB) sin reescribir código.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>✅ Usa tu PWA existente (no requiere React Native)</li>
                <li>✅ Publicable en Google Play</li>
                <li>✅ Experiencia nativa (sin barra de navegador)</li>
                <li>✅ Acceso a funcionalidades Android</li>
              </ul>
            </section>

            {/* Requisitos Previos */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                1. Requisitos Previos
              </h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="font-bold text-green-900 mb-2">✅ Verificaciones:</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Dominio HTTPS:</strong> Tu PWA debe estar en https://tudominio.com</li>
                    <li>• <strong>PWA funcional:</strong> Debe instalarse correctamente como PWA</li>
                    <li>• <strong>manifest.json:</strong> Configurado con todos los campos</li>
                    <li>• <strong>Service Worker:</strong> Registrado y funcionando</li>
                    <li>• <strong>Google Play Console:</strong> Cuenta activa como desarrollador ($25 USD one-time)</li>
                  </ul>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h3 className="font-bold text-amber-900 mb-2">⚠️ Importante:</h3>
                  <p className="text-sm">
                    Tu PWA debe estar alojada en un dominio que controles. No funciona con subdominios de terceros sin configuración adicional.
                  </p>
                </div>
              </div>
            </section>

            {/* Herramientas */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Terminal className="w-6 h-6 text-purple-500" />
                2. Herramientas Recomendadas
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Opción 1: PWA Builder (Recomendado)
                  </h3>
                  <p className="text-sm mb-3">✅ Más fácil, con interfaz gráfica</p>
                  <ul className="space-y-1 text-sm">
                    <li>• URL: <code className="bg-purple-100 px-2 py-1 rounded">pwabuilder.com</code></li>
                    <li>• No requiere Node.js</li>
                    <li>• Genera AAB automáticamente</li>
                    <li>• Incluye iconos y configuración</li>
                  </ul>
                </div>

                <div className="bg-slate-100 rounded-xl p-5 border border-slate-300">
                  <h3 className="font-bold text-slate-900 mb-2">Opción 2: Bubblewrap CLI</h3>
                  <p className="text-sm mb-3">⚙️ Más técnico, para desarrolladores</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Requiere Node.js y Android SDK</li>
                    <li>• Mayor control de configuración</li>
                    <li>• Ideal para CI/CD</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Paso a Paso PWA Builder */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Download className="w-6 h-6 text-blue-500" />
                3. Método Recomendado: PWA Builder
              </h2>

              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-3">Pasos:</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                      <div>
                        <strong>Ir a PWA Builder:</strong>
                        <code className="block bg-white px-3 py-2 rounded mt-1 text-xs">https://www.pwabuilder.com</code>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                      <div>
                        <strong>Ingresar URL de tu PWA:</strong>
                        <p className="text-slate-600 mt-1">Ejemplo: https://popsy-management.tudominio.com</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                      <div>
                        <strong>Analizar la PWA:</strong>
                        <p className="text-slate-600 mt-1">PWA Builder validará tu manifest y Service Worker</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
                      <div>
                        <strong>Seleccionar "Android Package"</strong>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 flex-shrink-0">5.</span>
                      <div>
                        <strong>Configurar opciones:</strong>
                        <ul className="mt-2 space-y-1 pl-4">
                          <li>• Package ID: com.popsy.management</li>
                          <li>• App Name: Popsy Management</li>
                          <li>• Host: tudominio.com</li>
                          <li>• Start URL: /</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 flex-shrink-0">6.</span>
                      <div>
                        <strong>Generar certificado:</strong>
                        <p className="text-slate-600 mt-1">PWA Builder genera un keystore automáticamente</p>
                        <div className="bg-amber-50 p-3 rounded mt-2 text-xs">
                          ⚠️ <strong>IMPORTANTE:</strong> Guarda el archivo .keystore y la contraseña. Los necesitarás para futuras actualizaciones.
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-600 flex-shrink-0">7.</span>
                      <div>
                        <strong>Descargar el proyecto Android</strong>
                        <p className="text-slate-600 mt-1">Incluye el AAB firmado listo para subir</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="font-bold text-green-900 mb-2">✅ Resultado:</h3>
                  <p className="text-sm">
                    Recibirás un archivo <code className="bg-white px-2 py-1 rounded">.AAB</code> listo para subir a Google Play Console
                  </p>
                </div>
              </div>
            </section>

            {/* Configuración assetlinks.json */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-500" />
                4. Configurar assetlinks.json (CRÍTICO)
              </h2>

              <div className="space-y-4">
                <p className="leading-relaxed">
                  Este archivo es <strong>obligatorio</strong> para que Google verifique que tu dominio y la app están vinculados.
                </p>

                <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                  <h3 className="font-bold text-red-900 mb-3">📍 Ubicación del archivo:</h3>
                  <code className="block bg-white px-4 py-3 rounded text-sm">
                    https://tudominio.com/.well-known/assetlinks.json
                  </code>
                  <p className="text-xs text-red-700 mt-2">
                    ⚠️ Debe estar en la raíz del dominio, accesible públicamente vía HTTPS
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-3">📄 Contenido del archivo:</h3>
                  <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
{`[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.popsy.management",
    "sha256_cert_fingerprints": [
      "TU_SHA256_FINGERPRINT_AQUI"
    ]
  }
}]`}
                  </pre>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h3 className="font-bold text-amber-900 mb-2">🔑 Obtener SHA256 Fingerprint:</h3>
                  <p className="text-sm mb-3">Ejecuta este comando en la carpeta de tu proyecto Android generado:</p>
                  <code className="block bg-slate-900 text-green-400 px-4 py-3 rounded text-xs">
                    keytool -list -v -keystore android.keystore
                  </code>
                  <p className="text-xs text-amber-700 mt-2">
                    Copia el SHA256 (sin ":" entre caracteres) y reemplázalo en assetlinks.json
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-2">✅ Validar assetlinks.json:</h3>
                  <p className="text-sm mb-2">Verifica que el archivo sea accesible:</p>
                  <code className="block bg-white px-3 py-2 rounded text-xs mb-2">
                    curl https://tudominio.com/.well-known/assetlinks.json
                  </code>
                  <p className="text-xs text-blue-700">También puedes abrirlo en el navegador para verificar.</p>
                </div>
              </div>
            </section>

            {/* Manifest.json */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Code className="w-6 h-6 text-indigo-500" />
                5. Optimizar manifest.json para TWA
              </h2>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">📄 Campos obligatorios:</h3>
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "name": "Popsy Management",
  "short_name": "Popsy",
  "description": "App interna para gestión operativa",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#ec4899",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}`}
                </pre>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mt-4">
                <h3 className="font-bold text-amber-900 mb-2">🎨 Requisitos de Iconos:</h3>
                <ul className="text-sm space-y-1">
                  <li>• <strong>192x192px:</strong> Ícono principal</li>
                  <li>• <strong>512x512px:</strong> Splash screen</li>
                  <li>• Formato PNG con fondo sólido</li>
                  <li>• Purpose: "any maskable" (compatible con Android Adaptive Icons)</li>
                </ul>
              </div>
            </section>

            {/* Subir a Google Play */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-green-500" />
                6. Subir a Google Play Console
              </h2>

              <div className="space-y-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600 flex-shrink-0">1.</span>
                    <div>
                      <strong>Crear app en Play Console:</strong>
                      <p className="text-slate-600 mt-1">play.google.com/console → Crear aplicación</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600 flex-shrink-0">2.</span>
                    <div>
                      <strong>Configurar tipo:</strong>
                      <p className="text-slate-600 mt-1">Seleccionar "App interna" o "App privada"</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600 flex-shrink-0">3.</span>
                    <div>
                      <strong>Subir AAB:</strong>
                      <p className="text-slate-600 mt-1">Producción → Versión → Crear nueva versión → Subir .aab</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600 flex-shrink-0">4.</span>
                    <div>
                      <strong>Completar ficha de la tienda:</strong>
                      <ul className="mt-2 space-y-1 pl-4 text-slate-600">
                        <li>• Título: "Popsy Management"</li>
                        <li>• Descripción corta y completa</li>
                        <li>• 2-8 capturas de pantalla (1080x1920)</li>
                        <li>• Ícono de alta resolución (512x512)</li>
                        <li>• Gráfico de funciones (1024x500)</li>
                        <li>• Política de privacidad (URL pública)</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600 flex-shrink-0">5.</span>
                    <div>
                      <strong>Configurar distribución privada:</strong>
                      <p className="text-slate-600 mt-1">Managed Google Play → Agregar emails autorizados</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-green-600 flex-shrink-0">6.</span>
                    <div>
                      <strong>Enviar a revisión</strong>
                      <p className="text-slate-600 mt-1">Tiempo de aprobación: 1-3 días</p>
                    </div>
                  </li>
                </ol>
              </div>
            </section>

            {/* Troubleshooting */}
            <section className="bg-red-50 rounded-2xl p-6 border border-red-200">
              <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Errores Comunes y Soluciones
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-bold text-red-800">❌ "App not verified":</p>
                  <p className="text-red-700">→ assetlinks.json no accesible o SHA256 incorrecto</p>
                </div>
                <div>
                  <p className="font-bold text-red-800">❌ "Manifest not found":</p>
                  <p className="text-red-700">→ Verifica que /manifest.json esté en la raíz del dominio</p>
                </div>
                <div>
                  <p className="font-bold text-red-800">❌ "Service Worker error":</p>
                  <p className="text-red-700">→ Asegúrate que tu PWA tenga Service Worker registrado</p>
                </div>
                <div>
                  <p className="font-bold text-red-800">❌ "Invalid package name":</p>
                  <p className="text-red-700">→ Debe seguir formato: com.empresa.app (sin guiones ni espacios)</p>
                </div>
              </div>
            </section>

            {/* Checklist Final */}
            <section className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Checklist Final antes de Publicar
              </h2>

              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>PWA funcional en HTTPS</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>manifest.json completo y accesible</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>assetlinks.json configurado y accesible</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>SHA256 fingerprint correcto</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>AAB generado y firmado</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>Política de privacidad publicada en URL</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>Capturas de pantalla (2-8)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>Ícono 512x512 de alta calidad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>App configurada como privada en Play Console</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>Keystore guardado en lugar seguro</span>
                </label>
              </div>
            </section>

            {/* Recursos */}
            <section className="bg-slate-100 rounded-2xl p-6 border border-slate-300">
              <h2 className="text-xl font-bold text-slate-900 mb-4">📚 Recursos Útiles</h2>
              <ul className="space-y-2 text-sm">
                <li>• PWA Builder: <a href="https://www.pwabuilder.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">pwabuilder.com</a></li>
                <li>• Bubblewrap: <a href="https://github.com/GoogleChromeLabs/bubblewrap" target="_blank" rel="noopener" className="text-blue-600 hover:underline">github.com/GoogleChromeLabs/bubblewrap</a></li>
                <li>• Google Play Console: <a href="https://play.google.com/console" target="_blank" rel="noopener" className="text-blue-600 hover:underline">play.google.com/console</a></li>
                <li>• Asset Links Tool: <a href="https://developers.google.com/digital-asset-links/tools/generator" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Asset Links Generator</a></li>
              </ul>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}