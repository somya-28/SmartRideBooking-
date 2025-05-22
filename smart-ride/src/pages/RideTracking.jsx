import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Message as MessageIcon,
  Share as ShareIcon,
  Cancel as CancelIcon,
  Star as StarIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";
import RideMap from "../components/RideMap";
import DriverCard from "../components/DriverCard";

// Mock driver data
const mockDrivers = [
  {
    id: 1,
    name: "John Davis",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 4.8,
    totalRides: 1243,
    vehicle: {
      model: "Honda City",
      color: "White",
      plateNumber: "KA 01 MJ 7890"
    }
  },
  {
    id: 2,
    name: "Sarah Wilson",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 4.9,
    totalRides: 856,
    vehicle: {
      model: "Toyota Corolla",
      color: "Silver",
      plateNumber: "MH 04 AB 1234"
    }
  },
  {
    id: 3,
    name: "Michael Chen",
    photo: "https://randomuser.me/api/portraits/men/67.jpg",
    rating: 4.7,
    totalRides: 2105,
    vehicle: {
      model: "Hyundai Verna",
      color: "Black",
      plateNumber: "DL 05 CD 5678"
    }
  }
];

const rideStatuses = [
  "Driver assigned",
  "Driver on the way",
  "Driver arrived",
  "Trip started",
  "Trip completed"
];

export default function RideTracking() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [rideStatus, setRideStatus] = useState(0);
  const [remainingTime, setRemainingTime] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");

  const {
    pickup,
    drop,
    distance,
    fare,
    rideType = "mini",
    paymentMethod = "cash",
    eta = 10
  } = state || {};

  // Select a random driver from our mock data
  const [driver] = useState(() => {
    const randomIndex = Math.floor(Math.random() * mockDrivers.length);
    return mockDrivers[randomIndex];
  });

  // Simulate ride progress
  useEffect(() => {
    if (rideStatus < rideStatuses.length - 1) {
      const timer = setTimeout(() => {
        setRideStatus(prev => prev + 1);
      }, 20000); // Change status every 20 seconds
      return () => clearTimeout(timer);
    }
  }, [rideStatus]);

  // Simulate countdown timer
  useEffect(() => {
    if (rideStatus < 3) { // Before trip started
      setRemainingTime(eta - (rideStatus * 3));
      
      if (remainingTime > 0) {
        const timer = setInterval(() => {
          setRemainingTime(prev => Math.max(0, prev - 1));
        }, 60000); // Update every minute
        return () => clearInterval(timer);
      }
    }
  }, [rideStatus, eta, remainingTime]);

  const handleCancelRide = () => {
    setShowCancelDialog(false);
    navigate("/book", { state: { cancelMessage: "Your ride has been cancelled." } });
  };

  const handleSubmitRating = () => {
    setShowRatingDialog(false);
    navigate("/", { state: { ratingMessage: "Thank you for your feedback!" } });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={4} sx={{ p: 0, mt: 6, overflow: 'hidden', borderRadius: 2 }}>
        {/* Map Section */}
        <Box sx={{ height: '300px', position: 'relative' }}>
          {pickupCoords && dropCoords ? (
            <RideMap pickupCoords={pickupCoords} dropCoords={dropCoords} />
          ) : (
            <Box 
              sx={{ 
                height: '100%', 
                bgcolor: 'grey.200', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Map preview not available
              </Typography>
            </Box>
          )}
          
          {/* Status Overlay */}
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              bgcolor: 'rgba(255,255,255,0.9)',
              p: 2
            }}
          >
            <Typography variant="h6">{rideStatuses[rideStatus]}</Typography>
            <LinearProgress 
              variant="determinate" 
              value={(rideStatus / (rideStatuses.length - 1)) * 100} 
              sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
            />
            {rideStatus < 3 && remainingTime > 0 && (
              <Typography variant="body2">
                {remainingTime} minutes remaining
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Driver Details */}
        <Box sx={{ p: 3 }}>
          <DriverCard driver={driver} eta={remainingTime} />
          
          {/* Ride Details */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Ride Details</Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Pickup</Typography>
            </Box>
            <Typography variant="body1" gutterBottom>{pickup}</Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Drop</Typography>
            </Box>
            <Typography variant="body1" gutterBottom>{drop}</Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Distance</Typography>
              <Typography variant="body1">{distance} km</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Ride Type</Typography>
              <Typography variant="body1">
                {rideType === 'mini' && 'Smart Mini'}
                {rideType === 'sedan' && 'Smart Sedan'}
                {rideType === 'premium' && 'Smart Premium'}
                {rideType === 'xl' && 'Smart XL'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Payment Method</Typography>
              <Typography variant="body1">
                {paymentMethod === 'cash' && 'Cash'}
                {paymentMethod === 'card' && 'Credit/Debit Card'}
                {paymentMethod === 'upi' && 'UPI'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" fontWeight="bold">Total Fare</Typography>
              <Typography variant="body1" fontWeight="bold">₹{fare}</Typography>
            </Box>
          </Paper>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {rideStatus < 3 ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Ride
              </Button>
            ) : rideStatus === 4 ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<StarIcon />}
                onClick={() => setShowRatingDialog(true)}
              >
                Rate Your Ride
              </Button>
            ) : (
              <Button
                variant="outlined"
                disabled
              >
                In Progress
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
            >
              Share Trip
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Ride</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your ride? A cancellation fee may apply.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>No, Keep Ride</Button>
          <Button onClick={handleCancelRide} color="error">Yes, Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onClose={() => setShowRatingDialog(false)}>
        <DialogTitle>Rate Your Ride</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            <Typography variant="body1" gutterBottom>How was your ride with {driver.name}?</Typography>
            <Rating
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              size="large"
            />
          </Box>
          <TextField
            label="Additional Feedback (Optional)"
            multiline
            rows={4}
            fullWidth
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRatingDialog(false)}>Skip</Button>
          <Button onClick={handleSubmitRating} color="primary" variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
