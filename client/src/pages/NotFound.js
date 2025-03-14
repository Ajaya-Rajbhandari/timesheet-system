import React from "react";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 8,
          textAlign: "center",
          borderRadius: 2,
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: "error.main", mb: 2 }} />

        <Typography variant="h4" component="h1" gutterBottom>
          404 - Page Not Found
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>

        <Box mt={4}>
          <Button
            component={Link}
            to="/"
            variant="contained"
            color="primary"
            size="large"
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;
