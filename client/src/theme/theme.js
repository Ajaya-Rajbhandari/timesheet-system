import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  shape: {
    borderRadius: 12,
  },
  palette: {
    primary: {
      main: "#3b82f6",
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe", // Modern blue
      light: "#60a5fa",
      dark: "#1d4ed8",
    },
    secondary: {
      main: "#6366f1",
      50: "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe", // Modern pink
      light: "#f472b6",
      dark: "#db2777",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: "2.5rem",
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: "2rem",
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.75rem",
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.05)",
    "0 4px 6px -1px rgba(0,0,0,0.1)",
    "0 10px 15px -3px rgba(0,0,0,0.1)",
    "0 20px 25px -5px rgba(0,0,0,0.1)",
  ],
  transitions: {
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          padding: "8px 16px",
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": {
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow:
            "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          "&:hover": {
            boxShadow:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          color: "#1e293b",
          boxShadow:
            "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        },
      },
    },
  },
});

export default theme;
