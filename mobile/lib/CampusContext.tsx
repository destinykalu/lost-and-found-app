import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

interface Campus {
  id: string;
  name: string;
}

interface CampusContextType {
  campuses: Campus[];
  selectedCampusId: string | null;
  setSelectedCampusId: (id: string) => void;
  isLoading: boolean;
}

const CampusContext = createContext<CampusContextType>({
  campuses: [],
  selectedCampusId: null,
  setSelectedCampusId: () => {},
  isLoading: true,
});

export const CampusProvider = ({ children }: { children: React.ReactNode }) => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCampuses() {
      try {
        const { data, error } = await supabase
          .from('campuses')
          .select('id, name')
          .order('name');

        if (error) throw error;

        if (data && data.length > 0) {
          setCampuses(data);
          setSelectedCampusId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load campuses:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCampuses();
  }, []);

  return (
    <CampusContext.Provider
      value={{ campuses, selectedCampusId, setSelectedCampusId, isLoading }}
    >
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = () => useContext(CampusContext);
