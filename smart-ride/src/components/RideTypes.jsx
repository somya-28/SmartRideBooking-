import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Radio, 
  RadioGroup, 
  FormControlLabel 
} from '@mui/material';
import { styled } from '@mui/material/styles';

const RideOption = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
  transition: 'all 0.2s',
  '&:hover': {
    boxShadow: theme.shadows[3],
    transform: 'translateY(-2px)'
  }
}));

const rideTypes = [
  {
    id: 'mini',
    name: 'Smart Mini',
    description: 'Affordable rides for 3 people',
    price: 1,
    eta: '3-5',
    icon: '🚗'
  },
  {
    id: 'sedan',
    name: 'Smart Sedan',
    description: 'Comfortable rides for 4 people',
    price: 1.2,
    eta: '4-6',
    icon: '🚙'
  },
  {
    id: 'premium',
    name: 'Smart Premium',
    description: 'Luxury rides for special occasions',
    price: 1.8,
    eta: '6-8',
    icon: '🏎️'
  },
  {
    id: 'xl',
    name: 'Smart XL',
    description: 'Spacious rides for 6 people',
    price: 1.5,
    eta: '5-7',
    icon: '🚐'
  }
];

export default function RideTypes({ selectedRide, onSelectRide, baseFare }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Choose your ride
      </Typography>
      
      <RadioGroup
        value={selectedRide}
        onChange={(e) => onSelectRide(e.target.value)}
      >
        <Grid container spacing={2}>
          {rideTypes.map((ride) => (
            <Grid item xs={12} key={ride.id}>
              <FormControlLabel
                value={ride.id}
                control={<Radio sx={{ display: 'none' }} />}
                label=""
                sx={{ m: 0, width: '100%' }}
              />
              <RideOption 
                selected={selectedRide === ride.id}
                onClick={() => onSelectRide(ride.id)}
              >
                <Box sx={{ fontSize: '2rem', mr: 2 }}>{ride.icon}</Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {ride.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ride.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ETA: {ride.eta} min
                  </Typography>
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  ₹{Math.round(baseFare * ride.price)}
                </Typography>
              </RideOption>
            </Grid>
          ))}
        </Grid>
      </RadioGroup>
    </Box>
  );
}
