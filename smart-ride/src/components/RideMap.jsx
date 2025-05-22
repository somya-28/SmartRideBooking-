import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, DirectionsService, DirectionsRenderer, Marker, Polyline } from '@react-google-maps/api';
import { Box, Paper, Typography, Skeleton, Alert, CircularProgress } from '@mui/material';
import { useGoogleMaps } from '../context/GoogleMapsContext';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
  backgroundColor: '#e8eaf6', // Lighter blue background
  position: 'relative', // Ensure proper positioning
  overflow: 'hidden',
  display: 'block', // Force display
  margin: 0,
  padding: 0
};

export default function RideMap({ pickupCoords, dropCoords, onRouteLoad }) {
  const [directions, setDirections] = useState(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [directionsRequested, setDirectionsRequested] = useState(false);
  const [useManualRoute, setUseManualRoute] = useState(false);
  
  // Track whether we've already called onRouteLoad
  const routeLoadedRef = useRef(false);
  
  // Get Google Maps API state from context
  const { isLoaded, loadError } = useGoogleMaps();

  const onMapLoad = useCallback((map) => {
    setMap(map);
    setLoading(false);
  }, []);

  const directionsCallback = useCallback((response) => {
    console.log('Directions response:', response); // Debug log
    
    if (response !== null && response.status === 'OK') {
      setDirections(response);
      
      // Extract route information for parent component
      const route = response.routes[0];
      const leg = route.legs[0];
      const distance = leg.distance.value / 1000; // Convert to km
      const duration = Math.ceil(leg.duration.value / 60); // Convert to minutes
      
      console.log('Calculated route:', { distance, duration }); // Debug log
      
      if (onRouteLoad) {
        onRouteLoad({
          distance: parseFloat(distance.toFixed(2)),
          duration: duration,
          polyline: route.overview_polyline
        });
      }
    } else {
      console.error('Directions failed:', response); // Debug log error
      setError('Could not calculate route: ' + (response ? response.status : 'Unknown error'));
    }
  }, [onRouteLoad]);

  // Calculate straight-line distance as a fallback
  const calculateHaversineDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return parseFloat(distance.toFixed(2));
  }, []);
  
  // Reset directions and request a new route when coordinates change
  useEffect(() => {
    if (isLoaded && pickupCoords && dropCoords) {
      console.log('Requesting directions with coords:', { pickupCoords, dropCoords }); // Debug log
      setDirections(null);
      setError(null);
      setDirectionsRequested(false);
      routeLoadedRef.current = false;
      setUseManualRoute(false);
      
      // Set a timeout to use manual route calculation as fallback
      const fallbackTimer = setTimeout(() => {
        if (!routeLoadedRef.current) {
          console.log('Falling back to manual route calculation');
          setUseManualRoute(true);
          
          // Calculate manual route
          const distance = calculateHaversineDistance(
            pickupCoords.lat, pickupCoords.lng,
            dropCoords.lat, dropCoords.lng
          );
          const duration = Math.ceil(distance * 3); // ~3 min per km
          
          if (onRouteLoad && !routeLoadedRef.current) {
            routeLoadedRef.current = true;
            onRouteLoad({
              distance: distance,
              duration: duration,
              polyline: null,
              manual: true
            });
          }
        }
      }, 5000); // 5 seconds timeout
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [isLoaded, pickupCoords, dropCoords, calculateHaversineDistance, onRouteLoad]);

  if (loadError) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Route Map</Typography>
        <Alert severity="error">
          Error loading Google Maps API: {loadError.message || "Please check your API key and internet connection."}
        </Alert>
      </Paper>
    );
  }
  
  if (!isLoaded) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Route Map</Typography>
        <Skeleton variant="rectangular" width="100%" height={300} sx={{ bgcolor: '#e0e0e0' }} />
      </Paper>
    );
  }
  
  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Route Map</Typography>
        <Skeleton variant="rectangular" width="100%" height={300} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Route Map</Typography>
        <Box 
          sx={{ 
            height: 300, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'grey.100'
          }}
        >
          <Typography color="error">{error}</Typography>
        </Box>
      </Paper>
    );
  }

  // If we can't load the map, create a static alternative
  if (!isLoaded || error) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Route Map</Typography>
        <Box sx={{
          position: 'relative',
          height: '300px',
          width: '100%',
          backgroundColor: '#e8eaf6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1px solid #ccc'
        }}>
          {/* Simplified static map visualization */}
          <Box sx={{ mb: 3 }}>
            {loadError ? (
              <Alert severity="warning">Map couldn't be loaded. Using simplified route.</Alert>
            ) : (
              <CircularProgress size={40} />
            )}
          </Box>
          
          {pickupCoords && dropCoords && (
            <Box sx={{ width: '80%', height: '2px', backgroundColor: '#3a7bd5', my: 2 }} />
          )}
          
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', px: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: 'green', mb: 1 }} />
              <Typography variant="caption">Pickup</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: 'red', mb: 1 }} />
              <Typography variant="caption">Dropoff</Typography>
            </Box>
          </Box>
          
          {/* Calculate and show distance/time */}
          {pickupCoords && dropCoords && !routeLoadedRef.current && (
            <Box sx={{ mt: 3 }}>
              {(() => {
                const distance = calculateHaversineDistance(
                  pickupCoords.lat, pickupCoords.lng,
                  dropCoords.lat, dropCoords.lng
                );
                const duration = Math.ceil(distance * 3);
                
                // Pass the calculated route to parent
                if (onRouteLoad && !routeLoadedRef.current) {
                  routeLoadedRef.current = true;
                  setTimeout(() => {
                    onRouteLoad({
                      distance: distance,
                      duration: duration,
                      polyline: null,
                      manual: true
                    });
                  }, 1000);
                }
                
                return (
                  <Typography variant="body2">
                    Distance: {distance} km | Est. Time: {duration} min
                  </Typography>
                );
              })()}
            </Box>
          )}
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>Route Map</Typography>
      <Box sx={{ 
        position: 'relative', 
        border: '1px solid #3a7bd5', 
        borderRadius: '8px', 
        overflow: 'hidden',
        height: '300px', // Explicit height
        width: '100%',
        display: 'block' // Force display
      }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          mapContainerClassName="map-container"
          center={pickupCoords}
          zoom={12}
          onLoad={onMapLoad}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'all',
                elementType: 'all',
                stylers: [{ visibility: 'on' }]
              }
            ]
          }}
        >
          {!directions && (
            <>
              <Marker position={pickupCoords} label="A" />
              <Marker position={dropCoords} label="B" />
            </>
          )}
          
          {!directions && !directionsRequested && pickupCoords && dropCoords && (
            <DirectionsService
              options={{
                origin: pickupCoords,
                destination: dropCoords,
                travelMode: 'DRIVING',
                // Add additional options to help with route calculation
                optimizeWaypoints: true,
                provideRouteAlternatives: false,
                avoidHighways: false,
                avoidTolls: false
              }}
              callback={(response) => {
                setDirectionsRequested(true);
                directionsCallback(response);
              }}
            />
          )}
          
          {useManualRoute && (
            <Polyline
              path={[pickupCoords, dropCoords]}
              options={{
                strokeColor: '#3a7bd5',
                strokeWeight: 5,
                strokeOpacity: 0.8,
                geodesic: true
              }}
            />
          )}
          
          {directions && (
            <DirectionsRenderer
              options={{
                directions: directions,
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: '#3a7bd5',
                  strokeWeight: 5
                }
              }}
            />
          )}
        </GoogleMap>
      </Box>
    </Paper>
  );
}
