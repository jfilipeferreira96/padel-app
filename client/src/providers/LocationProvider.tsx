import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useSession } from "./SessionProvider";

export interface Location {
  label: string;
  value: number | null;
}

interface UserLocation {
  location_name: string;
  location_id: number;
}

interface LocationContextProps {
  location: Location;
  setLocation: (newLocation: Location) => void;
  availableLocations: Location[];
  setAvailableLocations: (locations: Location[]) => void;
}

const LocationContext = createContext<LocationContextProps | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [location, setLocationState] = useState<Location>({ label: "", value: null });
  const { user } = useSession();

  const setLocation = (newLocation: Location) => {
    setLocationState(newLocation);
    localStorage.setItem("last_location", JSON.stringify(newLocation));
  };

  useEffect(() => {
    if (user && user.user_type === "admin") {
      let storedLocation: Location | null = null;
      const storedLocationStr = localStorage.getItem("last_location");
      if (storedLocationStr) {
        storedLocation = JSON.parse(storedLocationStr);
      }

      if (Array.isArray(user.locations)) {
        const locations: Location[] = user.locations.map((location: UserLocation) => ({
          label: location.location_name,
          value: location.location_id,
        }));
        setAvailableLocations(locations);

        if (storedLocation && locations.some((loc) => loc.label === storedLocation?.label))
        {
          setLocationState(storedLocation);
        } else{
          setLocationState(locations[0]);
        }

      }
    }
  }, [user]);

  return <LocationContext.Provider value={{ location, setLocation, availableLocations, setAvailableLocations }}>{children}</LocationContext.Provider>;
};

export const useLocation = (): LocationContextProps => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};

export const setLocationInLocalStorage = (newLocation: Location) => {
  localStorage.setItem("userLocation", JSON.stringify(newLocation));
};
