import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-10 h-10 text-pink-500" />
            <div>
              <h1 className="text-3xl font-black text-slate-800">Política de Privacidad</h1>
              <p className="text-slate-600">Popsy Management - App de Uso Interno</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-700">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800">1. Naturaleza de la Aplicación</h2>
              </div>
              <p className="leading-relaxed">
                Popsy Management es una aplicación de uso exclusivo interno y empresarial, diseñada para la gestión operativa de las tiendas Popsy Helado Gourmet. Esta app está destinada únicamente a colaboradores autorizados de la empresa y no es de acceso público.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800">2. Datos Recopilados</h2>
              </div>
              <p className="leading-relaxed mb-3">La aplicación recopila y procesa los siguientes tipos de datos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Credenciales de acceso:</strong> Email corporativo y contraseñas encriptadas para autenticación.</li>
                <li><strong>Datos operativos:</strong> Ventas, tickets, transacciones, inventarios, turnos y registros de cajas.</li>
                <li><strong>Métricas de rendimiento:</strong> KPIs, cumplimiento de presupuestos, estadísticas de colaboradores.</li>
                <li><strong>Datos de experiencia del cliente:</strong> Encuestas NPS, comentarios y calificaciones de servicio.</li>
                <li><strong>Información de usuario:</strong> Nombre completo, tienda asignada, rol y foto de perfil (opcional).</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800">3. Uso de los Datos</h2>
              </div>
              <p className="leading-relaxed mb-3">Los datos recopilados se utilizan exclusivamente para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Gestión y supervisión de operaciones comerciales internas.</li>
                <li>Generación de reportes ejecutivos y análisis de rendimiento.</li>
                <li>Control de inventarios, presupuestos y ventas por tienda.</li>
                <li>Medición de experiencia del cliente y desempeño del equipo.</li>
                <li>Programación de turnos y gestión de personal.</li>
                <li>Mejora continua de procesos operativos.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800">4. Compartición de Datos</h2>
              </div>
              <p className="leading-relaxed">
                <strong>No compartimos datos con terceros.</strong> Toda la información recopilada permanece dentro del ecosistema empresarial de Popsy Helado Gourmet. Los datos son almacenados de forma segura en infraestructura de Base44 (plataforma backend) con encriptación y protección contra accesos no autorizados.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800">5. Seguridad y Confidencialidad</h2>
              </div>
              <p className="leading-relaxed mb-3">Implementamos las siguientes medidas de seguridad:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Autenticación obligatoria mediante credenciales corporativas.</li>
                <li>Encriptación de contraseñas y datos sensibles.</li>
                <li>Acceso restringido basado en roles (admin, gerente, líder, embajador).</li>
                <li>Conexiones seguras mediante HTTPS.</li>
                <li>Respaldos automáticos de información crítica.</li>
                <li>Monitoreo de accesos y auditoría de cambios.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800">6. Retención de Datos</h2>
              </div>
              <p className="leading-relaxed">
                Los datos operativos se conservan mientras sean necesarios para fines empresariales y de análisis histórico. Los datos de usuarios que dejen de ser colaboradores activos pueden ser archivados o eliminados según las políticas internas de recursos humanos.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800">7. Derechos del Usuario</h2>
              </div>
              <p className="leading-relaxed mb-3">Los colaboradores tienen derecho a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acceder a sus datos personales almacenados.</li>
                <li>Solicitar corrección de información incorrecta.</li>
                <li>Solicitar la eliminación de datos personales (sujeto a políticas laborales).</li>
                <li>Recibir soporte técnico y resolver dudas sobre privacidad.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800">8. Cumplimiento Legal</h2>
              </div>
              <p className="leading-relaxed">
                Esta aplicación cumple con la legislación colombiana de protección de datos personales (Ley 1581 de 2012) y con las políticas de Google Play para aplicaciones empresariales privadas. Al ser una app de uso interno, no está sujeta a registro público ni es accesible para usuarios externos.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-800">9. Contacto</h2>
              </div>
              <p className="leading-relaxed mb-3">
                Para consultas, solicitudes o reportes relacionados con privacidad y protección de datos, puedes contactarnos en:
              </p>
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-200">
                <p className="font-bold text-slate-800 mb-2">Popsy Helado Gourmet</p>
                <p className="text-slate-700 mb-1">Email: <a href="mailto:soporte@popsy.com.co" className="text-pink-600 hover:underline">soporte@popsy.com.co</a></p>
                <p className="text-slate-700">Bogotá, Colombia</p>
              </div>
            </section>

            <section className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 italic">
                Última actualización: Diciembre 2024
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Esta política puede ser actualizada periódicamente. Los cambios serán comunicados a través de la app.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}