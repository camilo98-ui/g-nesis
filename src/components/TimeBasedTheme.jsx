import React, { createContext, useContext, useState, useEffect } from 'react';

const TimeThemeContext = createContext();

export const useTimeTheme = () => useContext(TimeThemeContext);

export function TimeBasedThemeProvider({ children }) {
  const [manualMode, setManualMode] = useState(null); // null = automático, true = día, false = noche
  const [autoMode, setAutoMode] = useState(true);

  useEffect(() => {
    // Cargar preferencia guardada
    const saved = localStorage.getItem('themeMode');
    if (saved && saved !== 'auto') {
      setManualMode(saved === 'day');
    }
  }, []);

  useEffect(() => {
    if (manualMode === null) {
      const checkTime = () => {
        const hour = new Date().getHours();
        // Día: 6am - 6pm (6-17), Noche: 6pm - 5am (18-23, 0-5)
        const isDay = hour >= 6 && hour < 18;
        setAutoMode(isDay);
      };

      checkTime();
      const interval = setInterval(checkTime, 60000); // Revisar cada minuto

      return () => clearInterval(interval);
    }
  }, [manualMode]);

  const isDayMode = manualMode !== null ? manualMode : autoMode;

  const toggleTheme = () => {
    if (manualMode === null) {
      // Primera vez: fijar el modo contrario al actual
      const newMode = !isDayMode;
      setManualMode(newMode);
      localStorage.setItem('themeMode', newMode ? 'day' : 'night');
    } else {
      // Ciclar: manual día -> manual noche -> automático
      if (manualMode === true) {
        setManualMode(false);
        localStorage.setItem('themeMode', 'night');
      } else {
        setManualMode(null);
        localStorage.setItem('themeMode', 'auto');
      }
    }
  };

  return (
    <TimeThemeContext.Provider value={{ isDayMode, toggleTheme, isManual: manualMode !== null }}>
      <div className={isDayMode ? 'theme-day' : 'theme-night'}>
        {children}
      </div>
    </TimeThemeContext.Provider>
  );
}

export default TimeBasedThemeProvider;