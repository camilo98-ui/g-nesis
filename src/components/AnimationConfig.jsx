// Configuración centralizada de animaciones para consistencia
export const animations = {
  // Transiciones de página
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeInOut" }
  },

  // Fade simple
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },

  // Slide desde abajo (modales)
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Slide desde arriba
  slideDown: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Scale (popovers, tooltips)
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Hover para cards
  cardHover: {
    whileHover: { y: -8, scale: 1.02, transition: { duration: 0.2 } },
    whileTap: { scale: 0.98 }
  },

  // Hover para botones
  buttonHover: {
    whileHover: { scale: 1.05, transition: { duration: 0.2 } },
    whileTap: { scale: 0.95 }
  },

  // Stagger para listas
  listContainer: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  },

  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 }
  },

  // Pulse suave
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  }
};

// Configuración de spring physics para animaciones más naturales
export const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

// Configuración de easing
export const easings = {
  smooth: [0.43, 0.13, 0.23, 0.96],
  snappy: [0.68, -0.55, 0.265, 1.55]
};