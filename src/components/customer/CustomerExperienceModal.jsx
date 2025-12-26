import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const RatingCard = ({ rating, emoji, color, gradient, label, onClick, disabled }) => {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05, y: -10 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      onClick={onClick}
      disabled={disabled}
      className={`${gradient} rounded-[40px] p-12 sm:p-16 shadow-2xl hover:shadow-3xl transition-all aspect-square flex flex-col items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white/50`}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        className="text-[120px] sm:text-[150px] mb-6"
      >
        {emoji}
      </motion.div>
      <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">{label}</p>
    </motion.button>
  );
};

const SuccessAnimation = ({ rating, message, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const emojis = {
    excelente: '😀',
    normal: '😐',
    mala: '☹️'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center z-50 p-8"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="bg-white/20 backdrop-blur-xl rounded-full w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-8 mx-auto shadow-2xl"
        >
          <Check className="w-20 h-20 sm:w-24 sm:h-24 text-white" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-8xl sm:text-9xl mb-8"
        >
          {emojis[rating]}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-4xl sm:text-5xl font-black text-white mb-6 drop-shadow-2xl"
        >
          ¡Guardado!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-2xl sm:text-3xl text-white font-bold max-w-3xl leading-relaxed px-8"
        >
          {message}
        </motion.p>

        {/* Confetti decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100, x: Math.random() * window.innerWidth, opacity: 1 }}
              animate={{ 
                y: window.innerHeight + 100, 
                rotate: Math.random() * 360,
                opacity: 0
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                delay: Math.random() * 0.5,
                ease: "linear"
              }}
              className="absolute w-4 h-4 rounded-full"
              style={{ 
                backgroundColor: ['#fff', '#fef3c7', '#fbcfe8', '#ddd6fe'][i % 4] 
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default function CustomerExperienceModal({ onClose, storeId }) {
  const [status, setStatus] = useState('idle'); // idle, saving, success
  const [selectedRating, setSelectedRating] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const queryClient = useQueryClient();

  const { data: todayFeedback = [] } = useQuery({
    queryKey: ['customerFeedback', storeId, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const all = await base44.entities.CustomerFeedback.list('-created_date');
      return all.filter(f => f.store_id === storeId && f.date === format(new Date(), 'yyyy-MM-dd'));
    },
    enabled: !!storeId
  });

  const saveFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerFeedback'] });
      setStatus('success');
    },
    onError: () => {
      setStatus('idle');
    }
  });

  const handleRatingClick = (rating) => {
    if (status !== 'idle') return;

    setStatus('saving');
    setSelectedRating(rating);

    const ratingConfig = {
      excelente: {
        nps: 'promotor',
        points: 10,
        message: '¡Gracias! Nos encanta saber que tu experiencia fue excelente 💚'
      },
      normal: {
        nps: 'pasivo',
        points: 3,
        message: '¡Gracias por tu opinión! Seguiremos mejorando para ti 🧡'
      },
      mala: {
        nps: 'detractor',
        points: -5,
        message: 'Gracias por contarnos. Vamos a revisar tu experiencia para hacerlo mejor ❤️'
      }
    };

    const config = ratingConfig[rating];
    setSuccessMessage(config.message);

    const now = new Date();
    saveFeedbackMutation.mutate({
      store_id: storeId,
      rating: rating,
      nps_type: config.nps,
      points: config.points,
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm:ss'),
      device: navigator.userAgent.substring(0, 50)
    });
  };

  const handleSuccessComplete = () => {
    setStatus('idle');
    setSelectedRating(null);
    setSuccessMessage('');
  };

  const totalToday = todayFeedback.length;
  const npsData = todayFeedback.reduce((acc, f) => {
    acc[f.nps_type] = (acc[f.nps_type] || 0) + 1;
    return acc;
  }, {});

  const npsScore = totalToday > 0 
    ? Math.round((((npsData.promotor || 0) - (npsData.detractor || 0)) / totalToday) * 100)
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 z-50 overflow-hidden"
        onClick={status === 'idle' ? onClose : undefined}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: Math.random() * 300 + 100,
                height: Math.random() * 300 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1],
                x: [0, Math.random() * 50 - 25, 0],
                y: [0, Math.random() * 50 - 25, 0],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 h-full flex flex-col items-center justify-center p-6 sm:p-12"
        >
          {/* Close button */}
          {status === 'idle' && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-6 right-6 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-7 h-7 text-white" />
            </motion.button>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-6xl sm:text-7xl mb-6"
            >
              ✨
            </motion.div>
            <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 drop-shadow-2xl">
              ¿Cómo fue tu experiencia?
            </h1>
            <p className="text-2xl sm:text-3xl text-white/80 font-medium">
              Selecciona una opción
            </p>
          </motion.div>

          {/* Rating Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-6xl w-full mb-8">
            <RatingCard
              rating="excelente"
              emoji="😀"
              color="emerald"
              gradient="bg-gradient-to-br from-emerald-400 via-green-400 to-teal-500"
              label="Excelente"
              onClick={() => handleRatingClick('excelente')}
              disabled={status !== 'idle'}
            />
            <RatingCard
              rating="normal"
              emoji="😐"
              color="amber"
              gradient="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500"
              label="Normal"
              onClick={() => handleRatingClick('normal')}
              disabled={status !== 'idle'}
            />
            <RatingCard
              rating="mala"
              emoji="☹️"
              color="red"
              gradient="bg-gradient-to-br from-red-400 via-rose-400 to-pink-500"
              label="Mala"
              onClick={() => handleRatingClick('mala')}
              disabled={status !== 'idle'}
            />
          </div>

          {/* Stats (pequeño, discreto) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-white/40 text-sm"
          >
            <p>Hoy: {totalToday} opiniones · NPS: {npsScore}</p>
          </motion.div>
        </motion.div>

        {/* Success Animation */}
        <AnimatePresence>
          {status === 'success' && (
            <SuccessAnimation
              rating={selectedRating}
              message={successMessage}
              onComplete={handleSuccessComplete}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}