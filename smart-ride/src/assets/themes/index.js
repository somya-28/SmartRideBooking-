// Create a theme.js file
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', 
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export default theme;