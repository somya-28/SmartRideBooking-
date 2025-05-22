import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Typography, Paper, Grid, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemAvatar, ListItemText, Avatar,
  Rating, Divider, Card, CardContent, Chip
} from '@mui/material';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import TimerIcon from '@mui/icons-material/Timer';
import PaymentIcon from '@mui/icons-material/Payment';
import StarIcon from '@mui/icons-material/Star';

const API_BASE_URL = 'http://localhost:5000/api';

const vehicleTypeColors = {
  'mini': '#4caf50', // Green
  'sedan': '#2196f3', // Blue
  'premium': '#9c27b0', // Purple
  'suv': '#ff9800', // Orange
  'xl': '#f44336' // Red
};

const rideStatusColors = {
  'requested': '#ff9800', // Orange
  'accepted': '#2196f3', // Blue
  'driver_en_route': '#9c27b0', // Purple
  'arrived': '#4caf50', // Green
  'in_progress': '#9c27b0', // Purple
  'completed': '#4caf50', // Green
  'cancelled': '#f44336' // Red
};

const RideBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get Google Maps API state from context
  // Our custom algorithms handle all pathfinding and matching logic
  const { isLoaded, loadError } = useGoogleMaps();
  
  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 }); // Bangalore
  const [map, setMap] = useState(null);
  const [cityGraph, setCityGraph] = useState({ nodes: [], edges: [] });
  const [showGraph, setShowGraph] = useState(false);
  
  // Location selection state
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [selectionMode, setSelectionMode] = useState(null); // 'pickup' or 'dropoff'
  
  // Driver and ride state
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [activeSimulation, setActiveSimulation] = useState(false);
  const [matchedDrivers, setMatchedDrivers] = useState([]);
  const [rideRequest, setRideRequest] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [simulationState, setSimulationState] = useState(null);
  
  // UI state
  const [showDriversList, setShowDriversList] = useState(false);
  const [selectedDriverMarker, setSelectedDriverMarker] = useState(null);
  const [selectedRideMarker, setSelectedRideMarker] = useState(null);
  
  // Polling intervals
  const simulationInterval = useRef(null);
  const rideStatusInterval = useRef(null);
  
  useEffect(() => {
    // Fetch city graph when component mounts
    fetchCityGraph();
    
    return () => {
      // Clean up intervals on unmount
      if (simulationInterval.current) clearInterval(simulationInterval.current);
      if (rideStatusInterval.current) clearInterval(rideStatusInterval.current);
    };
  }, []);
  
  const fetchCityGraph = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/rides/city-graph`);
      const data = await response.json();
      
      setCityGraph(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching city graph:', err);
      setError('Failed to load city map data');
      setLoading(false);
    }
  };
  
  const startSimulation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/rides/simulate-drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setAvailableDrivers(data.available_drivers);
      setActiveSimulation(true);
      
      // Start polling for simulation state
      simulationInterval.current = setInterval(fetchSimulationState, 1000);
      
      setLoading(false);
    } catch (err) {
      console.error('Error starting simulation:', err);
      setError('Failed to start simulation');
      setLoading(false);
    }
  };
  
  const fetchSimulationState = async () => {
    if (!activeSimulation) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/rides/simulation-state`);
      const data = await response.json();
      
      setSimulationState(data);
      
      // Update available drivers from simulation state
      if (data.available_drivers) {
        setAvailableDrivers(data.available_drivers);
      }
    } catch (err) {
      console.error('Error fetching simulation state:', err);
    }
  };
  
  const handleMapClick = (event) => {
    if (!selectionMode) return;
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    if (selectionMode === 'pickup') {
      setPickupLocation({ lat, lng });
      setSelectionMode(null);
    } else if (selectionMode === 'dropoff') {
      setDropoffLocation({ lat, lng });
      setSelectionMode(null);
    }
  };
  
  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };
  
  const resetLocations = () => {
    setPickupLocation(null);
    setDropoffLocation(null);
    setRideRequest(null);
    setMatchedDrivers([]);
  };
  
  const requestRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      setError('Please select both pickup and dropoff locations');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/rides/request-ride`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_lat: pickupLocation.lat,
          pickup_lng: pickupLocation.lng,
          dropoff_lat: dropoffLocation.lat,
          dropoff_lng: dropoffLocation.lng,
          vehicle_type: 'sedan' // Default to sedan, can be made configurable
        })
      });
      
      const data = await response.json();
      
      setRideRequest(data);
      setMatchedDrivers(data.matched_drivers);
      setShowDriversList(true);
      setLoading(false);
    } catch (err) {
      console.error('Error requesting ride:', err);
      setError('Failed to request ride');
      setLoading(false);
    }
  };
  
  const confirmRide = async (driverId) => {
    if (!rideRequest) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/rides/confirm-ride`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: rideRequest.request_id,
          driver_id: driverId
        })
      });
      
      const data = await response.json();
      
      setActiveRide(data);
      setShowDriversList(false);
      
      // Start polling for ride status
      rideStatusInterval.current = setInterval(() => fetchRideStatus(data.ride_id), 2000);
      
      setLoading(false);
    } catch (err) {
      console.error('Error confirming ride:', err);
      setError('Failed to confirm ride');
      setLoading(false);
    }
  };
  
  const fetchRideStatus = async (rideId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/ride-status/${rideId}`);
      const data = await response.json();
      
      setActiveRide(prevRide => ({
        ...prevRide,
        status: data.status,
        driver: {
          ...prevRide.driver,
          location: data.driver.location
        },
        progress: data.progress
      }));
      
      // If ride is completed or cancelled, stop polling
      if (data.status === 'completed' || data.status === 'cancelled') {
        clearInterval(rideStatusInterval.current);
      }
    } catch (err) {
      console.error('Error fetching ride status:', err);
    }
  };
  
  const startRide = async () => {
    if (!activeRide) return;
    
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/rides/start-ride/${activeRide.ride_id}`, {
        method: 'POST'
      });
      
      // Update will happen via status polling
      setLoading(false);
    } catch (err) {
      console.error('Error starting ride:', err);
      setError('Failed to start ride');
      setLoading(false);
    }
  };
  
  const completeRide = async () => {
    if (!activeRide) return;
    
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/rides/complete-ride/${activeRide.ride_id}`, {
        method: 'POST'
      });
      
      // Update will happen via status polling
      setLoading(false);
    } catch (err) {
      console.error('Error completing ride:', err);
      setError('Failed to complete ride');
      setLoading(false);
    }
  };
  
  const cancelRide = async () => {
    if (!activeRide) return;
    
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/rides/cancel-ride/${activeRide.ride_id}`, {
        method: 'POST'
      });
      
      // Clear active ride and stop polling
      clearInterval(rideStatusInterval.current);
      setActiveRide(null);
      setLoading(false);
    } catch (err) {
      console.error('Error cancelling ride:', err);
      setError('Failed to cancel ride');
      setLoading(false);
    }
  };
  
  const renderCityGraph = () => {
    if (!showGraph || !cityGraph.edges) return [];
    
    return cityGraph.edges.map((edge, index) => {
      const fromNode = cityGraph.nodes.find(n => n.id === edge.from);
      const toNode = cityGraph.nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return null;
      
      return (
        <Polyline
          key={`edge-${index}`}
          path={[
            { lat: fromNode.lat, lng: fromNode.lng },
            { lat: toNode.lat, lng: toNode.lng }
          ]}
          options={{
            strokeColor: '#3f51b5',
            strokeOpacity: 0.5,
            strokeWeight: 2
          }}
        />
      );
    }).filter(Boolean);
  };
  
  const renderAvailableDrivers = () => {
    if (!availableDrivers.length) return [];
    
    return availableDrivers.map((driver, index) => (
      <Marker
        key={`driver-${driver.id}`}
        position={{
          lat: driver.location.lat,
          lng: driver.location.lng
        }}
        title={driver.name}
        icon={{
          url: `http://maps.google.com/mapfiles/ms/icons/${getDriverMarkerColor(driver)}.png`,
          anchor: { x: 12, y: 32 },
          scaledSize: { width: 25, height: 25 }
        }}
        onClick={() => setSelectedDriverMarker(driver)}
      />
    ));
  };
  
  const renderActiveRides = () => {
    if (!simulationState || !simulationState.active_rides) return [];
    
    return Object.values(simulationState.active_rides).map((ride) => (
      <Marker
        key={`ride-${ride.ride_id}`}
        position={{
          lat: ride.driver.location.lat,
          lng: ride.driver.location.lng
        }}
        title={`${ride.driver.name} (${ride.status})`}
        icon={{
          url: `http://maps.google.com/mapfiles/ms/icons/${getRideMarkerColor(ride.status)}.png`,
          anchor: { x: 12, y: 32 },
          scaledSize: { width: 25, height: 25 }
        }}
        onClick={() => setSelectedRideMarker(ride)}
      />
    ));
  };
  
  const getDriverMarkerColor = (driver) => {
    // Map vehicle types to colors
    const colorMap = {
      'mini': 'green',
      'sedan': 'blue',
      'premium': 'purple',
      'suv': 'orange',
      'xl': 'red'
    };
    
    return colorMap[driver.vehicle_type] || 'yellow';
  };
  
  const getRideMarkerColor = (status) => {
    // Map ride status to colors
    const colorMap = {
      'requested': 'yellow',
      'accepted': 'blue',
      'driver_en_route': 'purple',
      'arrived': 'green',
      'in_progress': 'purple',
      'completed': 'green',
      'cancelled': 'red'
    };
    
    return colorMap[status] || 'yellow';
  };
  
  const renderInfoWindows = () => {
    return (
      <>
        {selectedDriverMarker && (
          <InfoWindow
            position={{
              lat: selectedDriverMarker.location.lat,
              lng: selectedDriverMarker.location.lng
            }}
            onCloseClick={() => setSelectedDriverMarker(null)}
          >
            <div>
              <h4>{selectedDriverMarker.name}</h4>
              <p>Vehicle: {selectedDriverMarker.vehicle_type}</p>
              {selectedDriverMarker.rating && (
                <p>Rating: {selectedDriverMarker.rating}⭐</p>
              )}
            </div>
          </InfoWindow>
        )}
        
        {selectedRideMarker && (
          <InfoWindow
            position={{
              lat: selectedRideMarker.driver.location.lat,
              lng: selectedRideMarker.driver.location.lng
            }}
            onCloseClick={() => setSelectedRideMarker(null)}
          >
            <div>
              <h4>{selectedRideMarker.driver.name}</h4>
              <p>Status: {selectedRideMarker.status}</p>
              <p>Ride ID: {selectedRideMarker.ride_id}</p>
            </div>
          </InfoWindow>
        )}
      </>
    );
  };
  
  const renderDriversList = () => {
    return (
      <Dialog
        open={showDriversList}
        onClose={() => setShowDriversList(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Available Drivers</DialogTitle>
        <DialogContent>
          {matchedDrivers.length === 0 ? (
            <Typography>No drivers available at this time.</Typography>
          ) : (
            <List>
              {matchedDrivers.map((driver) => (
                <React.Fragment key={driver.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: vehicleTypeColors[driver.vehicle_type] || '#2196f3'
                        }}
                      >
                        <DirectionsCarIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {driver.name}
                          <Chip 
                            size="small" 
                            label={driver.vehicle_type} 
                            sx={{ ml: 1 }}
                            color="primary"
                          />
                        </Typography>
                      }
                      secondary={
                        <>
                          <Rating
                            value={driver.rating}
                            readOnly
                            precision={0.1}
                            size="small"
                            emptyIcon={<StarIcon fontSize="inherit" />}
                          />
                          <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                            <TimerIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }}/>
                            ETA: {driver.eta_minutes} mins
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                            <PaymentIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }}/>
                            Fare: ₹{driver.fare}
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ mt: 2 }}
                      onClick={() => confirmRide(driver.id)}
                    >
                      Book
                    </Button>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDriversList(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  const renderRideStatus = () => {
    if (!activeRide) return null;
    
    return (
      <Card sx={{ position: 'absolute', bottom: 20, right: 20, maxWidth: 360, zIndex: 1000 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ride Status
            <Chip 
              size="small" 
              label={activeRide.status}
              sx={{ 
                ml: 1,
                bgcolor: rideStatusColors[activeRide.status] || '#ff9800',
                color: 'white'
              }}
            />
          </Typography>
          
          <Typography variant="body2" gutterBottom>
            Driver: {activeRide.driver.name}
          </Typography>
          
          {activeRide.status === 'arrived' && (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 1 }}
              onClick={startRide}
            >
              Start Ride
            </Button>
          )}
          
          {activeRide.status === 'in_progress' && (
            <Button
              variant="contained"
              color="success"
              fullWidth
              sx={{ mt: 1 }}
              onClick={completeRide}
            >
              Complete Ride
            </Button>
          )}
          
          {['driver_en_route', 'arrived'].includes(activeRide.status) && (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              sx={{ mt: 1 }}
              onClick={cancelRide}
            >
              Cancel Ride
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Box sx={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* Map Container */}
      <div style={{ height: '100%', width: '100%' }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '100%'
            }}
            center={mapCenter}
            zoom={14}
            onClick={handleMapClick}
            onLoad={onMapLoad}
          >
            {/* City Graph Roads */}
            {renderCityGraph()}
            
            {/* Pickup Marker */}
            {pickupLocation && (
              <Marker
                position={pickupLocation}
                title="Pickup"
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                  anchor: { x: 16, y: 32 },
                  scaledSize: { width: 32, height: 32 }
                }}
              />
            )}
            
            {/* Dropoff Marker */}
            {dropoffLocation && (
              <Marker
                position={dropoffLocation}
                title="Dropoff"
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  anchor: { x: 16, y: 32 },
                  scaledSize: { width: 32, height: 32 }
                }}
              />
            )}
            
            {/* Available Drivers */}
            {renderAvailableDrivers()}
            
            {/* Active Rides */}
            {renderActiveRides()}
            
            {/* Info Windows */}
            {renderInfoWindows()}
          </GoogleMap>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
      </div>
      
      {/* Control Panel */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: 2,
          zIndex: 1000,
          maxWidth: 300
        }}
      >
        <Typography variant="h6" gutterBottom>
          SmartRide Booking
        </Typography>
        
        {!activeSimulation ? (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={startSimulation}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Start Simulation'}
          </Button>
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<LocationOnIcon />}
                  onClick={() => setSelectionMode('pickup')}
                  disabled={loading}
                >
                  Set Pickup Location
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<PersonPinCircleIcon />}
                  onClick={() => setSelectionMode('dropoff')}
                  disabled={loading}
                >
                  Set Dropoff Location
                </Button>
              </Grid>
              
              {pickupLocation && dropoffLocation && (
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<LocalTaxiIcon />}
                    onClick={requestRide}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Request Ride'}
                  </Button>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowGraph(!showGraph)}
                >
                  {showGraph ? 'Hide City Graph' : 'Show City Graph'}
                </Button>
              </Grid>
              
              {(pickupLocation || dropoffLocation) && (
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={resetLocations}
                  >
                    Reset Locations
                  </Button>
                </Grid>
              )}
            </Grid>
            
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </>
        )}
      </Paper>
      
      {/* Drivers List Dialog */}
      {renderDriversList()}
      
      {/* Active Ride Status Card */}
      {renderRideStatus()}
    </Box>
  );
};

export default RideBooking;
