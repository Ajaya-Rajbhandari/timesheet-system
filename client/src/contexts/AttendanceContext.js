import React, { createContext, useContext, useState, useEffect } from 'react';
import moment from 'moment';
import { getCurrentStatus } from '../services/attendanceService';

const AttendanceContext = createContext(null);

export const AttendanceProvider = ({ children }) => {
  const [currentStatus, setCurrentStatus] = useState(() => {
    // Try to get the current status from localStorage
    const savedStatus = localStorage.getItem('attendanceStatus');
    return savedStatus ? JSON.parse(savedStatus) : {
      isClockedIn: false,
      clockInTime: null,
      clockOutTime: null,
      onBreak: false,
      breakStartTime: null
    };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current status on component mount
  useEffect(() => {
    fetchCurrentStatus();
  }, []);

  const fetchCurrentStatus = async () => {
    try {
      setLoading(true);
      const response = await getCurrentStatus();
      if (response) {
        const newStatus = {
          isClockedIn: !!response.clockIn && !response.clockOut,
          clockInTime: response.clockIn,
          clockOutTime: response.clockOut,
          onBreak: response.breaks && response.breaks.length > 0 && 
                   response.breaks[response.breaks.length - 1].end === null,
          breakStartTime: response.breaks && response.breaks.length > 0 && 
                         response.breaks[response.breaks.length - 1].end === null ? 
                         response.breaks[response.breaks.length - 1].start : null
        };
        setCurrentStatus(newStatus);
        localStorage.setItem('attendanceStatus', JSON.stringify(newStatus));
      }
    } catch (err) {
      console.error('Error fetching attendance status:', err);
      // Continue with local status if API fails
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (newStatus) => {
    setCurrentStatus(newStatus);
    localStorage.setItem('attendanceStatus', JSON.stringify(newStatus));
  };

  const getStatusText = () => {
    if (currentStatus.onBreak) {
      return 'On Break';
    } else if (currentStatus.isClockedIn) {
      return 'Clocked In';
    } else {
      return 'Clocked Out';
    }
  };

  const getStatusColor = () => {
    if (currentStatus.onBreak) {
      return 'warning.main';
    } else if (currentStatus.isClockedIn) {
      return 'success.main';
    } else {
      return 'error.main';
    }
  };

  const value = {
    currentStatus,
    updateStatus,
    loading,
    error,
    fetchCurrentStatus,
    getStatusText,
    getStatusColor
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export default AttendanceContext; 