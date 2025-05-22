import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  Rating, 
  Chip, 
  Divider,
  Button,
  IconButton
} from '@mui/material';
import { Phone as PhoneIcon, Message as MessageIcon } from '@mui/icons-material';

export default function DriverCard({ driver, eta }) {
  // If no driver is provided, show a placeholder
  if (!driver) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
          Finding your driver...
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ 
            width: 60, 
            height: 60, 
            borderRadius: '50%', 
            bgcolor: 'grey.200',
            animation: 'pulse 1.5s infinite'
          }} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar 
          src={driver.photo} 
          alt={driver.name}
          sx={{ width: 60, height: 60, mr: 2 }}
        />
        <Box>
          <Typography variant="h6">{driver.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating value={driver.rating} precision={0.5} readOnly size="small" />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {driver.rating} ({driver.totalRides} rides)
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">Vehicle</Typography>
          <Typography variant="body1">
            {driver.vehicle.model} • {driver.vehicle.color}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">Plate Number</Typography>
          <Typography variant="body1">{driver.vehicle.plateNumber}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Chip 
          label={`ETA: ${eta || driver.eta} min`} 
          color="primary" 
          variant="outlined" 
        />
        <Box>
          <IconButton color="primary" aria-label="call driver">
            <PhoneIcon />
          </IconButton>
          <IconButton color="primary" aria-label="message driver">
            <MessageIcon />
          </IconButton>
        </Box>
      </Box>

      <Button 
        variant="contained" 
        fullWidth 
        sx={{ mt: 1 }}
      >
        Share Trip Details
      </Button>
    </Paper>
  );
}
