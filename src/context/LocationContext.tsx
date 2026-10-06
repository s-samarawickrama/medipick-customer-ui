import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';

interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationContextData {
  coords: Coords | null;
  locationName: string;
  loading: boolean;
  error: string | null;
  setCoords: (coords: Coords | null) => void;
  setLocationName: (name: string) => void;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextData>({
  coords: null,
  locationName: 'Locating...',
  loading: true,
  error: null,
  setCoords: () => {},
  setLocationName: () => {},
  refreshLocation: async () => {},
});

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationName, setLocationName] = useState<string>('Locating...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLocationName('Location Access Denied');
        setCoords({ latitude: 6.9271, longitude: 79.8612 });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address && address.length > 0) {
        const { city, street, name } = address[0];
        setLocationName(`${city || street || 'Your Location'} · Nearby`);
      } else {
        setLocationName('Current Device Location');
      }
    } catch (err) {
      setError('Failed to fetch location');
      setLocationName('Location Unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ coords, locationName, loading, error, setCoords, setLocationName, refreshLocation: fetchLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
