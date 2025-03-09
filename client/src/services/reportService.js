import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get attendance summary report
export const getAttendanceSummary = async (startDate, endDate, department) => {
  try {
    const response = await axios.get(`${API_URL}/reports/attendance-summary`, {
      params: { startDate, endDate, department }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting attendance summary';
  }
};

// Get overtime report
export const getOvertimeReport = async (startDate, endDate, department) => {
  try {
    const response = await axios.get(`${API_URL}/reports/overtime`, {
      params: { startDate, endDate, department }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting overtime report';
  }
};

// Get time-off report
export const getTimeOffReport = async (startDate, endDate, department, type) => {
  try {
    const response = await axios.get(`${API_URL}/reports/time-off`, {
      params: { startDate, endDate, department, type }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting time-off report';
  }
};

// Get department summary report
export const getDepartmentSummary = async (startDate, endDate, department) => {
  try {
    const response = await axios.get(`${API_URL}/reports/department-summary`, {
      params: { startDate, endDate, department }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting department summary';
  }
};

// Get detailed user report
export const getUserDetailsReport = async (userId, startDate, endDate) => {
  try {
    const response = await axios.get(`${API_URL}/reports/user-details/${userId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting user details report';
  }
};

// Get reports (admin/manager)
export const getReports = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${API_URL}/reports`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting reports';
  }
};

// Get report data
export const getReportData = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${API_URL}/reports/data`, {
      params: { startDate, endDate },
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
};

// Generate specific type of report
export const generateReport = async (reportType, startDate, endDate) => {
  try {
    const response = await axios.get(`${API_URL}/reports/${reportType}`, {
      params: { startDate, endDate },
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

// Export report in various formats
export const exportReport = async (format, startDate, endDate, reportType) => {
  try {
    const response = await axios.get(`${API_URL}/reports/export`, {
      params: { format, startDate, endDate, reportType },
      responseType: 'blob',
      headers: getAuthHeader()
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${startDate}_${endDate}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};

// Export attendance report to CSV
export const exportAttendanceReport = async (startDate, endDate, department) => {
  try {
    const response = await axios.get(`${API_URL}/reports/export/attendance`, {
      params: { startDate, endDate, department },
      responseType: 'blob',
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error exporting attendance report';
  }
};

// Export time-off report to CSV
export const exportTimeOffReport = async (startDate, endDate, department) => {
  try {
    const response = await axios.get(`${API_URL}/reports/export/time-off`, {
      params: { startDate, endDate, department },
      responseType: 'blob',
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error exporting time-off report';
  }
};
