import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import PremiumSparkline from './PremiumSparkline';

function MetricCard({ label, value, subtext, icon: Icon, progress, sparkData, delay, accent }) {
  return null;















































































}

export default function DailyMetricsPanel({ todaySales = [], budget = [] }) {
  // Calculate metrics
  const latest = useMemo(() => todaySales?.[0] || {}, [todaySales]);
  const activeBudget = useMemo(() => budget?.find((b) => b.is_active) || budget?.[0] || {}, [budget]);

  // PPT del día (sales_budget is monthly, divide by ~22 business days)
  const dailyPPT = useMemo(() => {
    if (!activeBudget.sales_budget) return null;
    return Math.round(activeBudget.sales_budget / 22);
  }, [activeBudget]);

  // Current sales progress
  const salesHoy = latest?.total_sales || 0;
  const pptProgress = useMemo(() => {
    if (!dailyPPT || !salesHoy) return 0;
    return Math.min(100, salesHoy / dailyPPT * 100);
  }, [dailyPPT, salesHoy]);

  // Sales projection to close
  const hourNow = new Date().getHours();
  const hoursRemaining = useMemo(() => {
    // Assume store closes at 22:00 (10pm)
    const closeHour = 22;
    const remaining = Math.max(0, closeHour - hourNow);
    return remaining;
  }, [hourNow]);

  const avgHourlyRate = useMemo(() => {
    if (hourNow <= 8 || !salesHoy) return 0;
    const hoursWorked = hourNow - 8; // Assuming open at 8am
    return Math.round(salesHoy / hoursWorked);
  }, [hourNow, salesHoy]);

  const projectedClose = useMemo(() => {
    if (!avgHourlyRate || hourNow <= 8) return salesHoy;
    const hoursWorked = hourNow - 8;
    const totalHours = 22 - 8; // Full day is 14 hours
    return Math.round((hoursWorked + hoursRemaining) * avgHourlyRate);
  }, [avgHourlyRate, salesHoy, hoursRemaining, hourNow]);

  const projectionPercent = useMemo(() => {
    if (!dailyPPT || !projectedClose) return 0;
    return Math.min(100, projectedClose / dailyPPT * 100);
  }, [dailyPPT, projectedClose]);

  // Spark data from historical sales
  const sparkDaily = useMemo(() => {
    if (todaySales.length < 2) return [60, 75, 85, 70, 80, 90, 110, 120];
    return todaySales.
    slice(0, 8).
    reverse().
    map((d) => (d.total_sales || 0) / 100000); // Normalize for display
  }, [todaySales]);

  // Format currency
  const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  return null;





























































































}