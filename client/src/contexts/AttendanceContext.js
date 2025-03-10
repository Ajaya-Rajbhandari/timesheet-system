import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentStatus, clockIn, clockOut, startBreak, endBreak } from '../services/attendanceService';
import { useAuth } from './AuthContext';
import { debounce } from 'lodash';

const AttendanceContext = createContext();

// Constants
const STORAGE_KEY = 'attendanceStatus';
const REFRESH_INTERVAL = 15000; // 15 seconds - more frequent updates for better sync

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export const AttendanceProvider = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [currentStatus, setCurrentStatus] = useState({
    isClockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    onBreak: false,
    breakStartTime: null,
    isLoading: true, // Start with loading state
    error: null
  });
  
  // Use a ref to track if initial data has been loaded
  const initialLoadComplete = useRef(false);
  // Track last server refresh time
  const lastServerRefresh = useRef(null);
  // Track if we're waiting for auth to complete
  const waitingForAuth = useRef(true);

  // Debounce the status update function to prevent rapid consecutive updates
  const debouncedUpdateStatus = useRef(debounce((newStatus) => {
    console.log('Debounced updating status with:', newStatus);
    
    setCurrentStatus(prev => {
      const updatedStatus = {
        ...prev,
        ...newStatus,
        isLoading: false,
        lastUpdated: new Date().toISOString()
      };
      
      // Log the updated status for debugging
      console.log('Updated status:', updatedStatus);
      
      // Save to cache immediately
      saveStatusToCache(updatedStatus);
      
      return updatedStatus;
    });
  }, 1000)); // 1 second debounce delay

  // Save status to localStorage
  const saveStatusToCache = useCallback((status) => {
    if (!isAuthenticated || !user?._id) return;
    
    try {
      const userSpecificKey = `${STORAGE_KEY}_${user._id}`;
      const dataToSave = {
        ...status,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(userSpecificKey, JSON.stringify(dataToSave));
      console.log('Saved status to cache:', dataToSave);
    } catch (err) {
      console.error('Error saving attendance status to cache:', err);
    }
  }, [isAuthenticated, user]);

  // Update status function - defined before it's used in other functions
  const updateStatus = useCallback((newStatus) => {
    debouncedUpdateStatus.current(newStatus);
  }, []);

  const refreshStatus = useCallback(async (force = false) => {
    // Don't attempt to refresh while auth is still loading
    if (authLoading) {
      console.log('Auth still loading, deferring refresh');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping refresh');
      return;
    }
    
    if (!user || !user._id) {
      console.log('No user ID available, skipping refresh');
      return;
    }
    
    console.log('Authentication check passed, proceeding with refresh for user:', user._id);
    
    // Skip refresh if we've already loaded recently and force is false
    const now = new Date();
    if (!force && lastServerRefresh.current && 
        (now - lastServerRefresh.current) < REFRESH_INTERVAL) {
      console.log('Skipping refresh - recent refresh already performed');
      return;
    }

    try {
      setCurrentStatus(prev => ({ ...prev, isLoading: true }));
      console.log('Refreshing attendance status from server for user:', user._id);
      
      const status = await getCurrentStatus();
      lastServerRefresh.current = new Date();
      
      console.log('Received status from server:', JSON.stringify(status));
      
      if (!status) {
        console.error('Received empty status from server');
        setCurrentStatus(prev => ({
          ...prev,
          isLoading: false,
          error: 'Received empty status from server'
        }));
        return;
      }
      
      // Add lastUpdated timestamp
      const updatedStatus = {
        ...status,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Setting updated status:', JSON.stringify(updatedStatus));
      setCurrentStatus(updatedStatus);
      saveStatusToCache(updatedStatus);
      
      // Mark initial load as complete
      initialLoadComplete.current = true;
      
      return updatedStatus;
    } catch (err) {
      console.error('Error refreshing status:', err);
      
      // Try to load from cache if server fails
      try {
        const userSpecificKey = `${STORAGE_KEY}_${user._id}`;
        const cachedStatus = localStorage.getItem(userSpecificKey);
        
        if (cachedStatus) {
          const parsedStatus = JSON.parse(cachedStatus);
          console.log('Using cached status due to server error:', parsedStatus);
          
          setCurrentStatus(prev => ({
            ...parsedStatus,
            isLoading: false,
            error: err.message || 'Failed to get attendance status'
          }));
        } else {
          setCurrentStatus(prev => ({
            ...prev,
            isLoading: false,
            error: err.message || 'Failed to get attendance status'
          }));
        }
      } catch (cacheErr) {
        console.error('Error loading from cache:', cacheErr);
        setCurrentStatus(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || 'Failed to get attendance status'
        }));
      }
    }
  }, [isAuthenticated, user, authLoading, saveStatusToCache]);

  // Direct API action methods (memoized to prevent unnecessary re-renders)
  const handleClockIn = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return;
    try {
      console.log('Clocking in user:', user._id);
      const response = await clockIn();
      console.log('Clock in response:', response);
      
      updateStatus({
        isClockedIn: true,
        clockInTime: response.clockIn,
        onBreak: false,
        breakStartTime: null
      });
      
      return response;
    } catch (err) {
      console.error('Error clocking in:', err);
      throw err;
    }
  }, [isAuthenticated, user, updateStatus]);

  const handleClockOut = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return;
    try {
      console.log('Clocking out user:', user._id);
      const response = await clockOut();
      console.log('Clock out response:', response);
      
      updateStatus({
        isClockedIn: false,
        clockOutTime: response.clockOut,
        onBreak: false,
        breakStartTime: null
      });
      
      return response;
    } catch (err) {
      console.error('Error clocking out:', err);
      throw err;
    }
  }, [isAuthenticated, user, updateStatus]);

  const handleStartBreak = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return;
    try {
      console.log('Starting break for user:', user._id);
      const response = await startBreak();
      console.log('Start break response:', response);
      
      updateStatus({
        onBreak: true,
        breakStartTime: response.breakStartTime || new Date()
      });
      
      return response;
    } catch (err) {
      console.error('Error starting break:', err);
      throw err;
    }
  }, [isAuthenticated, user, updateStatus]);

  const handleEndBreak = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return;
    try {
      console.log('Ending break for user:', user._id);
      const response = await endBreak();
      console.log('End break response:', response);
      
      updateStatus({
        onBreak: false,
        breakStartTime: null
      });
      
      return response;
    } catch (err) {
      console.error('Error ending break:', err);
      throw err;
    }
  }, [isAuthenticated, user, updateStatus]);

  // Effect to watch for auth completion
  useEffect(() => {
    // If auth is no longer loading and we were waiting for it
    if (!authLoading && waitingForAuth.current) {
      console.log('Auth loading complete, user:', user ? user._id : 'none');
      waitingForAuth.current = false;
      
      // If user is authenticated, refresh status
      if (isAuthenticated && user && user._id) {
        console.log('Auth complete and user authenticated, refreshing status');
        refreshStatus(true);
      }
    }
  }, [authLoading, isAuthenticated, user, refreshStatus]);

  // Load initial status - try cache first, then server
  useEffect(() => {
    const loadInitialStatus = async () => {
      try {
        // Skip if auth is still loading
        if (authLoading) {
          console.log('Auth still loading, deferring initial status load');
          return;
        }
        
        // Check if user is authenticated
        if (!isAuthenticated) {
          console.log('User not authenticated, skipping initial status load');
          setCurrentStatus(prev => ({
            ...prev,
            isLoading: false,
            error: 'Not authenticated'
          }));
          return;
        }
        
        if (!user || !user._id) {
          console.log('No user ID available, skipping initial status load');
          setCurrentStatus(prev => ({
            ...prev,
            isLoading: false,
            error: 'No user ID available'
          }));
          return;
        }
        
        console.log('User authenticated, loading initial status for user:', user._id);
        
        // Always start with loading state
        setCurrentStatus(prev => ({ ...prev, isLoading: true }));
        
        // Try to load from cache first for immediate display
        const userSpecificKey = `${STORAGE_KEY}_${user._id}`;
        const cachedStatus = localStorage.getItem(userSpecificKey);
        
        if (cachedStatus) {
          const parsedStatus = JSON.parse(cachedStatus);
          console.log('Initial load - using cached status:', parsedStatus);
          
          // Only use cached status if it's from today or user is still clocked in
          const cachedDate = parsedStatus.lastUpdated ? new Date(parsedStatus.lastUpdated) : null;
          const today = new Date();
          const isToday = cachedDate && cachedDate.toDateString() === today.toDateString();
          
          if (isToday || parsedStatus.isClockedIn) {
            setCurrentStatus(prev => ({
              ...parsedStatus,
              isLoading: true // Keep loading while we check with server
            }));
          }
        }
        
        // Always refresh from server to get latest data
        await refreshStatus(true);
      } catch (err) {
        console.error('Error in initial status load:', err);
        setCurrentStatus(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || 'Failed to load initial status'
        }));
      }
    };
    
    // Only run this effect when authentication state or user changes
    loadInitialStatus();
  }, [isAuthenticated, user, authLoading, refreshStatus]);

  // Set up periodic refresh
  useEffect(() => {
    if (authLoading || !isAuthenticated || !user?._id) return;
    
    console.log('Setting up periodic refresh interval');
    const interval = setInterval(() => {
      refreshStatus(true);
    }, REFRESH_INTERVAL);
    
    return () => {
      console.log('Clearing periodic refresh interval');
      clearInterval(interval);
    };
  }, [refreshStatus, isAuthenticated, user, authLoading]);

  // Add event listeners for visibility and network changes
  useEffect(() => {
    if (authLoading || !isAuthenticated || !user?._id) return;
    
    // Refresh when document becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Document visible again, refreshing status');
        refreshStatus(true);
      }
    };
    
    // Refresh when network comes back online
    const handleOnline = () => {
      console.log('Network online, refreshing status');
      refreshStatus(true);
    };
    
    // Refresh when window gets focus
    const handleFocus = () => {
      console.log('Window focused, refreshing status');
      refreshStatus(true);
    };
    
    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshStatus, isAuthenticated, user, authLoading]);

  const getStatusText = useCallback(() => {
    if (currentStatus.isLoading) return 'Loading...';
    if (currentStatus.error) return 'Error loading status';
    if (currentStatus.onBreak) return 'On Break';
    return currentStatus.isClockedIn ? 'Clocked In' : 'Clocked Out';
  }, [currentStatus.isLoading, currentStatus.error, currentStatus.onBreak, currentStatus.isClockedIn]);

  const getStatusColor = useCallback(() => {
    if (currentStatus.isLoading) return 'grey.500';
    if (currentStatus.error) return 'error.main';
    if (currentStatus.onBreak) return 'warning.main';
    return currentStatus.isClockedIn ? 'success.main' : 'error.main';
  }, [currentStatus.isLoading, currentStatus.error, currentStatus.onBreak, currentStatus.isClockedIn]);

  const value = {
    currentStatus,
    updateStatus,
    refreshStatus,
    getStatusText,
    getStatusColor,
    // Add direct API action methods
    clockIn: handleClockIn,
    clockOut: handleClockOut,
    startBreak: handleStartBreak,
    endBreak: handleEndBreak
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};
