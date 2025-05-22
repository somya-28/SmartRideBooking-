import React, { useState, useEffect } from 'react';
import {
  Container, 
  Box, 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider, 
  Avatar, 
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Badge,
  CircularProgress
} from '@mui/material';
import { 
  DirectionsCar as CarIcon,
  History as HistoryIcon,
  AccountCircle as ProfileIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  ArrowForward as ArrowIcon,
  LocationOn as LocationIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Mock ride history data
const mockRideHistory = [
  {
    id: 'ride-001',
    date: '2025-05-21',
    time: '14:30',
    pickup: 'Home, 123 Main St',
    drop: 'Office, 456 Work Ave',
    fare: 250,
    status: 'completed',
    driver: 'John D.',
    rating: 5
  },
  {
    id: 'ride-002',
    date: '2025-05-18',
    time: '09:15',
    pickup: 'Office, 456 Work Ave',
    drop: 'Shopping Mall, 789 Market St',
    fare: 180,
    status: 'completed',
    driver: 'Sarah W.',
    rating: 4
  },
  {
    id: 'ride-003',
    date: '2025-05-15',
    time: '20:45',
    pickup: 'Restaurant, 321 Food St',
    drop: 'Home, 123 Main St',
    fare: 320,
    status: 'completed',
    driver: 'Michael C.',
    rating: 5
  }
];

// Mock user profile data
const mockUserProfile = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  phone: '+91 98765 43210',
  profilePic: 'https://randomuser.me/api/portraits/men/32.jpg',
  savedAddresses: [
    { id: 'addr-1', name: 'Home', address: '123 Main St, Apartment 4B, Bangalore' },
    { id: 'addr-2', name: 'Work', address: '456 Corporate Park, Building C, Bangalore' }
  ],
  paymentMethods: [
    { id: 'pay-1', type: 'card', name: 'HDFC Credit Card', last4: '4567' },
    { id: 'pay-2', type: 'upi', name: 'PhonePe', upiId: 'alex@phonepe' }
  ]
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [rideHistory, setRideHistory] = useState(mockRideHistory);
  
  // Load user data from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserProfile({
          name: userData.name || 'User',
          email: userData.email || '',
          phone: userData.phone || '',
          profilePic: null, // No default profile picture
          savedAddresses: mockUserProfile.savedAddresses,
          paymentMethods: mockUserProfile.paymentMethods
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserProfile(mockUserProfile);
      }
    } else {
      // If no user is logged in, redirect to sign in page
      navigate('/signin');
    }
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBookRide = () => {
    navigate('/book');
  };

  const handleSimulation = () => {
    navigate('/simulation');
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f5f5'
    }}>
      <Navbar />
      
      <Container maxWidth="md" sx={{ flex: 1, py: 4, mt: { xs: '56px', sm: '64px' } }}>
        {!userProfile ? (
          // Loading state
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Header Section */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
                color: 'white'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={userProfile.profilePic}
                  alt={userProfile.name.charAt(0).toUpperCase()}
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    mr: 2, 
                    border: '2px solid white',
                    bgcolor: 'primary.dark',
                    fontSize: '1.5rem'
                  }}
                >
                  {userProfile.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5">Welcome, {userProfile.name}</Typography>
                  <Typography variant="body2">
                    {userProfile.email} {userProfile.phone && `• ${userProfile.phone}`}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <IconButton color="inherit">
                    <Badge badgeContent={2} color="error">
                      <NotificationIcon />
                    </Badge>
                  </IconButton>
                </Box>
              </Box>
          
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CarIcon />}
                fullWidth
                onClick={handleBookRide}
                sx={{ py: 1.5, fontSize: '1rem', mb: 2 }}
              >
                Book a Ride
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<MapIcon />}
                fullWidth
                onClick={handleSimulation}
                sx={{ py: 1.5, fontSize: '1rem', bgcolor: 'rgba(255,255,255,0.9)', color: '#3a7bd5', '&:hover': { bgcolor: 'white' } }}
              >
                Try Ride Simulation
              </Button>
            </Paper>
        
            {/* Tabs Section */}
            <Paper elevation={2} sx={{ borderRadius: 2 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab icon={<HistoryIcon />} label="Rides" />
                <Tab icon={<ProfileIcon />} label="Profile" />
                <Tab icon={<SettingsIcon />} label="Settings" />
              </Tabs>
          
          {/* Rides Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>Recent Rides</Typography>
            
            {rideHistory.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CarIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  No ride history found
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={handleBookRide}
                >
                  Book Your First Ride
                </Button>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {rideHistory.map((ride, index) => (
                  <React.Fragment key={ride.id}>
                    <ListItem 
                      alignItems="flex-start" 
                      sx={{ px: 0 }}
                      secondaryAction={
                        <IconButton edge="end">
                          <ArrowIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ mt: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <CarIcon />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" component="span">
                              {ride.date} • {ride.time}
                            </Typography>
                            <Typography variant="subtitle1" component="span" color="primary">
                              ₹{ride.fare}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="span">
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <LocationIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                              <Typography variant="body2" component="span" color="text.secondary">
                                {ride.pickup}
                              </Typography>
                            </Box>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <LocationIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                              <Typography variant="body2" component="span" color="text.secondary">
                                {ride.drop}
                              </Typography>
                            </Box>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <Typography variant="body2" component="span" color="text.secondary">
                                Driver: {ride.driver}
                              </Typography>
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                                <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 0.5 }}>
                                  {ride.rating}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < rideHistory.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
            
            {rideHistory.length > 0 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button variant="outlined">View All Rides</Button>
              </Box>
            )}
          </TabPanel>
          
          {/* Profile Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>Your Profile</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Saved Addresses
                    </Typography>
                    
                    {userProfile.savedAddresses.map((address) => (
                      <Box key={address.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {address.name}
                          </Typography>
                          <Button size="small">Edit</Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {address.address}
                        </Typography>
                      </Box>
                    ))}
                    
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 1 }}
                      startIcon={<LocationIcon />}
                    >
                      Add New Address
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Payment Methods
                    </Typography>
                    
                    {userProfile.paymentMethods.map((payment) => (
                      <Box key={payment.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {payment.name}
                          </Typography>
                          <Button size="small">Edit</Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {payment.type === 'card' ? `**** **** **** ${payment.last4}` : payment.upiId}
                        </Typography>
                      </Box>
                    ))}
                    
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 1 }}
                      startIcon={<PaymentIcon />}
                    >
                      Add Payment Method
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Settings Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>Settings</Typography>
            
            <List>
              <ListItem button>
                <ListItemIcon>
                  <ProfileIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={<span>Edit Profile</span>} 
                  disableTypography 
                />
              </ListItem>
              <Divider />
              
              <ListItem button>
                <ListItemIcon>
                  <NotificationIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={<span>Notification Preferences</span>} 
                  disableTypography 
                />
              </ListItem>
              <Divider />
              
              <ListItem button>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={<span>App Settings</span>} 
                  disableTypography 
                />
              </ListItem>
              <Divider />
              
              <ListItem button>
                <ListItemIcon>
                  <PaymentIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={<span>Payment Settings</span>} 
                  disableTypography 
                />
              </ListItem>
              <Divider />
              
              <ListItem button sx={{ color: 'error.main' }}>
                <ListItemText 
                  primary={<span>Log Out</span>} 
                  disableTypography 
                />
              </ListItem>
            </List>
          </TabPanel>
            </Paper>
          </>
        )}
      </Container>
      
      <Footer />
    </Box>
  );
}
