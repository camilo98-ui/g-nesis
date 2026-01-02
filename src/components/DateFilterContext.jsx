import React, { createContext, useContext, useState } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

const DateFilterContext = createContext();

export function DateFilterProvider({ children }) {
  const now = new Date();
  const [startDate, setStartDate] = useState(startOfMonth(now));
  const [endDate, setEndDate] = useState(endOfMonth(now));

  return (
    <DateFilterContext.Provider value={{ startDate, endDate, setStartDate, setEndDate }}>
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error('useDateFilter must be used within DateFilterProvider');
  }
  return context;
}