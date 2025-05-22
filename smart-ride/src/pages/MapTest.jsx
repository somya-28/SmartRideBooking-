import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 12.9716,
  lng: 77.5946 // Bangalore coordinates
};

const MapTest = () => {
  // Get Google Maps API state from context
  const { isLoaded, loadError, googleMapsApiKey } = useGoogleMaps();

  const renderMap = () => {
    // Show loading state while the map is loading
    if (!isLoaded) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography>Loading Maps...</Typography>
        </Box>
      );
    }

    // Show error state if there was an error loading the map
    if (loadError) {
      return (
        <Box sx={{ p: 4 }}>
          <Typography color="error">
            Error loading Google Maps: {loadError.message}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            This might indicate an invalid or restricted API key.
          </Typography>
        </Box>
      );
    }

    // Render map if loaded successfully
    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
      >
        {/* No markers needed for this test */}
      </GoogleMap>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Google Maps API Key Test
        </Typography>
        
        <Typography variant="body1" paragraph>
          This page tests if your Google Maps API key is working correctly.
        </Typography>
        
        <Typography variant="body2" paragraph color="text.secondary">
          API Key: AIzaSyB_WZYkqvBUTZuhL0HJxEhXBLzx3O1aUns
        </Typography>
        
        <Box sx={{ mt: 3, border: '1px solid #eee' }}>
          {renderMap()}
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2">
            If you see a map above, your API key is working correctly!
          </Typography>
          <Typography variant="body2">
            If you see a gray box or an error message, there might be an issue with your API key.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default MapTest;
