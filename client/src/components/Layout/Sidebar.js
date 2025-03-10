import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isManager } = useAuth();
  const { darkMode } = useTheme();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Attendance', icon: <AccessTimeIcon />, path: '/attendance' },
    { text: 'Schedule', icon: <EventIcon />, path: '/schedule' },
    { text: 'Shift Swaps', icon: <SwapHorizIcon />, path: '/shift-swaps' },
    { text: 'Time Off', icon: <EventIcon />, path: '/timeoff' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', adminOnly: true }
  ];

  if (isAdmin || isManager) {
    menuItems.push({ text: 'Users', icon: <PeopleIcon />, path: '/users', adminOnly: true });
  }

  return (
    <Box>
      <Toolbar sx={{ 
        justifyContent: 'center',
        background: darkMode 
          ? 'linear-gradient(135deg, rgba(37, 37, 37, 0.95), rgba(30, 30, 30, 0.95))'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.95))',
      }}>
        <Typography 
          variant="h6" 
          component="div"
          sx={{
            background: darkMode
              ? 'linear-gradient(45deg, #64B5F6 30%, #81D4FA 90%)'
              : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
          }}
        >
          Timesheet System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          (!item.adminOnly || (item.adminOnly && isAdmin)) && (
            <ListItem 
              button 
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  background: darkMode 
                    ? 'linear-gradient(90deg, rgba(25, 118, 210, 0.2), transparent)'
                    : 'linear-gradient(90deg, rgba(33, 150, 243, 0.1), transparent)',
                  borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
                  '&:hover': {
                    background: darkMode 
                      ? 'linear-gradient(90deg, rgba(25, 118, 210, 0.3), transparent)'
                      : 'linear-gradient(90deg, rgba(33, 150, 243, 0.2), transparent)',
                  },
                },
                '&:hover': {
                  background: darkMode 
                    ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.05), transparent)'
                    : 'linear-gradient(90deg, rgba(33, 150, 243, 0.05), transparent)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
                minWidth: 40,
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  },
                }}
              />
            </ListItem>
          )
        ))}
      </List>
    </Box>
  );
};

export default Sidebar; 