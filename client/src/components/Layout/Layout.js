import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  CssBaseline,
  Switch,
  Avatar,
} from "@mui/material";

import { useNavigate, Outlet } from "react-router-dom";
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material"; // Restored necessary imports

import { useAuth } from "../../contexts/AuthContext";
import { useTheme as useCustomTheme } from "../../context/ThemeContext";
import Sidebar from "./Sidebar"; // Make sure this path is correct
import { styled } from "@mui/material/styles";

const drawerWidth = "25vw";

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    marginTop: "70px", // Account for app bar height
    position: "relative",
    zIndex: 1,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflow: "auto", // Ensure proper scrolling
    width: "100%",
    height: "calc(100vh - 70px)",
    marginLeft: open ? `${drawerWidth}px` : 0, // Adjust margin based on sidebar state
    ...(open && {
      paddingLeft: `${drawerWidth + theme.spacing(3)}px`,
      width: `calc(100% - ${drawerWidth})`, // Updated to use new drawerWidth format
    }),
  }),
);

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backdropFilter: "blur(8px)",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  zIndex: theme.zIndex.drawer + 1,
  borderBottom: "1px solid",
  borderColor: theme.palette.divider,
  width: open ? `calc(100% - ${drawerWidth}px)` : "100%", // Adjust width based on sidebar state
  marginLeft: open ? `${drawerWidth}px` : 0, // Adjust margin based on sidebar state
  justifyContent: "flex-end",
}));

const UserInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  transition: "all 0.2s ease-in-out",
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "space-between",
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

const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 3,
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
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(0, 0, 0, 0.8)"
            : "rgba(255, 255, 255, 0.9)",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(0, 0, 0, 0.8)"
        : "rgba(255, 255, 255, 0.9)",
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
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(0, 0, 0, 0.8)"
        : "rgba(255, 255, 255, 0.9)",
    borderRadius: 20 / 2,
  },
}));

const Layout = () => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useCustomTheme();

  const [open, setOpen] = useState(true); // Ensure this state is managed correctly
  const toggleSidebar = () => setOpen((prev) => !prev); // Restored unused function
  const [anchorEl, setAnchorEl] = useState(null);

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

  return (
    <Box
      sx={{ display: "flex", height: "100vh", overflow: "hidden", margin: 0 }}
    >
      <CssBaseline />
      <StyledAppBar position="fixed" open={open} elevation={1}>
        <Toolbar
          sx={{ justifyContent: "space-between", minHeight: "70px", px: 3 }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Removed the menu button completely */}
          </Box>
          <UserInfo>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <StyledSwitch
                checked={darkMode}
                onChange={toggleDarkMode}
                icon={<LightModeIcon />}
                checkedIcon={<DarkModeIcon />}
              />

              <Box sx={{ height: "24px", width: "1px", bgcolor: "divider" }} />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                }}
                onClick={handleProfileMenuOpen}
              >
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
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    {user ? `${user.firstName} ${user.lastName}` : "User"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {isAdmin
                      ? "Administrator"
                      : isManager
                        ? "Manager"
                        : "Employee"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </UserInfo>
        </Toolbar>
      </StyledAppBar>

      {/* Sidebar fixed on the left */}
      <Box
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          bgcolor: "background.paper",
          boxShadow: 1,
          zIndex: 1000, // Ensure sidebar is above other content
        }}
      >
        <Sidebar />
      </Box>

      {/* Main content */}
      <Main
        open={open}
        sx={{
          flexGrow: 1,
          mt: 8,
          ml: `${drawerWidth}`, // Updated to use new drawerWidth format
          overflowY: "auto",
          overflowX: "hidden",
          bgcolor: "background.paper",
          padding: { xs: 2, md: 2 },
          width: `calc(100% - ${drawerWidth})`, // Updated to use new drawerWidth format
          maxWidth: 1400,
          mx: "auto",
          "& > *": {
            minWidth: 0,
          },
        }}
      >
        <DrawerHeader />
        <Box
          sx={{
            padding: { xs: 1, md: 3 },
            width: "100%",
            maxWidth: 1400,
            mx: "auto",
            boxSizing: "border-box",
            overflowX: "hidden",
            "& > .MuiPaper-root": {
              borderRadius: 4,
              boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
              maxWidth: "100%",
            },
          }}
        >
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
};

export default Layout;
