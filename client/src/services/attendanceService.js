import api from "./api";
import moment from "moment";

/**
 * Clock in the current user
 * @returns {Promise} Promise object with clock in data
 */
export const clockIn = async () => {
  try {
    // First get current status to ensure we have latest state
    const currentStatus = await getCurrentStatus();

    if (currentStatus.isClockedIn) {
      // If already clocked in, force a clock out first
      await clockOut();
    }

    const response = await api.post("/attendance/clock-in");
    return response.data;
  } catch (error) {
    // Enhance error message
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * Clock out the current user
 * @returns {Promise} Promise object with clock out data
 */
export const clockOut = async () => {
  try {
    const response = await api.put("/attendance/clock-out");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * Start a break for the current user
 * @returns {Promise} Promise object with break start data
 */
export const startBreak = async () => {
  try {
    const response = await api.post("/attendance/break/start");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * End a break for the current user
 * @returns {Promise} Promise object with break end data
 */
export const endBreak = async () => {
  try {
    const response = await api.put("/attendance/break/end");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * Get the current attendance status for the current user
 * @returns {Promise} Promise object with current status data
 */
export const getCurrentStatus = async () => {
  try {
    console.log("Fetching current attendance status from server");
    const response = await api.get("/attendance/current");
    console.log("Server response:", JSON.stringify(response.data));

    // Ensure we have a valid response with expected properties
    if (!response.data) {
      console.error("Empty response data from server");
      throw new Error("Empty response from server");
    }

    // Ensure the response has the expected properties
    const status = {
      isClockedIn: !!response.data.isClockedIn,
      clockInTime: response.data.clockInTime,
      clockOutTime: response.data.clockOutTime,
      onBreak: !!response.data.onBreak,
      breakStartTime: response.data.breakStartTime,
      attendanceId: response.data.attendanceId,
      totalBreaks: response.data.totalBreaks || 0,
      error: null,
      isLoading: false,
    };

    console.log("Formatted status:", JSON.stringify(status));
    return status;
  } catch (error) {
    console.error("Error getting current status:", error);
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * Get attendance history for the current user
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise} Promise object with attendance history data
 */
export const getAttendanceHistory = async (startDate, endDate) => {
  try {
    const response = await api.get("/attendance/history", {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * Get attendance history for a specific user (admin/manager only)
 * @param {string} userId - User ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise} Promise object with user attendance history data
 */
export const getUserAttendance = async (userId, startDate, endDate) => {
  try {
    const response = await api.get(`/attendance/user/${userId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * Create a manual attendance record (admin/manager only)
 * @param {Object} data - Attendance data
 * @returns {Promise} Promise object with created attendance data
 */
export const createManualAttendance = async (data) => {
  try {
    const response = await api.post("/attendance/manual", data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * Update an attendance record (admin/manager only)
 * @param {string} id - Attendance record ID
 * @param {Object} data - Updated attendance data
 * @returns {Promise} Promise object with updated attendance data
 */
export const updateAttendance = async (id, data) => {
  try {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * Delete an attendance record (admin/manager only)
 * @param {string} id - Attendance record ID
 * @returns {Promise} Promise object with deletion confirmation
 */
export const deleteAttendance = async (id) => {
  try {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};

/**
 * Record an auto clock-out (system use)
 * @param {Object} data - Auto clock-out data
 * @returns {Promise} Promise object with auto clock-out confirmation
 */
export const recordAutoClockOut = async (data) => {
  try {
    const response = await api.post("/attendance/auto-clockout", data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }
    throw error;
  }
};
