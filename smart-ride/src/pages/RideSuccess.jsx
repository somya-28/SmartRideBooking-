import React, { useEffect } from "react";
import { Container, Paper, Typography, Box, Button, CircularProgress } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function RideSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    pickup,
    drop,
    distance,
    fare,
    rideType,
    paymentMethod,
    driverName = "Driver",
    eta = 5
  } = state || {};

  // Automatically redirect to ride tracking after 3 seconds
  useEffect(() => {
    if (state) {
      const timer = setTimeout(() => {
        navigate("/ride-tracking", { state });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [state, navigate]);

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ p: 4, mt: 6, textAlign: "center" }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" color="success.main">
            ✅
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            Ride Booked Successfully!
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={30} />
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Redirecting to ride tracking...
          </Typography>
          
          {pickup && (
            <Typography variant="body1" gutterBottom>
              From: <strong>{pickup}</strong>
            </Typography>
          )}
          
          {drop && (
            <Typography variant="body1" gutterBottom>
              To: <strong>{drop}</strong>
            </Typography>
          )}
          
          {distance && fare && (
            <Typography variant="body1" gutterBottom>
              {distance} km • ₹{fare}
            </Typography>
          )}
          
          <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
            Your driver <strong>{driverName}</strong> is on the way. 🚗
          </Typography>
          
          <Typography variant="body1" gutterBottom>
            Estimated arrival: <strong>{eta} minutes</strong>
          </Typography>
          
          <Typography variant="body1" sx={{ mt: 2 }}>
            Thank you for choosing Smart Ride!
          </Typography>

          <Box mt={4}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/ride-tracking", { state })}
              sx={{ mr: 2 }}
              component={motion.button}
              whileHover={{ scale: 1.05 }}
            >
              Track Ride Now
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate("/")}
              component={motion.button}
              whileHover={{ scale: 1.05 }}
            >
              Go to Home
            </Button>
          </Box>
        </motion.div>
      </Paper>
    </Container>
  );
}