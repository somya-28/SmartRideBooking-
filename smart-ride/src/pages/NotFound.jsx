import React from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", mt: 8 }}>
      <Typography variant="h3" color="error" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" gutterBottom>
        The page you are looking for does not exist.
      </Typography>
      <Box mt={4}>
        <Button variant="contained" color="primary" onClick={() => navigate("/")}>
          Go to Home
        </Button>
      </Box>
    </Container>
  );
}
