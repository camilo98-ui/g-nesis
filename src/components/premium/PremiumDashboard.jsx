import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PremiumSidebar from './PremiumSidebar';
import PremiumHeader from './PremiumHeader';
import KPICard from './KPICard';
import SalesChart from './SalesChart';
import ParticipationChart from './ParticipationChart';
import NovaAIPanel from './NovaAIPanel';

export default function PremiumDashboard({ 
  selectedStore, 
  onStoreChange, 
  onLogout, 
  storeName, 
  userName = 'Camila',
  children
}) {
  const [showNovaAI, setShowNovaAI] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <PremiumSidebar 
        selectedStore={selectedStore} 
        onStoreChange={onStoreChange} 
        onLogout={onLogout}
        storeName={storeName}
      />

      {/* Header */}
      <PremiumHeader userName={userName} />

      {/* Main content */}
      <main className="ml-64 pt-24 pb-12 px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto"
        >
          {/* KPI Section */}
          <section className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard 
                title="Ventas Hoy"
                value="$2.2M"
                change={-8}
                unit=""
                icon="💰"
                gradient="from-pink-50 to-pink-100"
                lineColor="#c21875"
              />
              <KPICard 
                title="Ticket Promedio"
                value="$58K"
                change={12}
                unit=""
                icon="🛒"
                gradient="from-amber-50 to-amber-100"
                lineColor="#f59e0b"
              />
              <KPICard 
                title="EBITDA"
                value="$652K"
                change={18}
                unit=""
                icon="📊"
                gradient="from-indigo-50 to-indigo-100"
                lineColor="#6366f1"
              />
              <KPICard 
                title="Transacciones"
                value="120"
                change={-18}
                unit=""
                icon="⚡"
                gradient="from-cyan-50 to-cyan-100"
                lineColor="#06b6d4"
              />
            </div>
          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <SalesChart />
            </div>
            <div>
              <ParticipationChart />
            </div>
          </section>

          {/* Additional Analytics */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Análitica Adicional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnalyticsCard title="TXC por Hora" icon="🕐" description="Patrón semanal de transacciones" />
              <AnalyticsCard title="EBITDA Acumulado" icon="📈" description="Margen operativo 29.7%" />
              <AnalyticsCard title="Resumen P&G" icon="💹" description="Profit & Loss acumulado" />
            </div>
          </section>
        </motion.div>
      </main>

      {/* Nova AI Panel */}
      <NovaAIPanel isOpen={showNovaAI} onClose={() => setShowNovaAI(false)} />

      {/* Children (Modals) */}
      {children}
    </div>
  );
}

function AnalyticsCard({ title, icon, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 border border-slate-200 cursor-pointer hover:shadow-lg transition"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      <button className="text-xs font-medium text-pink-600 hover:text-pink-700">Ver detalles →</button>
    </motion.div>
  );
}