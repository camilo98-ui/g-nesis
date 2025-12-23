import React, { createContext, useContext, useState, useEffect } from 'react';

const TimeThemeContext = createContext();

export const useTimeTheme = () => useContext(TimeThemeContext);

export function TimeBasedThemeProvider({ children }) {
  const [isDayMode, setIsDayMode] = useState(true);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      // Día: 6am - 6pm (6-17), Noche: 6pm - 5am (18-23, 0-5)
      const isDay = hour >= 6 && hour < 18;
      setIsDayMode(isDay);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Revisar cada minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <TimeThemeContext.Provider value={{ isDayMode }}>
      <div className={isDayMode ? 'theme-day' : 'theme-night'}>
        {children}
      </div>
    </TimeThemeContext.Provider>
  );
}

export default TimeBasedThemeProvider;