import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Calendar, Mail, Phone, Award } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CashierAnalysis from '@/components/cashier/CashierAnalysis';
import BadgesDisplay from '@/components/gamification/BadgesDisplay';

export default function CashierProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const cashierId = urlParams.get('id');
  const from = urlParams.get('from'); // 'rankings', 'cashiers', etc.

  const { data: cashier, isLoading } = useQuery({
    queryKey: ['cashier', cashierId],
    queryFn: async () => {
      const results = await base44.entities.Cashier.filter({ id: cashierId });
      return results[0] || null;
    },
    enabled: !!cashierId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getBackLink = () => {
    if (from === 'rankings') return { url: 'Rankings', label: 'Volver al Ranking Global' };
    if (from === 'cashiers') return { url: 'CashiersDashboard', label: 'Volver a Cajeros' };
    return { url: 'CashiersDashboard', label: 'Volver a Cajeros' };
  };

  const backInfo = getBackLink();

  if (!cashier) {
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

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="h-24 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                <span className="text-3xl font-bold text-pink-500">{cashier.name?.charAt(0)}</span>
              </div>
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-gray-800">{cashier.name}</h1>
                <p className="text-gray-500 text-sm">{cashier.store_id}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              {cashier.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {cashier.email}
                </div>
              )}
              {cashier.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {cashier.phone}
                </div>
              )}
              {cashier.hire_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Desde {format(new Date(cashier.hire_date), "MMMM yyyy", { locale: es })}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Insignias ganadas
              </h3>
              <BadgesDisplay cashierId={cashierId} />
            </div>
          </div>
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