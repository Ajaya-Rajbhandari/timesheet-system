import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import jwt_decode from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          handleLogout();
        } else {
          axiosInstance.defaults.headers.common["Authorization"] =
            `Bearer ${token}`;
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: true,
            user: decoded,
            loading: false,
          }));
        }
      } catch (err) {
        handleLogout();
      }
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const { data } = await axiosInstance.post("/api/auth/login", credentials);
      const { token, user } = data;

      localStorage.setItem("token", token);
      axiosInstance.defaults.headers.common["Authorization"] =
        `Bearer ${token}`;

      setAuthState({
        isAuthenticated: true,
        user,
        error: null,
        loading: false,
      });

      return { success: true };
    } catch (err) {
      setAuthState((prev) => ({
        ...prev,
        error: err.response?.data?.message || "Login failed",
        loading: false,
      }));
      return {
        success: false,
        error: err.response?.data?.message || "Login failed",
      };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    delete axiosInstance.defaults.headers.common["Authorization"];
    setAuthState({
      isAuthenticated: false,
      user: null,
      error: null,
      loading: false,
    });
  };

  const value = {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
    isAdmin: authState.user?.role === "admin",
    isManager: ["manager", "admin"].includes(authState.user?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
