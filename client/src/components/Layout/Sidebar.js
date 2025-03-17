import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import { useAuth } from '../../contexts/AuthContext';
  import { 
    List, 
    ListItem, 
    ListItemButton,
    ListItemIcon, 
    ListItemText, 
    Typography, 
    Box, 
    Divider 
  } from '@mui/material';
  
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isManager } = useAuth();

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Attendance", icon: <AccessTimeIcon />, path: "/attendance" },
    { text: "Schedule", icon: <EventIcon />, path: "/schedule" },
    { text: "Time Off", icon: <EventIcon />, path: "/timeoff" },
    {
      text: "Reports",
      icon: <AssessmentIcon />,
      path: "/reports",
      adminOnly: true,
    },
  ];

  if (isAdmin || isManager) {
    menuItems.push({
      text: "Users",
      icon: <PeopleIcon />,
      path: "/users",
      adminOnly: true,
    });
  }


  // Update ListItem to use ListItemButton
  return (
      <Box>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" color="primary">
            Timesheet System
          </Typography>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            (!item.adminOnly || (item.adminOnly && (isAdmin || isManager))) && (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    margin: '4px 8px',
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )
          ))}
        </List>
      </Box>
  );
};

export default Sidebar;
