import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
    console.log(`OTP sent to ${email}: ${otp}`); // Replace with actual SMS/email service
    return otp;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your registered email');
      return;
    }

    setLoading(true);
    try {
      generateOTP();
      setShowOTP(true);
      setSuccess(`OTP sent to ${email}`);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    
    if (otp !== generatedOTP) {
      setError('Invalid OTP');
      return;
    }
    
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    // In real app, update password in backend
    console.log('Password reset successful for:', email);
    navigate('/signin', { state: { success: 'Password reset successful! Please sign in.' } });
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
            {/* Logo */}
            <Box sx={{ mb: 3 }}>
              <img 
                src="/image-removebg-preview.png" 
                alt="Smart Ride Logo"
                style={{ 
                  height: '80px',
                  width: 'auto',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  objectFit: 'contain'
                }}
              />
            </Box>

            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              {showOTP ? 'Reset Password' : 'Forgot Password'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {!showOTP ? (
              <form onSubmit={handleSendOTP}>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Enter your registered email to receive a password reset OTP
                </Typography>

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  variant="outlined"
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  component={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'SEND OTP'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Enter the 6-digit OTP sent to your email
                </Typography>

                <TextField
                  fullWidth
                  label="OTP"
                  variant="outlined"
                  margin="normal"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                    mb: 2,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #3a7bd5 30%, #00d2ff 90%)',
                  }}
                >
                  RESET PASSWORD
                </Button>

                <Box sx={{ mt: 2 }}>
                  <Link 
                    component="button"
                    underline="none"
                    onClick={() => {
                      generateOTP();
                      setError('');
                      setSuccess('OTP resent successfully');
                    }}
                    sx={{ 
                      fontWeight: 500,
                      color: 'text.secondary'
                    }}
                  >
                    Resend OTP
                  </Link>
                </Box>
              </form>
            )}

            <Box sx={{ mt: 3 }}>
              <Link 
                component="button"
                underline="none"
                onClick={() => navigate('/signin')}
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                }}
              >
                Back to Sign In
              </Link>
            </Box>
          </Paper>
        </motion.div>
      </Box>

      <Footer />
    </Box>
  );
}