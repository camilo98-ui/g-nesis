import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, Award, TrendingUp, DollarSign, Receipt, Zap, Gift, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CashierProfile({ cashier, stats }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  const avgTicket = stats.totalTickets > 0 ? stats.totalSales / stats.totalTickets : 0;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-xl border-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <CardContent className="relative pt-8 pb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-5xl">🍦</span>
              </div>
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{cashier.name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-white/80 text-sm">
                  {cashier.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {cashier.email}
                    </span>
                  )}
                  {cashier.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {cashier.phone}
                    </span>
                  )}
                  {cashier.hire_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {(() => {
                        try {
                          const date = new Date(cashier.hire_date);
                          if (isNaN(date.getTime())) return 'Miembro del equipo';
                          return `Desde ${format(date, 'MMM yyyy', { locale: es })}`;
                        } catch {
                          return 'Miembro del equipo';
                        }
                      })()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {stats.salesRank <= 3 && (
                  <Badge className="bg-yellow-400 text-yellow-900 text-lg px-4 py-2">
                    <Award className="w-5 h-5 mr-1" />
                    #{stats.salesRank} Ventas
                  </Badge>
                )}
                {stats.suggestedRank <= 3 && (
                  <Badge className="bg-pink-400 text-pink-900 text-lg px-4 py-2">
                    <Star className="w-5 h-5 mr-1" />
                    #{stats.suggestedRank} Sugeridos
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white border-green-100 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Ventas Totales</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalSales)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border-blue-100 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Total Tickets</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTickets.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Prom: {formatCurrency(avgTicket)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white border-purple-100 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Transacciones</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTransactions.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white border-pink-100 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Gift className="w-5 h-5 text-pink-600" />
                </div>
                <span className="text-sm text-gray-500">Sugeridos</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalSuggested.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-fuchsia-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="w-5 h-5 text-fuchsia-500" />
              Rendimiento General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Ranking de Ventas</span>
                  <span className="font-semibold text-gray-800">#{stats.salesRank}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                    style={{ width: `${Math.max(10, 100 - (stats.salesRank - 1) * 10)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Ranking de Sugeridos</span>
                  <span className="font-semibold text-gray-800">#{stats.suggestedRank}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"
                    style={{ width: `${Math.max(10, 100 - (stats.suggestedRank - 1) * 10)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Turnos registrados</span>
                  <span className="font-semibold text-gray-800">{stats.shiftsCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}