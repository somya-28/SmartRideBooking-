import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Paper,
  Alert,
  CircularProgress,
  Modal,
  Divider,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

// Mock driver database (replace with real API calls)
const mockDrivers = {
  'DRIVER001': { password: 'driver123', phone: '+919876543210' },
  'DRIVER002': { password: 'driver456', phone: '+919876543211' }
};

export default function DriverLogin() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [driverId, setDriverId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [resetPhone, setResetPhone] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock authentication
    setTimeout(() => {
      if (mockDrivers[driverId] && mockDrivers[driverId].password === password) {
        navigate('/driver-dashboard');
      } else {
        setError('Invalid Driver ID or Password');
      }
      setLoading(false);
    }, 1000);
  };

  const handleForgotPassword = () => {
    if (!mockDrivers[driverId]) {
      setError('Driver ID not found');
      return;
    }
    setResetPhone(mockDrivers[driverId].phone);
    // Generate random 6-digit OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(newOTP);
    // In real app, send OTP via SMS API
    console.log(`OTP sent to ${mockDrivers[driverId].phone}: ${newOTP}`);
    setShowOTPModal(true);
  };

  const handleOTPSubmit = (e) => {
    e.preventDefault();
    if (otp === generatedOTP) {
      alert('OTP verified! Please set new password.');
      // In real app, redirect to password reset page
      setShowOTPModal(false);
    } else {
      setError('Invalid OTP');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navbar />
      
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        pt: { xs: '56px', sm: '64px' }
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={6}
            sx={{
              width: '100%',
              maxWidth: 400,
              p: 4,
              borderRadius: 4,
              bgcolor: 'background.paper',
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Driver Login
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Driver ID"
                variant="outlined"
                margin="normal"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                margin="normal"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  mb: 2,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #3a7bd5 30%, #00d2ff 90%)',
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'LOGIN'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'right', mb: 3 }}>
              <Link 
                onClick={handleForgotPassword}
                sx={{ 
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={{ mt: 2 }}>
              Not registered? Contact admin for credentials
            </Typography>
          </Paper>
        </motion.div>
      </Box>

      {/* OTP Modal */}
      <Modal
        open={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper
          sx={{
            width: '90%',
            maxWidth: 400,
            p: 4,
            borderRadius: 4,
            outline: 'none'
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            OTP Verification
          </Typography>
          <Typography sx={{ mb: 3 }}>
            Enter OTP sent to {resetPhone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2')}
          </Typography>

          <form onSubmit={handleOTPSubmit}>
            <TextField
              fullWidth
              label="Enter OTP"
              variant="outlined"
              margin="normal"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: theme.palette.primary.main,
              }}
            >
              VERIFY OTP
            </Button>
          </form>
        </Paper>
      </Modal>

      <Footer />
    </Box>
  );
}