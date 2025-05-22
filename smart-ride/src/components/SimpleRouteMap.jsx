import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Divider, Chip, Tooltip, Fade } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlagIcon from '@mui/icons-material/Flag';
import TimerIcon from '@mui/icons-material/Timer';
import StraightenIcon from '@mui/icons-material/Straighten';
import SpeedIcon from '@mui/icons-material/Speed';
import TrafficIcon from '@mui/icons-material/Traffic';
import MyLocationIcon from '@mui/icons-material/MyLocation';

const SimpleRouteMap = ({ pickupCoords, dropCoords, distance, duration, pickup, drop }) => {
  // Use fallback values for pickup/drop locations if not provided
  const pickupLocation = pickup || 'Pickup Location';
  const dropLocation = drop || 'Dropoff Location';
  const [carPosition, setCarPosition] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [animateRoute, setAnimateRoute] = useState(false);
  
  // Simulate car movement along the route
  useEffect(() => {
    if (distance && duration) {
      // Start animation after a delay
      const timer = setTimeout(() => setAnimateRoute(true), 500);
      
      // Animate car along the route
      const interval = setInterval(() => {
        setCarPosition(prev => {
          const newPos = prev + 1;
          return newPos > 100 ? 0 : newPos;
        });
      }, 100);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [distance, duration]);
  
  // Generate a random traffic condition
  const trafficCondition = () => {
    const random = Math.random();
    if (random < 0.6) return { text: 'Low', color: 'success.main' };
    if (random < 0.9) return { text: 'Moderate', color: 'warning.main' };
    return { text: 'Heavy', color: 'error.main' };
  };
  
  const traffic = trafficCondition();
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>Route Map</Typography>
      <Box sx={{
        position: 'relative',
        height: '300px',
        width: '100%',
        backgroundColor: '#f0f7ff',
        backgroundImage: 'linear-gradient(to bottom, rgba(240, 247, 255, 0.8), rgba(213, 230, 255, 0.9))',
        borderRadius: '8px',
        border: '1px solid #3a7bd5',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'  
      }}>
        {/* Route Information - Enhanced with Chips */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Chip 
            icon={<StraightenIcon />} 
            label={distance ? `${distance} km` : '---'}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip 
            icon={<TimerIcon />} 
            label={duration ? `${duration} min` : '---'}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip 
            icon={<TrafficIcon />} 
            label={traffic.text}
            color={traffic.text === 'Low' ? 'success' : traffic.text === 'Moderate' ? 'warning' : 'error'}
            variant="outlined"
            size="small"
          />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Enhanced Visual Route */}
        <Box sx={{ flex: 1, position: 'relative', mb: 2 }}>
          {/* Background city elements */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: '5%', 
            left: 0, 
            right: 0, 
            height: '30%',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 320\'%3E%3Cpath fill=\'%233a7bd5\' fill-opacity=\'0.1\' d=\'M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,170.7C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\'%3E%3C/path%3E%3C/svg%3E")',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom',
            zIndex: 1
          }} />
          
          {/* Starting point */}
          <Tooltip 
            title={pickupLocation} 
            placement="top"
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
            arrow
          >
            <Box sx={{ 
              position: 'absolute',
              top: '15%',
              left: '10%',
              display: 'flex',
              alignItems: 'center',
              zIndex: 3,
              cursor: 'pointer'
            }}>
              <Box sx={{ 
                width: 30, 
                height: 30, 
                borderRadius: '50%', 
                backgroundColor: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 5px rgba(76, 175, 80, 0.2), 0 4px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 0 8px rgba(76, 175, 80, 0.2), 0 6px 10px rgba(0,0,0,0.3)'
                }
              }}>
                <LocationOnIcon sx={{ fontSize: 18, color: 'white' }} />
              </Box>
              <Typography variant="body2" fontWeight="bold" sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.8)', px: 1, py: 0.5, borderRadius: 1 }}>Start</Typography>
            </Box>
          </Tooltip>
          
          {/* Car icon showing movement */}
          <Box sx={{ 
            position: 'absolute',
            top: '50%',
            left: `${carPosition}%`,
            transform: 'translateY(-50%) rotate(5deg)',
            transition: 'all 0.2s ease-out',
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: animateRoute ? 1 : 0
          }}>
            <Box 
              sx={{ 
                p: 0.8,
                borderRadius: '50%',
                bgcolor: 'white',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                mb: 1,
                transform: 'rotate(-5deg)'
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <DirectionsCarIcon sx={{ fontSize: 28, color: '#1565C0' }} />
            </Box>
            
            {showTooltip && (
              <Box sx={{ 
                position: 'absolute',
                top: -40,
                bgcolor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                p: 1,
                borderRadius: 1,
                whiteSpace: 'nowrap'
              }}>
                <Typography variant="caption" display="block">ETA: {Math.floor(duration * (1 - carPosition/100))} min</Typography>
                <Typography variant="caption" display="block">{Math.floor(distance * (1 - carPosition/100))} km remaining</Typography>
              </Box>
            )}
          </Box>
          
          {/* End point */}
          <Tooltip 
            title={dropLocation}
            placement="top"
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
            arrow
          >
            <Box sx={{ 
              position: 'absolute',
              bottom: '20%',
              right: '10%',
              display: 'flex',
              alignItems: 'center',
              zIndex: 3,
              cursor: 'pointer'
            }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mr: 1, bgcolor: 'rgba(255,255,255,0.8)', px: 1, py: 0.5, borderRadius: 1 }}>End</Typography>
              <Box sx={{ 
                width: 30, 
                height: 30, 
                borderRadius: '50%', 
                backgroundColor: '#F44336',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 5px rgba(244, 67, 54, 0.2), 0 4px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 0 8px rgba(244, 67, 54, 0.2), 0 6px 10px rgba(0,0,0,0.3)'
                }
              }}>
                <FlagIcon sx={{ fontSize: 16, color: 'white' }} />
              </Box>
            </Box>
          </Tooltip>
          
          {/* Route path - animated curved line */}
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
            {/* Route shadow */}
            <path 
              d="M 80,80 Q 180,20 320,180" 
              stroke="rgba(0,0,0,0.1)" 
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Main route path */}
            <path 
              d="M 80,80 Q 180,20 320,180" 
              stroke="url(#routeGradient)" 
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={animateRoute ? "1000" : "1000"}
              strokeDashoffset={animateRoute ? "0" : "1000"}
              style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
            />
            
            {/* Small dots along the path */}
            <circle cx="80" cy="80" r="3" fill="#4CAF50" />
            <circle cx="140" cy="50" r="3" fill="white" />
            <circle cx="200" cy="40" r="3" fill="white" />
            <circle cx="260" cy="80" r="3" fill="white" />
            <circle cx="320" cy="180" r="3" fill="#F44336" />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4CAF50" />
                <stop offset="50%" stopColor="#2196F3" />
                <stop offset="100%" stopColor="#F44336" />
              </linearGradient>
            </defs>
          </svg>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Location details - Enhanced with click to copy */}
        <Box sx={{ mt: 1 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              mb: 2, 
              p: 1, 
              borderRadius: 1, 
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.08)' }
            }} 
            onClick={() => navigator.clipboard.writeText(pickupCoords ? `${pickupCoords.lat}, ${pickupCoords.lng}` : '')}
          >
            <MyLocationIcon sx={{ color: '#4CAF50', mr: 1, mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>PICKUP LOCATION</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>(click to copy)</span>
              </Typography>
              <Typography variant="body2" noWrap sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pickupCoords ? `${pickupCoords.lat.toFixed(5)}, ${pickupCoords.lng.toFixed(5)}` : 'Loading...'}
              </Typography>
            </Box>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              p: 1, 
              borderRadius: 1, 
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.08)' }
            }}
            onClick={() => navigator.clipboard.writeText(dropCoords ? `${dropCoords.lat}, ${dropCoords.lng}` : '')}
          >
            <MyLocationIcon sx={{ color: '#F44336', mr: 1, mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>DROPOFF LOCATION</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>(click to copy)</span>
              </Typography>
              <Typography variant="body2" noWrap sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dropCoords ? `${dropCoords.lat.toFixed(5)}, ${dropCoords.lng.toFixed(5)}` : 'Loading...'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      
      <style jsx="true">{`
        @keyframes pulse {
          0% { transform: scale(1) translateY(-50%); }
          50% { transform: scale(1.1) translateY(-50%); }
          100% { transform: scale(1) translateY(-50%); }
        }
        
        @keyframes dashAnimation {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </Paper>
  );
};

export default SimpleRouteMap;
