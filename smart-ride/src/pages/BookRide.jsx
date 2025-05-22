import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert
} from "@mui/material";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { useGoogleMaps } from "../context/GoogleMapsContext";
import { useNavigate } from "react-router-dom";

// API key is now managed by GoogleMapsContext

export default function BookRide() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Get Google Maps API state from context
  const { isLoaded, loadError } = useGoogleMaps();
  
  // Initialize places autocomplete only after API is loaded
  const pickupAutocomplete = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: "in" } },
    debounce: 300,
    enabled: isLoaded && !loadError,
  });
  
  const dropAutocomplete = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: "in" } },
    debounce: 300,
    enabled: isLoaded && !loadError,
  });
  const navigate = useNavigate();

  const handleSelect = async (description, type) => {
    setLoading(true);
    setError("");
    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);

      if (type === "pickup") {
        setPickup(description);
        setPickupCoords({ lat, lng });
        pickupAutocomplete.clearSuggestions();
      } else {
        setDrop(description);
        setDropCoords({ lat, lng });
        dropAutocomplete.clearSuggestions();
      }
    } catch (err) {
      setError("Failed to get location details. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFindRide = () => {
    if (!pickupCoords || !dropCoords) {
      setError("Please select valid pickup and drop locations.");
      return;
    }
    
    navigate("/ride-summary", {
      state: {
        pickup,
        drop,
        pickupCoords,
        dropCoords,
      },
    });
  };

  // Show loading state while API loads
  if (!isLoaded) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: 4, mt: 6, textAlign: 'center' }}>
          <Typography>Loading Google Maps API...</Typography>
        </Paper>
      </Container>
    );
  }

  // Show error if API failed to load
  if (loadError) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: 4, mt: 6 }}>
          <Alert severity="error">
            Error loading Google Maps API: {loadError.message}.
            Please try refreshing the page.
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ p: 4, mt: 6 }}>
        <Typography variant="h5" gutterBottom textAlign="center" color="primary">
          Book Your Smart Ride
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth
          label="Pickup Location"
          margin="normal"
          value={pickup}
          onChange={(e) => {
            setPickup(e.target.value);
            pickupAutocomplete.setValue(e.target.value);
          }}
        />
        {pickupAutocomplete.suggestions.status === "OK" && (
          <List sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider' }}>
            {pickupAutocomplete.suggestions.data.map((suggestion) => (
              <ListItem disablePadding key={suggestion.place_id}>
                <ListItemButton onClick={() => handleSelect(suggestion.description, "pickup")}>
                  <ListItemText primary={suggestion.description} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        <TextField
          fullWidth
          label="Drop Location"
          margin="normal"
          value={drop}
          onChange={(e) => {
            setDrop(e.target.value);
            dropAutocomplete.setValue(e.target.value);
          }}
        />
        {dropAutocomplete.suggestions.status === "OK" && (
          <List sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider' }}>
            {dropAutocomplete.suggestions.data.map((suggestion) => (
              <ListItem disablePadding key={suggestion.place_id}>
                <ListItemButton onClick={() => handleSelect(suggestion.description, "drop")}>
                  <ListItemText primary={suggestion.description} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        <Box mt={3} textAlign="center">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleFindRide}
            disabled={!pickupCoords || !dropCoords || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Searching...' : 'Find Ride'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}