import { createContext, useContext, useState, useCallback } from 'react';

const NovaContext = createContext(null);

export function NovaProvider({ children }) {
  const [pageData, setPageData] = useState(null);
  const [sectionSnapshots, setSectionSnapshots] = useState({}); // Captura secciones abiertas

  // Extrae datos dinámicamente de secciones activas
  const extractSectionData = useCallback((sectionId, sectionData) => {
    setSectionSnapshots(prev => ({
      ...prev,
      [sectionId]: {
        timestamp: new Date().toISOString(),
        ...sectionData
      }
    }));
  }, []);

  // Limpia secciones cerradas
  const removeSectionData = useCallback((sectionId) => {
    setSectionSnapshots(prev => {
      const updated = { ...prev };
      delete updated[sectionId];
      return updated;
    });
  }, []);

  // Obtiene resumen consolidado de todas las secciones abiertas
  const getSectionsSummary = useCallback(() => {
    const sections = Object.entries(sectionSnapshots).map(([id, data]) => ({
      id,
      ...data
    }));
    return sections;
  }, [sectionSnapshots]);

  return (
    <NovaContext.Provider value={{
      pageData,
      setPageData,
      sectionSnapshots,
      extractSectionData,
      removeSectionData,
      getSectionsSummary
    }}>
      {children}
    </NovaContext.Provider>
  );
}

export function useNova() {
  return useContext(NovaContext);
}