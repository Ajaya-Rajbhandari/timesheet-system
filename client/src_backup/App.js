// import React, { useEffect } from "react";
import React, { useEffect } from "react";
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
import { DepartmentProvider } from './context/DepartmentContext';
import { AttendanceProvider } from "./contexts/AttendanceContext";
import { CustomThemeProvider } from "./context/ThemeContext";

// Layout Components
import Layout from "./components/Layout/Layout";
// Remove AppLayout import since we're using Layout directly

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
// Remove Register import here

// Theme is imported from theme.js

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

  // Check auth status when app loads
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
        <Route index element={<Navigate to="/dashboard" replace />} />
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


// Replace the entire App function with:
// Add this import with other context providers

function App() {
  return (
    <AuthProvider>
      <DepartmentProvider>
        <AttendanceProvider>
          <ThemeProvider theme={theme}>
            <CustomThemeProvider>
              <CssBaseline />
              <Router>
                <AppContent />
              </Router>
            </CustomThemeProvider>
          </ThemeProvider>
        </AttendanceProvider>
      </DepartmentProvider>
    </AuthProvider>
  );
}

export default App;
