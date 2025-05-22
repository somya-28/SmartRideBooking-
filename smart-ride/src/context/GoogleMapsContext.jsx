import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyB_WZYkqvBUTZuhL0HJxEhXBLzx3O1aUns';

// Libraries to load
const libraries = ['places'];

// Create context
const GoogleMapsContext = createContext(null);

// Custom hook to use the context
export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (context === null) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

// Provider component
export const GoogleMapsProvider = ({ children }) => {
  // Load the Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Value to be provided to consumers
  const value = {
    isLoaded,
    loadError,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
