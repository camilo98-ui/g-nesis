import React, { createContext, useContext, useState } from 'react';

const PYGDashboardContext = createContext();

export function PYGDashboardProvider({ children }) {
  const [isPYGDashboardOpen, setIsPYGDashboardOpen] = useState(false);

  return (
    <PYGDashboardContext.Provider value={{ isPYGDashboardOpen, setIsPYGDashboardOpen }}>
      {children}
    </PYGDashboardContext.Provider>
  );
}

export function usePYGDashboard() {
  const context = useContext(PYGDashboardContext);
  if (!context) {
    throw new Error('usePYGDashboard must be used within PYGDashboardProvider');
  }
  return context;
}