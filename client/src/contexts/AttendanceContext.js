import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentStatus, clockIn, clockOut, startBreak, endBreak } from '../services/attendanceService';
import { useAuth } from './AuthContext';
import { debounce } from 'lodash';

const AttendanceContext = createContext();

// Constants
const STORAGE_KEY = 'attendanceStatus';
const REFRESH_INTERVAL = 15000; // 15 seconds - more frequent updates for better sync
const RETRY_DELAY = 3000; // 3 seconds - delay before retrying after an error

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
  // Track retry attempts
  const retryAttempts = useRef(0);
  // Track retry timeout
  const retryTimeout = useRef(null);

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

  // Clear retry timeout if it exists
  const clearRetryTimeout = useCallback(() => {
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
  }, []);

  const refreshStatus = useCallback(async (force = false) => {
    // Clear any existing retry timeout
    clearRetryTimeout();
    
    // Don't attempt to refresh while auth is still loading
    if (authLoading) {
      console.log('Auth still loading, deferring refresh');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping refresh');
      // Reset status to a clean state when not authenticated
      setCurrentStatus({
        isClockedIn: false,
        clockInTime: null,
        clockOutTime: null,
        onBreak: false,
        breakStartTime: null,
        isLoading: false,
        error: null
      });
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
      setCurrentStatus(prev => ({ ...prev, isLoading: true, error: null }));
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
      // Reset retry attempts on success
      retryAttempts.current = 0;
      
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
            error: null // Don't show error if we have cached data
          }));
          
          // Schedule a retry
          scheduleRetry();
          
          return;
        }
      } catch (cacheErr) {
        console.error('Error loading from cache:', cacheErr);
      }
      
      // If we reach here, both server and cache failed
      setCurrentStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Unable to load attendance status. Please try again.'
      }));
      
      // Schedule a retry
      scheduleRetry();
    }
  }, [isAuthenticated, user, authLoading, saveStatusToCache, clearRetryTimeout]);

  // Schedule a retry with exponential backoff
  const scheduleRetry = useCallback(() => {
    // Clear any existing retry timeout
    clearRetryTimeout();
    
    // Increment retry attempts
    retryAttempts.current += 1;
    
    // Calculate backoff delay (max 30 seconds)
    const backoffDelay = Math.min(RETRY_DELAY * Math.pow(1.5, retryAttempts.current - 1), 30000);
    
    console.log(`Scheduling retry attempt ${retryAttempts.current} in ${backoffDelay}ms`);
    
    // Schedule retry
    retryTimeout.current = setTimeout(() => {
      console.log(`Executing retry attempt ${retryAttempts.current}`);
      refreshStatus(true);
    }, backoffDelay);
  }, [clearRetryTimeout, refreshStatus]);

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
            error: null // Don't show error when not authenticated
          }));
          return;
        }
        
        if (!user || !user._id) {
          console.log('No user ID available, skipping initial status load');
          setCurrentStatus(prev => ({
            ...prev,
            isLoading: false,
            error: null // Don't show error when no user ID
          }));
          return;
        }
        
        console.log('User authenticated, loading initial status for user:', user._id);
        
        // Always start with loading state
        setCurrentStatus(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Try to load from cache first for immediate display
        const userSpecificKey = `${STORAGE_KEY}_${user._id}`;
        const cachedStatus = localStorage.getItem(userSpecificKey);
        
        if (cachedStatus) {
          try {
            const parsedStatus = JSON.parse(cachedStatus);
            console.log('Initial load - using cached status:', parsedStatus);
            
            // Only use cached status if it's from today or user is still clocked in
            const cachedDate = parsedStatus.lastUpdated ? new Date(parsedStatus.lastUpdated) : null;
            const today = new Date();
            const isToday = cachedDate && cachedDate.toDateString() === today.toDateString();
            
            if (isToday || parsedStatus.isClockedIn) {
              setCurrentStatus(prev => ({
                ...parsedStatus,
                isLoading: true, // Keep loading while we check with server
                error: null
              }));
            }
          } catch (parseErr) {
            console.error('Error parsing cached status:', parseErr);
            // Continue with server refresh even if cache parsing fails
          }
        }
        
        // Always refresh from server to get latest data
        await refreshStatus(true);
      } catch (err) {
        console.error('Error in initial status load:', err);
        // Try to use cache as fallback if available
        try {
          const userSpecificKey = `${STORAGE_KEY}_${user._id}`;
          const cachedStatus = localStorage.getItem(userSpecificKey);
          
          if (cachedStatus) {
            const parsedStatus = JSON.parse(cachedStatus);
            setCurrentStatus(prev => ({
              ...parsedStatus,
              isLoading: false,
              error: null // Don't show error if we have cached data
            }));
            return;
          }
        } catch (cacheErr) {
          console.error('Error loading from cache as fallback:', cacheErr);
        }
        
        setCurrentStatus(prev => ({
          ...prev,
          isLoading: false,
          error: 'Unable to load attendance status. Please try again.'
        }));
        
        // Schedule a retry
        scheduleRetry();
      }
    };
    
    // Only run this effect when authentication state or user changes
    loadInitialStatus();
    
    // Clean up retry timeout on unmount
    return () => {
      clearRetryTimeout();
    };
  }, [isAuthenticated, user, authLoading, refreshStatus, clearRetryTimeout, scheduleRetry]);

  // Set up periodic refresh
  useEffect(() => {
    if (authLoading || !isAuthenticated || !user?._id) return;
    
    console.log('Setting up periodic refresh interval');
    const interval = setInterval(() => {
      refreshStatus(false); // Use false to respect the refresh interval check
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
    if (currentStatus.error) return 'Loading status...';
    if (currentStatus.onBreak) return 'On Break';
    return currentStatus.isClockedIn ? 'Clocked In' : 'Clocked Out';
  }, [currentStatus.isLoading, currentStatus.error, currentStatus.onBreak, currentStatus.isClockedIn]);

  const getStatusColor = useCallback(() => {
    if (currentStatus.isLoading) return 'grey.500';
    if (currentStatus.error) return 'info.main';
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
