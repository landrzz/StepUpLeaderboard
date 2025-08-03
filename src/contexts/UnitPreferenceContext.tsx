import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../../supabase/auth';
import { UserProfileService } from '../lib/userProfileService';

export type DistanceUnit = 'kilometers' | 'miles';

interface UnitPreferenceContextType {
  distanceUnit: DistanceUnit;
  setDistanceUnit: (unit: DistanceUnit) => void;
  convertDistance: (distanceKm: number) => number;
  getDistanceLabel: () => string;
  getDistanceAbbreviation: () => string;
}

const UnitPreferenceContext = createContext<UnitPreferenceContextType | undefined>(undefined);

interface UnitPreferenceProviderProps {
  children: ReactNode;
}

export const UnitPreferenceProvider: React.FC<UnitPreferenceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [distanceUnit, setDistanceUnitState] = useState<DistanceUnit>('miles'); // Default to miles

  // Load user's preference when they log in
  useEffect(() => {
    const loadUserPreference = async () => {
      if (user) {
        const profile = await UserProfileService.getUserProfile(user.id);
        if (profile?.distance_unit) {
          setDistanceUnitState(profile.distance_unit as DistanceUnit);
        }
      } else {
        // Default to miles for anonymous users
        setDistanceUnitState('miles');
      }
    };

    loadUserPreference();
  }, [user]);

  const setDistanceUnit = async (unit: DistanceUnit) => {
    setDistanceUnitState(unit);
    
    // Save to database if user is logged in
    if (user) {
      try {
        await UserProfileService.updateDistanceUnit(user.id, unit);
      } catch (error) {
        console.error('Failed to save distance unit preference:', error);
      }
    }
  };

  const convertDistance = (distanceKm: number): number => {
    if (distanceUnit === 'miles') {
      return distanceKm * 0.621371; // Convert km to miles
    }
    return distanceKm; // Return as kilometers
  };

  const getDistanceLabel = (): string => {
    return distanceUnit === 'miles' ? 'miles' : 'kilometers';
  };

  const getDistanceAbbreviation = (): string => {
    return distanceUnit === 'miles' ? 'mi' : 'km';
  };

  const value: UnitPreferenceContextType = {
    distanceUnit,
    setDistanceUnit,
    convertDistance,
    getDistanceLabel,
    getDistanceAbbreviation,
  };

  return (
    <UnitPreferenceContext.Provider value={value}>
      {children}
    </UnitPreferenceContext.Provider>
  );
};

export const useUnitPreference = (): UnitPreferenceContextType => {
  const context = useContext(UnitPreferenceContext);
  if (context === undefined) {
    throw new Error('useUnitPreference must be used within a UnitPreferenceProvider');
  }
  return context;
};
