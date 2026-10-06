import { useState, useEffect } from 'react';
// import * as Location from 'expo-location'; 
// NOTE: We will need to run `npx expo install expo-location` to use this fully in the future.

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  errorMsg: string | null;
  isLoading: boolean;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    errorMsg: null,
    isLoading: true,
  });

  useEffect(() => {
    (async () => {
      /* 
      // Uncomment and use this logic once expo-location is installed
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(prev => ({ ...prev, errorMsg: 'Permission to access location was denied', isLoading: false }));
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        errorMsg: null,
        isLoading: false,
      });
      */
      
      // Mocking the location load for now
      setTimeout(() => {
        setLocation({
          latitude: 6.9271, // Colombo, Sri Lanka
          longitude: 79.8612,
          errorMsg: null,
          isLoading: false,
        });
      }, 1000);

    })();
  }, []);

  return location;
};
