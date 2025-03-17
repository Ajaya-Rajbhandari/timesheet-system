import axios from "axios";

// Create axios instance with base URL
const instance = axios.create({
  baseURL: "/api", // Use relative path since we have proxy in package.json
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Set both header formats to ensure compatibility
      config.headers["x-auth-token"] = token;
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log(
        `Request with auth token: ${config.method.toUpperCase()} ${config.url}`,
      );
    } else {
      console.warn(
        `Request without auth token: ${config.method.toUpperCase()} ${
          config.url
        }`,
      );
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor to handle errors
instance.interceptors.response.use(
  (response) => {
    console.log(
      `Response success: ${
        response.status
      } ${response.config.method.toUpperCase()} ${response.config.url}`,
    );
    return response;
  },
  (error) => {
    // Handle 401 (Unauthorized) - redirect to login
    if (error.response?.status === 401) {
      console.error(
        "Authentication error (401):",
        error.response?.data?.message || "Unauthorized",
      );
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        console.log("Redirecting to login page due to authentication failure");
        window.location.href = "/login";
      }
    }
    // Handle 403 (Forbidden) - not enough permissions
    else if (error.response?.status === 403) {
      console.error(
        "Permission error (403):",
        error.response?.data?.message || "Forbidden",
      );
      throw new Error(
        error.response?.data?.message ||
          "You do not have permission to perform this action",
      );
    }
    // Handle other errors
    else {
      console.error(
        `API error (${error.response?.status || "unknown"}):`,
        error.response?.data?.message || error.message || "An error occurred",
      );
    }

    throw error.response?.data?.message || error.message || "An error occurred";
  },
);

export default instance;
