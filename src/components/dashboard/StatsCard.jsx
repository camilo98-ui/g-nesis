import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatsCard({ 
  title, 
  value, 
  budget, 
  icon: Icon, 
  trend, 
  color = "orange",
  format = "number",
  delay = 0 
}) {
  const percentage = budget ? ((value / budget) * 100).toFixed(1) : 0;
  const isPositive = percentage >= 100;
  const isNeutral = percentage >= 80 && percentage < 100;

  const colorClasses = {
    orange: {
      bg: "from-orange-500 to-red-500",
      light: "bg-orange-100",
      text: "text-orange-600",
      border: "border-orange-200"
    },
    blue: {
      bg: "from-blue-500 to-indigo-500",
      light: "bg-blue-100",
      text: "text-blue-600",
      border: "border-blue-200"
    },
    green: {
      bg: "from-green-500 to-emerald-500",
      light: "bg-green-100",
      text: "text-green-600",
      border: "border-green-200"
    },
    purple: {
      bg: "from-purple-500 to-pink-500",
      light: "bg-purple-100",
      text: "text-purple-600",
      border: "border-purple-200"
    }
  };

  const formatValue = (val) => {
    if (format === "currency") {
      return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    return new Intl.NumberFormat('es-CO').format(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative overflow-hidden bg-white rounded-2xl shadow-lg border ${colorClasses[color].border} p-6 hover:shadow-xl transition-all duration-300`}
    >
      {/* Background decoration */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${colorClasses[color].bg} opacity-10 rounded-full blur-2xl`} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color].light}`}>
            <Icon className={`w-6 h-6 ${colorClasses[color].text}`} />
          </div>
          {budget > 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive ? 'bg-green-100 text-green-700' : 
              isNeutral ? 'bg-yellow-100 text-yellow-700' : 
              'bg-red-100 text-red-700'
            }`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : 
               isNeutral ? <Minus className="w-3 h-3" /> : 
               <TrendingDown className="w-3 h-3" />}
              {percentage}%
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-gray-800">
          {formatValue(value)}
        </p>
        
        {budget > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Presupuesto: {formatValue(budget)}</span>
              <span>{percentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ delay: delay + 0.3, duration: 0.8 }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  isPositive ? 'from-green-400 to-green-500' : 
                  isNeutral ? 'from-yellow-400 to-yellow-500' : 
                  'from-red-400 to-red-500'
                }`}
              />
            </div>
          </div>
        )}

        {trend && (
          <p className="mt-3 text-xs text-gray-400">
            {trend}
          </p>
        )}
      </div>
    </motion.div>
  );
}