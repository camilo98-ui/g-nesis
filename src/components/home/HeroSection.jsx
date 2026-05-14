import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import KPICard from './KPICard';
import NovaAIStrip from './NovaAIStrip';
import DashboardChart from './DashboardChart';

export default function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6 mb-8">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <KPICard 
          label="Ventas Hoy" 
          value="$4.2M" 
          change={12}
          color="#ef4444"
          delay={0}
        />
        <KPICard 
          label="Transacciones" 
          value="87" 
          change={8}
          color="#3b82f6"
          delay={0.1}
        />
        <KPICard 
          label="Ticket Promedio" 
          value="$48.3K" 
          change={-3}
          color="#10b981"
          delay={0.2}
        />
        <KPICard 
          label="Cumplimiento PPT" 
          value="94.2%" 
          change={5}
          color="#f59e0b"
          delay={0.3}
        />
        <KPICard 
          label="Sugeridos" 
          value="32" 
          change={15}
          color="#8b5cf6"
          delay={0.4}
        />
      </div>

      {/* Nova AI Strip */}
      <NovaAIStrip />

      {/* Main Chart */}
      <DashboardChart />
    </motion.div>
  );
}