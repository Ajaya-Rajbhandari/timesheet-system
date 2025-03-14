import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Submitting login form with:", { email });
      const user = await login(email, password);
      console.log("Login successful, user:", user);
      console.log("Navigating to dashboard...");
      navigate("/");
    } catch (err) {
      console.error("Login component error:", err);
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Timesheet System
          </Typography>

          <Typography component="h2" variant="h5" align="center" sx={{ mb: 3 }}>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={handleChange}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
              >
                {"Forgot password?"}
              </Link>
            </Box>
          </Box>
        </Paper>

        {/* Test Credentials Card */}
        <Card sx={{ mt: 3, width: "100%" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Credentials
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Admin User:
            </Typography>
            <Typography variant="body2" gutterBottom>
              Email: admin@test.com
              <br />
              Password: admin123
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" gutterBottom>
              Manager User:
            </Typography>
            <Typography variant="body2" gutterBottom>
              Email: manager@test.com
              <br />
              Password: manager123
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" gutterBottom>
              Employee User:
            </Typography>
            <Typography variant="body2" gutterBottom>
              Email: employee@test.com
              <br />
              Password: employee123
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
