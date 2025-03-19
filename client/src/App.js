import React, { useEffect } from "react";
import { Box } from "@mui/material";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";

// Context Providers
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DepartmentProvider } from "./context/DepartmentContext";
import { AttendanceProvider } from "./contexts/AttendanceContext";
import { CustomThemeProvider } from "./context/ThemeContext";

// Layout Components
import Layout from "./components/Layout/Layout";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Attendance from "./pages/Attendance";
import Schedule from "./pages/Schedule";
import TimeOff from "./pages/TimeOff";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import ShiftSwaps from "./pages/ShiftSwaps";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading indicator while checking auth status
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && !user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const AppContent = () => {
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    console.log("App mounted, checking auth status");
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="timeoff" element={<TimeOff />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="shift-swaps" element={<ShiftSwaps />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <DepartmentProvider>
        <AttendanceProvider>
          <ThemeProvider theme={theme}>
            <CustomThemeProvider>
              <Box sx={{ display: "flex", minHeight: "100vh" }}>
                <CssBaseline />
                <Router>
                  <AppContent />
                </Router>
              </Box>
            </CustomThemeProvider>
          </ThemeProvider>
        </AttendanceProvider>
      </DepartmentProvider>
    </AuthProvider>
  );
}

export default App;
