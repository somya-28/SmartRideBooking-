import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";  // Add this import
import { Box, Typography, Button, Link, Paper, Stack } from "@mui/material";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navbar />
      
      {/* Add padding top equal to navbar height */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        pt: { xs: '56px', sm: '64px' } // Responsive padding for mobile/desktop navbars
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
            {/* Logo with responsive sizing */}
            <Box sx={{ 
              mb: 3,
              display: 'flex',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <img 
                src="/image-removebg-preview.png" 
                alt="Smart Ride Logo"
                style={{ 
                  height: { xs: '80px', md: '100px' },
                  width: 'auto',
                  maxWidth: '100%',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  objectFit: 'contain'
                }}
              />
            </Box>

            {/* Tagline */}
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 3,
                fontStyle: 'italic',
                color: 'text.secondary',
                px: 3
              }}
            >
              AI powered Routing, fair pricing & quick pickups
            </Typography>

            {/* App Name */}
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 4,
                background: 'linear-gradient(45deg, #3a7bd5 30%, #00d2ff 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SMART RIDE
            </Typography>

            {/* SIGN IN Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #3a7bd5 30%, #00d2ff 90%)',
              }}
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/signin")}
            >
              SIGN IN
            </Button>

            {/* Sign Up Link */}
            <Stack 
              direction="row" 
              spacing={1} 
              justifyContent="center"
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                already have an account?
              </Typography>
              <Link
                href="#"
                underline="none"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                }}
                onClick={() => navigate("/signup")}
              >
                SIGN UP
              </Link>
            </Stack>
            
            {/* Driver Links */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                Want to drive with us?
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/driver-signup")}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Become a Driver
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate("/driver-login")}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Driver Login
                </Button>
              </Stack>
            </Box>
          </Paper>
        </motion.div>
      </Box>
      <Footer/>
    </Box>
  );
}