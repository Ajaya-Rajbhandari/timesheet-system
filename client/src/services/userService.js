import axios from "../utils/axios";

// Get all users (admin/manager only)
export const fetchUsers = async () => {
  try {
    const response = await axios.get("/users");
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error fetching users";
  }
};

// Get user by ID (admin/manager or self only)
export const fetchUserById = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const response = await axios.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error in fetchUserById:", error);
    throw error.response?.data?.message || "Error fetching user";
  }
};

// Create new user (admin/manager only)
export const createUser = async (userData) => {
  try {
    // As per memory faa3516c, only admins/managers can create users
    // Convert department ID to string if it exists
    if (userData.department) {
      userData.department = userData.department.toString();
    }

    const response = await axios.post("/users", userData);
    return response.data;
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error.response?.data?.message || "Error creating user";
  }
};

// Update user (admin/manager or self only)
export const updateUser = async (userId, userData) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    // Convert department ID to string if it exists
    if (userData.department) {
      userData.department = userData.department.toString();
    }

    const response = await axios.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw error.response?.data?.message || "Error updating user";
  }
};

// Update user password
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await axios.put("/users/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error("Error in updatePassword:", error);
    throw error.response?.data?.message || "Error updating password";
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const response = await axios.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw error.response?.data?.message || "Error deleting user";
  }
};

// Get users by department (admin/manager only)
export const fetchUsersByDepartment = async (departmentId) => {
  if (!departmentId) {
    throw new Error("Department ID is required");
  }

  try {
    const response = await axios.get(`/users/department/${departmentId}`);
    return response.data;
  } catch (error) {
    console.error("Error in fetchUsersByDepartment:", error);
    throw error.response?.data?.message || "Error fetching department users";
  }
};
