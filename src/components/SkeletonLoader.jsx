import React from 'react';
import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl p-5 border-2 border-transparent shadow-md"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
        <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
      </div>
      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="w-32 h-8 bg-gray-200 rounded animate-pulse mb-3" />
      <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
    </motion.div>
  );
}

export function SkeletonChart() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="h-64 bg-gray-100 rounded-xl overflow-hidden relative">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

export function SkeletonTable() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl p-6 shadow-lg space-y-3"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded" />
        </div>
      ))}
    </motion.div>
  );
}