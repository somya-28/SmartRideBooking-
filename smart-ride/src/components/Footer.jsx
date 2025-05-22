import { Box, Typography, Divider, Link, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

export default function Footer() {
  const theme = useTheme();

  return (
    <Box 
      component="footer"
      sx={{
        width : '100%' ,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        color: '#000000', 
        py: 3,
        px: 2,
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        position : 'relative',
        bottom : 0 ,
        left : 0 ,
        right : 0 
      }}
    >
      <Box sx={{ 
        maxWidth: 1200, 
        margin: '0 auto',
        px: { xs: 2, sm: 4 },
        textAlign: 'center'
      }}>
        {/* Logo - Inverted to black to match navbar */}
        <Box sx={{ mb: 2 }}>
          <img 
            src="/image-removebg-preview.png" 
            alt="Smart Ride Logo"
            style={{ 
              height: '40px',
              width: 'auto',
              filter: 'brightness(0)',
              opacity: 0.8
            }}
          />
        </Box>

        <Divider sx={{ 
          my: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }}/>

        {/* Links */}
        <Box 
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            mb: 2,
            flexWrap: 'wrap'
          }}
        >
          {['Terms', 'Privacy', 'Contact', 'Careers'].map((item) => (
            <Link
              key={item}
              href="#"
              underline="none"
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              sx={{
                color: '#000000',
                fontWeight: 500,
                fontSize: '0.9rem'
              }}
            >
              {item}
            </Link>
          ))}
        </Box>

        {/* Copyright */}
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          © {new Date().getFullYear()} Smart Ride. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}