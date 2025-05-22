import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { countries } from 'countries-list';

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const countryCodes = Object.entries(countries).map(([code, country]) => ({
    code: `+${country.phone}`,
    name: country.name
  })).sort((a, b) => a.name.localeCompare(b.name));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('All fields are required');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const generateOTP = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate OTP');
      }
      
      // Store the OTP for verification later
      setGeneratedOTP(data.otp);
      
      // Set a visible message with the OTP
      setOtpMessage(`Your OTP is: ${data.otp}`);
      
      console.log(`OTP sent: ${data.otp}`);
      return data.otp;
    } catch (err) {
      console.error('Error generating OTP:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      await generateOTP();
      setShowOTP(true);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // First verify the OTP with the backend
      const otpResponse = await fetch('http://127.0.0.1:5000/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp
        }),
      });
      
      const otpData = await otpResponse.json();
      
      if (!otpResponse.ok) {
        throw new Error(otpData.message || 'OTP verification failed');
      }
      
      // OTP is valid, now register the user with the backend
      const response = await fetch('http://127.0.0.1:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: `${formData.countryCode}${formData.phone}`
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      console.log('Registration successful:', data);
      navigate('/signin', { state: { success: 'Registration successful! Please sign in.' } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
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
            <Box sx={{ mb: 3 }}>
              <img 
                src="/image-removebg-preview.png" 
                alt="Smart Ride Logo"
                style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
              />
            </Box>

            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              {showOTP ? 'Verify OTP' : 'Create Your Account'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!showOTP ? (
              <form onSubmit={handleSubmit}>
                <TextField fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} required sx={{ mb: 2 }} />
                <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <FormControl sx={{ width: '40%' }}>
                    <InputLabel>Code</InputLabel>
                    <Select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      label="Code"
                      required
                    >
                      {countryCodes.map((country, index) => (
                        <MenuItem key={index} value={country.code}>
                          {country.name} ({country.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    sx={{ width: '60%' }}
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Box>

                <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required sx={{ mb: 2 }} />
                <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required sx={{ mb: 3 }} />

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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'SIGN UP'}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOTP}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  We've sent a 6-digit OTP to your phone/email ending with {formData.phone?.slice(-3)}
                </Typography>
                
                {otpMessage && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {otpMessage}
                  </Alert>
                )}

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
                    mb: 2,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #3a7bd5 30%, #00d2ff 90%)',
                  }}
                >
                  VERIFY OTP
                </Button>

                <Box sx={{ mt: 2 }}>
                  <Link
                    component="button"
                    underline="none"
                    onClick={() => {
                      generateOTP();
                      setOtp('');
                      setError('');
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

            <Divider sx={{ my: 2 }} />
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/signin" underline="hover">
                Sign In
              </Link>
            </Typography>
          </Paper>
        </motion.div>
      </Box>

      <Footer />
    </Box>
  );
}
