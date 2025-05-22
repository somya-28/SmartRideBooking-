import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlagIcon from '@mui/icons-material/Flag';

const StaticMap = ({ pickupCoords, dropCoords, distance, duration }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>Route Map</Typography>
      <Box sx={{
        position: 'relative',
        height: '300px',
        width: '100%',
        backgroundColor: '#e8eaf6',
        borderRadius: '8px',
        border: '1px solid #3a7bd5',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 2
      }}>
        {/* Pickup Location */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocationOnIcon sx={{ color: 'green', mr: 1, fontSize: 24 }} />
          <Box>
            <Typography variant="body2" fontWeight="bold">Pickup Location</Typography>
            <Typography variant="caption" color="text.secondary">
              {pickupCoords ? `${pickupCoords.lat.toFixed(4)}, ${pickupCoords.lng.toFixed(4)}` : 'Loading...'}
            </Typography>
          </Box>
        </Box>
        
        {/* Route Visualization */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', my: 2, position: 'relative' }}>
          {/* Starting point */}
          <Box sx={{ 
            width: 16, 
            height: 16, 
            borderRadius: '50%', 
            backgroundColor: 'green',
            position: 'absolute',
            top: 0,
            left: '10%',
            zIndex: 2
          }} />
          
          {/* Route line */}
          <Box sx={{ 
            width: '80%',
            height: '4px',
            background: 'linear-gradient(90deg, #4CAF50 0%, #2196F3 50%, #F44336 100%)',
            my: 2,
            borderRadius: '4px',
            position: 'relative'
          }} />
          
          {/* Ending point */}
          <Box sx={{ 
            width: 16, 
            height: 16, 
            borderRadius: '50%', 
            backgroundColor: 'red',
            position: 'absolute',
            bottom: 0,
            right: '10%',
            zIndex: 2
          }} />
        </Box>
        
        {/* Dropoff Location */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <FlagIcon sx={{ color: 'red', mr: 1, fontSize: 24 }} />
          <Box>
            <Typography variant="body2" fontWeight="bold">Dropoff Location</Typography>
            <Typography variant="caption" color="text.secondary">
              {dropCoords ? `${dropCoords.lat.toFixed(4)}, ${dropCoords.lng.toFixed(4)}` : 'Loading...'}
            </Typography>
          </Box>
        </Box>
        
        {/* Route Details */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Distance</Typography>
            <Typography variant="body2" fontWeight="bold">{distance ? `${distance} km` : '---'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Estimated Time</Typography>
            <Typography variant="body2" fontWeight="bold">{duration ? `${duration} min` : '---'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Traffic</Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">Low</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default StaticMap;
