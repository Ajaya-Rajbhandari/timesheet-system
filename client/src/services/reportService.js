import axiosInstance from "../utils/axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get attendance summary report
export const getAttendanceSummary = async (startDate, endDate, department) => {
  try {
    const response = await axiosInstance.get(`/reports/attendance-summary`, {
      params: { startDate, endDate, department },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting attendance summary:", error);
    throw error.response?.data?.message || "Error getting attendance summary";
  }
};

// Get overtime report
export const getOvertimeReport = async (startDate, endDate, department) => {
  try {
    const response = await axiosInstance.get(`/reports/overtime`, {
      params: { startDate, endDate, department },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting overtime report:", error);
    throw error.response?.data?.message || "Error getting overtime report";
  }
};

// Get time-off report
export const getTimeOffReport = async (
  startDate,
  endDate,
  department,
  type,
) => {
  try {
    const response = await axiosInstance.get(`/reports/time-off`, {
      params: { startDate, endDate, department, type },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting time-off report:", error);
    throw error.response?.data?.message || "Error getting time-off report";
  }
};

// Get department summary report
export const getDepartmentSummary = async (startDate, endDate, department) => {
  try {
    const response = await axiosInstance.get(`/reports/department-summary`, {
      params: { startDate, endDate, department },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting department summary:", error);
    throw error.response?.data?.message || "Error getting department summary";
  }
};

// Get detailed user report
export const getUserDetailsReport = async (userId, startDate, endDate) => {
  try {
    const response = await axiosInstance.get(
      `/reports/user-details/${userId}`,
      {
        params: { startDate, endDate },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error getting user details report:", error);
    throw error.response?.data?.message || "Error getting user details";
  }
};

// Get reports (admin/manager)
export const getReports = async (startDate, endDate) => {
  try {
    const response = await axiosInstance.get(`/reports`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting reports:", error);
    throw error.response?.data?.message || "Error getting reports";
  }
};

// Get report data
export const getReportData = async (startDate, endDate) => {
  try {
    console.log("Fetching report data for:", { startDate, endDate });
    const response = await axiosInstance.get(`/reports/data`, {
      params: { startDate, endDate },
    });
    console.log("Report data received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error getting report data:", error);
    throw error.response?.data?.message || "Error getting report data";
  }
};

// Generate specific type of report
export const generateReport = async (reportType, startDate, endDate) => {
  try {
    console.log("Generating report:", { reportType, startDate, endDate });
    const response = await axiosInstance.get(`/reports/${reportType}`, {
      params: { startDate, endDate },
    });
    console.log("Report generated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating report:", error);
    console.error("Error details:", error.response?.data || "No response data");
    console.error("Error status:", error.response?.status || "No status code");
    throw error.response?.data?.message || "Error generating report";
  }
};

// Export report in various formats
export const exportReport = async (format, startDate, endDate, reportType) => {
  try {
    console.log("Exporting report:", {
      format,
      reportType,
      startDate,
      endDate,
    });
    const response = await axiosInstance.get(`/reports/export/${reportType}`, {
      params: { startDate, endDate, format },
      responseType: "blob",
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${reportType}-report-${startDate}-to-${endDate}.${format}`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log("Report exported successfully");
    return true;
  } catch (error) {
    console.error("Error exporting report:", error);
    console.error("Error details:", error.response?.data || "No response data");
    console.error("Error status:", error.response?.status || "No status code");
    throw error.response?.data?.message || "Error exporting report";
  }
};

// Export attendance report to CSV
export const exportAttendanceReport = async (
  startDate,
  endDate,
  department,
) => {
  try {
    const response = await axiosInstance.get(`/reports/export/attendance`, {
      params: { startDate, endDate, department, format: "csv" },
      responseType: "blob",
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `attendance-report-${startDate}-to-${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("Error exporting attendance report:", error);
    throw error.response?.data?.message || "Error exporting attendance report";
  }
};

// Export time-off report to CSV
export const exportTimeOffReport = async (startDate, endDate, department) => {
  try {
    const response = await axiosInstance.get(`/reports/export/time-off`, {
      params: { startDate, endDate, department, format: "csv" },
      responseType: "blob",
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `time-off-report-${startDate}-to-${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("Error exporting time-off report:", error);
    throw error.response?.data?.message || "Error exporting time-off report";
  }
};
