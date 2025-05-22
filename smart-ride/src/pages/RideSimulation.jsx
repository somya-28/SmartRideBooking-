import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import RideBooking from '../components/RideBooking';

const RideSimulation = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data from localStorage
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem('userInfo');
        if (userData) {
          setUserInfo(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography variant="h5">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
      {userInfo ? (
        <RideBooking />
      ) : (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            m: 4, 
            textAlign: 'center',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}
        >
          <Typography variant="h5" color="error">
            Please log in to use the ride simulation
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default RideSimulation;
