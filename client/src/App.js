import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AttendanceProvider } from './contexts/AttendanceContext';
import { CustomThemeProvider } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Reports from './pages/Reports';
import TimeOff from './pages/TimeOff';
import Schedule from './pages/Schedule';
import Users from './pages/Users';
import Attendance from './pages/Attendance';
import ShiftSwaps from './pages/ShiftSwaps';
import Layout from './components/Layout/Layout';
import './App.css';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <CustomThemeProvider>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/timeoff" element={<TimeOff />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/shift-swaps" element={<ShiftSwaps />} />
                </Route>
              </Routes>
            </Router>
          </LocalizationProvider>
        </CustomThemeProvider>
      </AttendanceProvider>
    </AuthProvider>
  );
}

export default App;
