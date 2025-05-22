import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  Grid
} from "@mui/material";
import { LocalTaxi as TaxiIcon, Star as StarIcon } from "@mui/icons-material";

import FixedRouteMap from '../components/FixedRouteMap';
import RideTypes from '../components/RideTypes';
import PaymentOptions from '../components/PaymentOptions';
import Pricing from '../components/Pricing';

import { useGoogleMaps } from '../context/GoogleMapsContext';

export default function RideSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const distanceCache = useRef(new Map());
  const { isLoaded, loadError } = useGoogleMaps();

  const { pickup, drop, pickupCoords, dropCoords } = location.state || {};
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [fare, setFare] = useState(null);
  const [baseFare, setBaseFare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1);
  const [error, setError] = useState("");
  
  // Step-based booking flow
  const [activeStep, setActiveStep] = useState(0);
  const [selectedRideType, setSelectedRideType] = useState('mini');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [findingDriver, setFindingDriver] = useState(false);
  const [matchedDriver, setMatchedDriver] = useState(null);
  const [matchError, setMatchError] = useState(null);
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  
  const steps = ['Choose Ride', 'Payment', 'Confirm'];

  useEffect(() => {
    if (!pickup || !drop) {
      navigate("/", { replace: true });
      return;
    }
    
    // Set a fallback timer to calculate route manually if Google Maps fails
    const fallbackTimer = setTimeout(() => {
      if (loading && !distance) {
        console.log('Fallback route calculation activated');
        // Calculate straight-line distance as fallback
        if (pickupCoords && dropCoords) {
          const fallbackDistance = calculateHaversineDistance(
            pickupCoords.lat, pickupCoords.lng,
            dropCoords.lat, dropCoords.lng
          );
          setDistance(fallbackDistance);
          setDuration(Math.ceil(fallbackDistance * 3)); // Rough estimate: 3 minutes per km
          setLoading(false);
        }
      }
    }, 7000);
    
    return () => clearTimeout(fallbackTimer);
  }, [pickup, drop, navigate, loading, distance, pickupCoords, dropCoords]);

  const calculateFare = (distance) => {
    const baseAmount = 50;
    const ratePerKm = 12;
    let totalFare = baseAmount + distance * ratePerKm;
    
    if (distance > 10) totalFare *= 0.9;
    else if (distance < 3) totalFare += 20;
    
    setBaseFare(Math.round(totalFare));
    return Math.round(totalFare * surgeMultiplier);
  };

  const checkSurgeConditions = () => {
    const currentHour = new Date().getHours();
    let multiplier = 1;

    if (currentHour >= 18 && currentHour <= 21) multiplier = 1.5;
    else if (currentHour >= 22 || currentHour <= 5) multiplier = 1.75;

    const isRaining = Math.random() < 0.2;
    if (isRaining) multiplier += 0.5;

    setSurgeMultiplier(multiplier);
  };
  
  // Fallback distance calculation using Haversine formula
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
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
  };

  // This function will be called when the route is loaded from the RideMap component
  const handleRouteLoad = useCallback((routeData) => {
    console.log('Route loaded:', routeData); // Debug log
    setDistance(routeData.distance);
    setDuration(routeData.duration);
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (distance !== null) {
      setFare(calculateFare(distance));
    }
  }, [distance, surgeMultiplier]);
  
  useEffect(() => {
    if (!pickup || !drop) {
      setError("Missing ride details");
      setLoading(false);
      return;
    }
    
    if (pickupCoords && dropCoords) {
      checkSurgeConditions();
      // We don't need to fetch distance here anymore as it will be handled by the RideMap component
      
      // Start a timer to show error if route calculation takes too long
      const timeoutId = setTimeout(() => {
        if (loading && !distance) {
          console.log('Route calculation taking too long, but continuing...');
          // We'll let the fallback timer handle the actual calculation
        }
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [pickupCoords, dropCoords, loading, distance]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const findDriver = async () => {
    setFindingDriver(true);
    setMatchError(null);
    
    try {
      // Calculate ride price based on selected ride type
      let finalFare = fare;
      if (selectedRideType === 'sedan') finalFare = Math.round(fare * 1.2);
      else if (selectedRideType === 'premium') finalFare = Math.round(fare * 1.8);
      else if (selectedRideType === 'xl') finalFare = Math.round(fare * 1.5);
      
      const response = await fetch('http://localhost:5000/api/match/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_location: pickupCoords,
          drop_location: dropCoords,
          ride_type: selectedRideType,
          distance: distance,
          estimated_fare: finalFare
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to find a driver');
      }
      
      setMatchedDriver({
        ...data.driver,
        eta: data.ride.eta,
        fare: data.ride.fare || finalFare
      });
      setShowDriverDialog(true);
    } catch (error) {
      console.error('Error finding driver:', error);
      setMatchError(error.message || 'Failed to find a driver. Please try again.');
    } finally {
      setFindingDriver(false);
    }
  };
  
  const handleConfirm = () => {
    findDriver();
  };
  
  const handleAcceptDriver = () => {
    setShowDriverDialog(false);
    
    // Calculate final fare based on matched driver data or fallback to our calculation
    let finalFare = matchedDriver.fare || fare;
    if (!matchedDriver.fare) {
      if (selectedRideType === 'sedan') finalFare = Math.round(fare * 1.2);
      else if (selectedRideType === 'premium') finalFare = Math.round(fare * 1.8);
      else if (selectedRideType === 'xl') finalFare = Math.round(fare * 1.5);
    }
    
    navigate("/success", {
      state: {
        pickup,
        drop,
        distance,
        fare: finalFare,
        rideType: selectedRideType,
        paymentMethod: selectedPayment,
        driverName: matchedDriver.name,
        driverId: matchedDriver.id,
        driverPhone: matchedDriver.phone,
        driverPhoto: matchedDriver.photo,
        driverRating: matchedDriver.rating,
        vehicleDetails: matchedDriver.vehicle,
        eta: matchedDriver.eta || Math.round(distance * 3)
      }
    });
  };
  
  const handleRejectDriver = () => {
    setShowDriverDialog(false);
    setMatchedDriver(null);
  };

  if (!pickup || !drop) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: 4, mt: 6, textAlign: "center" }}>
          <Alert severity="error" sx={{ mb: 2 }}>No ride data found!</Alert>
          <Button onClick={() => navigate("/")} variant="contained">
            Go to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Choose Ride
        return (
          <>
            <FixedRouteMap 
              pickupCoords={pickupCoords} 
              dropCoords={dropCoords} 
              distance={distance}
              duration={duration}
            />
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1">Pickup:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {duration ? `${duration} min` : 'Calculating...'}
                </Typography>
              </Box>
              <Typography variant="body1" gutterBottom>{pickup}</Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 1 }}>
                <Typography variant="subtitle1">Drop:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {distance ? `${distance} km` : 'Calculating...'}
                </Typography>
              </Box>
              <Typography variant="body1" gutterBottom>{drop}</Typography>
            </Box>
            
            {baseFare && <RideTypes 
              selectedRide={selectedRideType} 
              onSelectRide={setSelectedRideType} 
              baseFare={baseFare}
            />}
          </>
        );
      case 1: // Payment
        return (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Trip Details</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Distance</Typography>
                <Typography variant="body1">{distance} km</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Duration</Typography>
                <Typography variant="body1">{duration} min</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Base Fare</Typography>
                <Typography variant="body1">₹{baseFare}</Typography>
              </Box>
              {surgeMultiplier > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Surge Price (×{surgeMultiplier.toFixed(2)})</Typography>
                  <Typography variant="body1">₹{Math.round(baseFare * surgeMultiplier - baseFare)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" fontWeight="bold">Total Fare</Typography>
                <Typography variant="body1" fontWeight="bold">₹{fare}</Typography>
              </Box>
            </Box>
            
            <PaymentOptions onSelectPayment={setSelectedPayment} />
          </>
        );
      case 2: // Confirm
        return (
          <>
            <FixedRouteMap 
              pickupCoords={pickupCoords} 
              dropCoords={dropCoords} 
              distance={distance}
              duration={duration}
            />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Ride Summary</Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Pickup</Typography>
                <Typography variant="body2" color="text.secondary">{duration} min</Typography>
              </Box>
              <Typography variant="body1" gutterBottom>{pickup}</Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Drop</Typography>
                <Typography variant="body2" color="text.secondary">{distance} km</Typography>
              </Box>
              <Typography variant="body1" gutterBottom>{drop}</Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Ride Type</Typography>
                <Typography variant="body1">
                  {selectedRideType === 'mini' && 'Smart Mini'}
                  {selectedRideType === 'sedan' && 'Smart Sedan'}
                  {selectedRideType === 'premium' && 'Smart Premium'}
                  {selectedRideType === 'xl' && 'Smart XL'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Payment Method</Typography>
                <Typography variant="body1">
                  {selectedPayment === 'cash' && 'Cash'}
                  {selectedPayment === 'card' && 'Credit/Debit Card'}
                  {selectedPayment === 'upi' && 'UPI'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" fontWeight="bold">Total Fare</Typography>
                <Typography variant="body1" fontWeight="bold">₹{fare}</Typography>
              </Box>
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={4} sx={{ p: 4, mt: 6 }}>
        <Typography variant="h5" gutterBottom color="primary" textAlign="center">
          {activeStep === 0 ? 'Choose Your Ride' : 
           activeStep === 1 ? 'Payment Options' : 'Confirm Booking'}
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {matchError && <Alert severity="error" sx={{ mb: 2 }}>{matchError}</Alert>}

        {loading && activeStep === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body1" mt={2}>Calculating your route...</Typography>
          </Box>
        ) : (
          renderStepContent(activeStep)
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? () => navigate('/book') : handleBack}
            disabled={loading || findingDriver}
          >
            {activeStep === 0 ? 'Back to Search' : 'Back'}
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              disabled={loading || !distance || !fare || findingDriver}
              startIcon={findingDriver && <CircularProgress size={20} color="inherit" />}
            >
              {findingDriver ? 'Finding Driver...' : 'Confirm Booking'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={loading || !distance || !fare}
            >
              Next
            </Button>
          )}
        </Box>
        
        {/* Driver Match Dialog */}
        <Dialog
          open={showDriverDialog}
          onClose={handleRejectDriver}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Driver Found!</DialogTitle>
          <DialogContent>
            {matchedDriver && (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={4}>
                    <Avatar
                      src={matchedDriver.photo}
                      alt={matchedDriver.name}
                      sx={{ width: 80, height: 80, margin: '0 auto' }}
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="h6">{matchedDriver.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StarIcon sx={{ color: 'gold', mr: 0.5 }} fontSize="small" />
                      <Typography variant="body2">{matchedDriver.rating} Rating</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {matchedDriver.vehicle?.model} • {matchedDriver.vehicle?.color}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {matchedDriver.vehicle?.plate_number}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="body1">
                    Your driver is {matchedDriver.distance_to_pickup} km away and will arrive in approximately {matchedDriver.eta} minutes.
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Ride Distance</Typography>
                  <Typography variant="body1">{distance} km</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Ride Type</Typography>
                  <Typography variant="body1">
                    {selectedRideType === 'mini' && 'Smart Mini'}
                    {selectedRideType === 'sedan' && 'Smart Sedan'}
                    {selectedRideType === 'premium' && 'Smart Premium'}
                    {selectedRideType === 'xl' && 'Smart XL'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" fontWeight="bold">Total Fare</Typography>
                  <Typography variant="body1" fontWeight="bold">₹{matchedDriver.fare || fare}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRejectDriver}>Cancel</Button>
            <Button onClick={handleAcceptDriver} variant="contained" color="primary">
              Accept Driver
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
