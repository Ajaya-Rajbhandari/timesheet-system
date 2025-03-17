import React, { createContext, useContext, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true",
  );

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#64B5F6" : "#2196F3",
        dark: darkMode ? "#1976D2" : "#1565C0",
        light: darkMode ? "#90CAF9" : "#64B5F6",
      },
      secondary: {
        main: darkMode ? "#81D4FA" : "#21CBF3",
        dark: darkMode ? "#00B8D4" : "#0097A7",
        light: darkMode ? "#B3E5FC" : "#80DEEA",
      },
      background: {
        default: darkMode ? "#121212" : "#f5f7fa",
        paper: darkMode ? "#1E1E1E" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#ffffff" : "#000000",
        secondary: darkMode ? "#B0B0B0" : "#666666",
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            background: darkMode
              ? "linear-gradient(135deg, rgba(37, 37, 37, 0.9), rgba(30, 30, 30, 0.9))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.9))",
            backdropFilter: "blur(10px)",
            border: `1px solid ${
              darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
            }`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
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
                  backgroundColor: darkMode ? "#8796A5" : "#aab4be",
                },
              },
            },
            "& .MuiSwitch-thumb": {
              backgroundColor: darkMode ? "#003892" : "#001e3c",
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
              backgroundColor: darkMode ? "#8796A5" : "#aab4be",
              borderRadius: 20 / 2,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: darkMode
              ? "linear-gradient(135deg, rgba(37, 37, 37, 0.95), rgba(30, 30, 30, 0.95))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.95))",
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${
              darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
            }`,
            color: darkMode ? "#ffffff" : "#000000",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: darkMode
              ? "linear-gradient(135deg, rgba(37, 37, 37, 0.95), rgba(30, 30, 30, 0.95))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.95))",
            backdropFilter: "blur(10px)",
            borderRight: `1px solid ${
              darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
            }`,
          },
        },
      },
      MuiPickersPopper: {
        styleOverrides: {
          paper: {
            backgroundColor: "#ffffff",
            color: "#000000",
          },
        },
      },
      MuiPickersDay: {
        styleOverrides: {
          root: {
            color: "#000000",
            "&.Mui-selected": {
              backgroundColor: "#2196F3",
              color: "#ffffff",
            },
          },
        },
      },
      MuiCalendarPicker: {
        styleOverrides: {
          root: {
            backgroundColor: "#ffffff",
            color: "#000000",
          },
        },
      },
      MuiYearPicker: {
        styleOverrides: {
          root: {
            backgroundColor: "#ffffff",
            color: "#000000",
          },
        },
      },
      MuiPickersCalendarHeader: {
        styleOverrides: {
          root: {
            color: "#000000",
          },
        },
      },
    },
  });

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};
