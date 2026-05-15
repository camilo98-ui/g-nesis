import { createContext, useContext, useState } from 'react';

const NovaContext = createContext(null);

export function NovaProvider({ children }) {
  const [pageData, setPageData] = useState(null);
  return (
    <NovaContext.Provider value={{ pageData, setPageData }}>
      {children}
    </NovaContext.Provider>
  );
}

export function useNova() {
  return useContext(NovaContext);
}