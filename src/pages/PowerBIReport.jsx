import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export default function PowerBIReport() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(194,24,117,0.1)' }}>
            <BarChart3 style={{ color: '#C21875', width: 20, height: 20 }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Producto para llevar</h1>
            <p className="text-xs text-slate-400 font-medium">Análisis avanzado · Power BI</p>
          </div>
        </div>

        {/* Power BI Embed */}
        <div
          className="rounded-2xl overflow-hidden shadow-lg"
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,0,0,0.07)',
            height: 'calc(100vh - 140px)',
            minHeight: 600,
          }}
        >
          <iframe
            title="Producto para llevar"
            src="https://app.powerbi.com/reportEmbed?reportId=c158c2bb-3148-47f0-9ddb-a56ef1c3b366&autoAuth=true&ctid=common"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>

        <p className="text-center text-[10px] text-slate-300 font-medium mt-3 tracking-widest uppercase">
          Powered by Power BI · Popsy Colombia
        </p>
      </motion.div>
    </div>
  );
}