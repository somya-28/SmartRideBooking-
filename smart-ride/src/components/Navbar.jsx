import { AppBar, Toolbar, Button, Box, useScrollTrigger, Slide } from '@mui/material';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const navItems = [
    { label: 'Home Page', path: '/' },
    { label: 'Driver Login', path: '/driver-login' },
    { label: 'Sign In', path: '/signin' }
  ];

  return (
    <Slide appear={false} direction="down" in={visible}>
      <AppBar 
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          py: 1,
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo with Home link */}
          <Box component={RouterLink} to="/" sx={{ textDecoration: 'none' }}>
            <img 
              src="/image-removebg-preview.png" 
              alt="Smart Ride Logo"
              style={{
                height: '40px',
                width: 'auto',
                transition: 'all 0.3s ease',
              }}
            />
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={RouterLink}
                to={item.path}
                sx={{
                  color: '#000000',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  fontSize: '0.9rem',
                  '&:hover': {
                    color: '#3a7bd5',
                    backgroundColor: 'transparent'
                  }
                }}
              >
                <motion.span whileHover={{ scale: 1.05 }}>
                  {item.label}
                </motion.span>
              </Button>
            ))}
          </Box>

          {/* Mobile Menu Button */}
          <Button 
            color="inherit" 
            sx={{ display: { md: 'none' }, color: '#000000' }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon fontSize="large" />
          </Button>
        </Toolbar>
      </AppBar>
    </Slide>
  );
}