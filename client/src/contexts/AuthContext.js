import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize checkAuthStatus to prevent unnecessary re-renders
  const checkAuthStatus = useCallback(async () => {
    try {
      console.log("Checking auth status...");
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, user is not authenticated");
        setUser(null);
        setLoading(false);
        return null;
      }

      console.log("Token found, verifying with server...");
      const response = await api.get("/auth/user");

      if (response.data) {
        console.log("User authenticated:", response.data);
        setUser(response.data);
        return response.data;
      } else {
        console.log("Server returned no user data");
        setUser(null);
        localStorage.removeItem("token");
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      localStorage.removeItem("token");
      setUser(null);
      setError(err.message || "Authentication check failed");
    } finally {
      setLoading(false);
    }

    return null;
  }, []);

  // Check authentication status when component mounts
  useEffect(() => {
    console.log("AuthProvider mounted, checking auth status");
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password) => {
    try {
      console.log("Login attempt with:", { email });
      setLoading(true);
      setError(null);

      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response.data);

      const { token, user } = response.data;
      localStorage.setItem("token", token);

      console.log("Setting user:", user);
      setUser(user);
      setError(null);
      setLoading(false);

      return user;
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed");
      setLoading(false);
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      console.log("Registration attempt with:", { email: formData.email });
      setLoading(true);
      setError(null);

      const response = await api.post("/auth/register", formData);
      console.log("Registration response:", response.data);

      const { token, user } = response.data;
      localStorage.setItem("token", token);

      console.log("Setting user:", user);
      setUser(user);
      setError(null);
      setLoading(false);

      return user;
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed");
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    console.log("Logging out user");
    localStorage.removeItem("token");
    setUser(null);
    setError(null);
  };

  // Compute derived state
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus,
    isAdmin,
    isManager,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
