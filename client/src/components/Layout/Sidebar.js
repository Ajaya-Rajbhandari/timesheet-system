import React from "react";
import { styled } from "@mui/material/styles"; // Import styled for modern UI

import { useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventIcon from "@mui/icons-material/Event";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import { useAuth } from "../../contexts/AuthContext";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from "@mui/material";

const StyledSidebar = styled(Box)(({ theme }) => ({
  width: 280,
  position: "fixed",
  left: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.background.default,
  borderRadius: "8px",
  boxShadow: theme.shadows[3],
  padding: theme.spacing(2),
  height: "100vh", // Ensure full height
  zIndex: 1000, // Ensure sidebar is above other content
  display: "flex",
  flexDirection: "column",
}));

const StyledHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const StyledList = styled(List)(({ theme }) => ({
  padding: 0,
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  margin: "4px 8px",
  borderRadius: "8px",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  borderRadius: "8px",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
  "&.Mui-selected": {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.main,
    },
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: 40,
}));

const Sidebar = ({ isOpen, toggleSidebar }) => {
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

  return (
    <StyledSidebar>
      <StyledHeader onClick={toggleSidebar}>
        <Typography variant="h6" color="primary">
          Timesheet System
        </Typography>
      </StyledHeader>
      <Divider />
      <StyledList sx={{ flexGrow: 1 }}>
        {menuItems.map(
          (item) =>
            (!item.adminOnly || (item.adminOnly && (isAdmin || isManager))) && (
              <StyledListItem key={item.text}>
                <StyledListItemButton
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                >
                  <StyledListItemIcon>{item.icon}</StyledListItemIcon>
                  <ListItemText primary={item.text} />
                </StyledListItemButton>
              </StyledListItem>
            ),
        )}
      </StyledList>
    </StyledSidebar>
  );
};

export default Sidebar;
