import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Award } from 'lucide-react';
import { Button } from "@/components/ui/button";
import CashierAnalysis from '@/components/cashier/CashierAnalysis';
import BadgesDisplay from '@/components/gamification/BadgesDisplay';
import CashierProfileHeader from '@/components/cashier/CashierProfileHeader';

export default function CashierProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const cashierId = urlParams.get('id');
  const from = urlParams.get('from'); // 'rankings', 'cashiers', etc.

  const { data: cashier, isLoading, isError } = useQuery({
    queryKey: ['cashier', cashierId],
    queryFn: async () => {
      if (!cashierId) return null;
      const allCashiers = await base44.entities.Cashier.list();
      return allCashiers.find(c => c.id === cashierId) || null;
    },
    enabled: !!cashierId,
    retry: 2
  });

  const getBackLink = () => {
    if (from === 'rankings') return { url: 'Rankings', label: 'Volver a Rankings' };
    if (from === 'cashiers') return { url: 'CashiersDashboard', label: 'Volver a Cajeros' };
    return { url: 'Home', label: 'Volver al Inicio' };
  };

  const backInfo = getBackLink();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cashierId || isError || !cashier) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-500">Cajero no encontrado</p>
          <Link to={createPageUrl(backInfo.url)}>
            <Button variant="outline" className="mt-4">{backInfo.label}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Link to={createPageUrl(backInfo.url)}>
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-pink-600">
            <ArrowLeft className="w-4 h-4" />
            {backInfo.label}
          </Button>
        </Link>

        {/* Profile Header con portada estilo Facebook */}
        <CashierProfileHeader cashier={cashier} storeCode={cashier.store_id} />
        
        {/* Logros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Logros
          </h3>
          <BadgesDisplay cashierId={cashierId} showAll />
        </motion.div>

        {/* Analysis */}
        <CashierAnalysis 
          cashierId={cashierId} 
          cashierName={cashier.name}
          storeId={cashier.store_id}
        />
      </div>
    </div>
  );
}