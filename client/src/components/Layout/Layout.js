import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  CssBaseline,
  useMediaQuery,
  useTheme,
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material";
import { useNavigate, Outlet } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventIcon from "@mui/icons-material/Event";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useTheme as useCustomTheme } from "../../context/ThemeContext";
import Sidebar from "./Sidebar";
import { styled } from "@mui/material/styles";

const drawerWidth = 260;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

// Custom styled components
const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          "#fff",
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette.mode === "dark" ? "#003892" : "#001e3c",
    width: 32,
    height: 32,
    "&:before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        "#fff",
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
    borderRadius: 20 / 2,
  },
}));

const UserInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  color: theme.palette.text.primary,
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  transition: theme.transitions.create(["background-color", "box-shadow"], {
    duration: theme.transitions.duration.short,
  }),
  "&:hover": {
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  },
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    background: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "&.Mui-selected": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
    "& .MuiListItemIcon-root": {
      color: theme.palette.primary.contrastText,
    },
  },
}));

const Layout = () => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const { getStatusText, getStatusColor } = useAttendance();
  const navigate = useNavigate();
  const theme = useTheme();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    // Sync drawer state with media query changes
    setOpen(!isMobile);
    // Close mobile drawer when switching to desktop
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
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
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <StyledAppBar position="fixed" open={open}>
        <Toolbar sx={{ justifyContent: "space-between" }}>


          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => {
              if (!isMobile) setOpen(!open);
              else setMobileOpen(!mobileOpen);
            }}
            sx={{ mr: 2, ...(open && !isMobile && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>

          <UserInfo>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "primary.main",
                border: "2px solid",
                borderColor: "background.paper",
              }}
              src={
                user?.profileImage
                  ? `${
                      process.env.REACT_APP_API_URL || ""
                    }/api/upload/profile/${user.profileImage}`
                  : undefined
              }
            >
              {user?.firstName?.charAt(0) || "U"}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {isAdmin
                    ? "Administrator"
                    : isManager
                      ? "Manager"
                      : "Employee"}
                </Typography>
                <Chip
                  label={getStatusText()}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    bgcolor: getStatusColor(),
                    color: "white",
                  }}
                />
              </Box>
            </Box>
          </UserInfo>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <StyledSwitch
              checked={darkMode}
              onChange={toggleDarkMode}
              icon={<LightModeIcon />}
              checkedIcon={<DarkModeIcon />}
            />

            <IconButton
              size="large"
              edge="end"
              aria-label="account menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </StyledAppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate("/profile")}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >


        <StyledDrawer
          variant="permanent"
          open={open}
          sx={{
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <DrawerHeader>
            <IconButton onClick={() => setOpen(false)}>
              {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </DrawerHeader>
          <Divider />
        </StyledDrawer>
        
        <StyledDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
          }}
        >
          <Sidebar />
        </StyledDrawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          <Sidebar />
        </Drawer>
      </Box>

      <Main open={open} sx={{












        width: { sm: `calc(100% - ${drawerWidth}px)` },
        marginTop: "64px",
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #121212 0%, #1E1E1E 100%)"
            : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
      }}>
        <DrawerHeader />












        <Toolbar />
        <Outlet />
      </Main>
    </Box>
  );
};

export default Layout;
