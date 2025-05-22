import React from 'react';
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';

const Pricing = ({ distance, baseFare = 50, ratePerKm = 12, surgeMultiplier = 1 }) => {
  const totalFare = Math.round((baseFare + (distance * ratePerKm)) * surgeMultiplier);

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Fare Breakdown
      </Typography>
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Base Fare:</Typography>
        <Typography>₹{baseFare}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Distance ({distance} km × ₹{ratePerKm}):</Typography>
        <Typography>₹{(distance * ratePerKm).toFixed(2)}</Typography>
      </Box>
      
      {surgeMultiplier > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>
            <Chip 
              label={`Surge ×${surgeMultiplier.toFixed(2)}`} 
              color="warning" 
              size="small"
              sx={{ mr: 1 }}
            />
          </Typography>
          <Typography>₹{(baseFare + (distance * ratePerKm)) * (surgeMultiplier - 1)}</Typography>
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1">Total Fare:</Typography>
        <Typography variant="h6" color="success.main">₹{totalFare}</Typography>
      </Box>
    </Paper>
  );
};

export default Pricing;
