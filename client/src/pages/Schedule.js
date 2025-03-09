import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Stack,
  useTheme,
  alpha,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Alert,
  Paper,
  Snackbar,
  useMediaQuery,
  Tooltip,
  InputAdornment,
  Badge,
  Fade,
  ToggleButton,
  ToggleButtonGroup,
  Zoom,
  Menu,
  ListItemIcon,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Search as SearchIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Info as InfoIcon,
  ViewDay as DayViewIcon,
  ViewWeek as WeekViewIcon,
  ViewModule as MonthViewIcon,
  ViewList as ListViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon,
  RadioButtonChecked as RadioButtonChecked,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { getMySchedules, createSchedule, updateSchedule, deleteSchedule } from '../services/scheduleService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  validateSchedule, 
  findScheduleConflicts, 
  suggestAlternativeSchedules,
  calculateWorkingHours,
  checkWorkingHoursLimit 
} from '../utils/scheduleValidation';

const Schedule = () => {
  const baseTheme = useTheme();
  const { isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    startDate: moment(),
    endDate: moment(),
    startTime: moment().set({ hour: 9, minute: 0 }),
    endTime: moment().set({ hour: 17, minute: 0 }),
    type: 'regular',
    notes: '',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });
  const [expandedDate, setExpandedDate] = useState(null);
  const [draggedSchedule, setDraggedSchedule] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  const [selectedDay, setSelectedDay] = useState(moment());
  const [selectedWeek, setSelectedWeek] = useState(moment().startOf('week'));
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [exportPeriod, setExportPeriod] = useState('current');
  const [previewData, setPreviewData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: moment(),
    endDate: moment()
  });
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const customTheme = {
    palette: {
      mode: 'light',
      primary: {
        main: '#2196F3',
        dark: '#1565C0',
        light: '#64B5F6',
      },
      secondary: {
        main: '#21CBF3',
        dark: '#0097A7',
        light: '#80DEEA',
      },
      background: {
        default: '#f5f7fa',
        paper: '#ffffff',
      },
      text: {
        primary: '#000000',
        secondary: '#666666',
      },
      grey: {
        900: '#212121',
        800: '#424242',
        700: '#616161',
        600: '#757575',
        500: '#9e9e9e',
        400: '#bdbdbd',
        300: '#e0e0e0',
        200: '#eeeeee',
        100: '#f5f5f5',
        50: '#fafafa',
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.9))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  };

  const scheduleTypes = [
    { value: 'regular', label: 'Regular Shift' },
    { value: 'overtime', label: 'Overtime' },
    { value: 'flexible', label: 'Flexible Hours' },
    { value: 'remote', label: 'Remote Work' }
  ];

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const startOfMonth = moment(selectedDate).startOf('month');
      const endOfMonth = moment(selectedDate).endOf('month');
      const data = await getMySchedules(startOfMonth.format('YYYY-MM-DD'), endOfMonth.format('YYYY-MM-DD'));
      setSchedules(data);
      setError(null);
    } catch (err) {
      setError('Failed to load schedules');
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the schedule
    const errors = validateSchedule(formData, schedules);
    setValidationErrors(errors);

    if (errors.length > 0) {
      // If there are conflicts, generate suggestions
      if (errors.some(error => error.conflicts)) {
        const newSuggestions = suggestAlternativeSchedules(formData, schedules);
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
        return;
      }
      return;
    }

    // Check working hours limit
    if (checkWorkingHoursLimit(formData)) {
      if (!window.confirm('This schedule exceeds 40 hours per week. Do you want to proceed?')) {
        return;
      }
    }

    try {
      setLoading(true);
      if (selectedSchedule) {
        await updateSchedule(selectedSchedule._id, formData);
        showNotification('Schedule updated successfully');
      } else {
        await createSchedule(formData);
        showNotification('Schedule created successfully');
      }
      await fetchSchedules();
      setOpenDialog(false);
      setSelectedSchedule(null);
      resetForm();
      setError(null);
    } catch (err) {
      setError('Failed to save schedule');
      showNotification('Failed to save schedule', 'error');
      console.error('Error saving schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      startDate: moment(),
      endDate: moment(),
      startTime: moment().set({ hour: 9, minute: 0 }),
      endTime: moment().set({ hour: 17, minute: 0 }),
      type: 'regular',
      notes: '',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
    setValidationErrors([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion) => {
    setFormData(suggestion.schedule);
    setShowSuggestions(false);
    setValidationErrors([]);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteSchedule(id);
      await fetchSchedules();
      setError(null);
    } catch (err) {
      setError('Failed to delete schedule');
      console.error('Error deleting schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      startDate: moment(schedule.startDate),
      endDate: moment(schedule.endDate),
      startTime: moment(schedule.startTime, 'HH:mm'),
      endTime: moment(schedule.endTime, 'HH:mm'),
      type: schedule.type,
      notes: schedule.notes || '',
      days: schedule.days
    });
    setOpenDialog(true);
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const filteredSchedules = schedules.filter(schedule => 
    schedule.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDateClick = (date) => {
    setExpandedDate(expandedDate === date.format('YYYY-MM-DD') ? null : date.format('YYYY-MM-DD'));
  };

  const isWeekend = (date) => {
    const day = date.day();
    return day === 0 || day === 6;
  };

  const isPastDate = (date) => {
    return moment(date).startOf('day').isBefore(moment().startOf('day'));
  };

  const isValidScheduleDate = (date) => {
    if (!isAdmin && !isManager) {
      return !isPastDate(date);
    }
    return true;
  };

  const handleDragStart = (e, schedule) => {
    e.stopPropagation();
    setDraggedSchedule(schedule);
  };

  const handleDragOver = (e, date) => {
    e.preventDefault();
    setHoveredDate(date.format('YYYY-MM-DD'));
  };

  const handleDrop = async (e, date) => {
    e.preventDefault();
    if (!draggedSchedule || !isValidScheduleDate(date)) return;

    const daysDiff = moment(date).diff(moment(draggedSchedule.startDate), 'days');
    const newStartDate = moment(draggedSchedule.startDate).add(daysDiff, 'days');
    const newEndDate = moment(draggedSchedule.endDate).add(daysDiff, 'days');

    try {
      await updateSchedule(draggedSchedule._id, {
        ...draggedSchedule,
        startDate: newStartDate,
        endDate: newEndDate
      });
      showNotification('Schedule moved successfully');
      fetchSchedules();
    } catch (err) {
      showNotification('Failed to move schedule', 'error');
    }

    setDraggedSchedule(null);
    setHoveredDate(null);
  };

  const getDaysInMonth = () => {
    const days = [];
    const firstDay = moment(selectedDate).startOf('month');
    const lastDay = moment(selectedDate).endOf('month');
    
    // Get the first day of the first week (might be from previous month)
    const startDate = moment(firstDay).startOf('week');
    // Get the last day of the last week (might be from next month)
    const endDate = moment(lastDay).endOf('week');
    
    let currentDate = startDate.clone();
    
    while (currentDate.isSameOrBefore(endDate)) {
      days.push({
        date: currentDate.clone(),
        isCurrentMonth: currentDate.month() === selectedDate.month(),
        isToday: currentDate.isSame(moment(), 'day')
      });
      currentDate.add(1, 'days');
    }
    
    // Group days into weeks
    const weeks = [];
    let week = [];
    
    days.forEach((day) => {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });
    
    return weeks;
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      if (!schedule || !schedule.startDate || !schedule.endDate || !schedule.days) return false;
      const scheduleStart = moment(schedule.startDate);
      const scheduleEnd = moment(schedule.endDate);
      const dayOfWeek = date.format('dddd').toLowerCase();
      
      return date.isBetween(scheduleStart, scheduleEnd, 'day', '[]') && 
             schedule.days.includes(dayOfWeek);
    });
  };

  const renderCalendarDay = ({ date, isCurrentMonth, isToday }) => {
    const daySchedules = getSchedulesForDate(date).filter(schedule =>
      schedule && (
        searchTerm === '' || 
        (schedule.notes && schedule.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (schedule.type && schedule.type.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
    
    const isExpanded = expandedDate === date.format('YYYY-MM-DD');
    const isWeekendDay = isWeekend(date);
    const isPast = isPastDate(date);
    const isHovered = hoveredDate === date.format('YYYY-MM-DD');
    
    return (
      <Grid item xs key={date.format('YYYY-MM-DD')}>
        <Paper 
          onClick={() => handleDateClick(date)}
          onDragOver={(e) => handleDragOver(e, date)}
          onDrop={(e) => handleDrop(e, date)}
          sx={{ 
            p: 1.5,
            minHeight: isExpanded ? 200 : { xs: 100, sm: 120 },
            height: '100%',
            bgcolor: isHovered
              ? alpha(baseTheme.palette.primary.main, 0.15)
              : isToday 
                ? alpha(baseTheme.palette.primary.main, 0.1)
                : isCurrentMonth 
                  ? isWeekendDay
                    ? baseTheme.palette.mode === 'dark' 
                      ? alpha(baseTheme.palette.grey[800], 0.8)
                      : alpha('#f5f5f5', 0.8)
                    : baseTheme.palette.mode === 'dark'
                      ? alpha(baseTheme.palette.grey[900], 0.5)
                      : alpha(baseTheme.palette.background.paper, 0.8)
                  : baseTheme.palette.mode === 'dark'
                    ? alpha(baseTheme.palette.grey[900], 0.2)
                    : alpha('#eeeeee', 0.3),
            borderRadius: '0 0 16px 16px',
            opacity: isCurrentMonth ? (isPast ? 0.7 : 1) : 0.5,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: isValidScheduleDate(date) ? 'pointer' : 'not-allowed',
            position: 'relative',
            border: '1px solid',
            borderColor: isToday 
              ? baseTheme.palette.primary.main 
              : isHovered
                ? baseTheme.palette.primary.main
                : baseTheme.palette.mode === 'dark'
                  ? alpha(baseTheme.palette.grey[700], 0.3)
                  : alpha(baseTheme.palette.divider, 0.1),
            '&:hover': {
              transform: isValidScheduleDate(date) ? 'translateY(-2px)' : 'none',
              boxShadow: isValidScheduleDate(date) 
                ? `0 4px 20px 0 ${alpha(baseTheme.palette.primary.main, 0.1)}`
                : 'none',
              bgcolor: isToday 
                ? alpha(baseTheme.palette.primary.main, 0.2)
                : baseTheme.palette.mode === 'dark'
                  ? alpha(baseTheme.palette.grey[800], 0.8)
                  : alpha(baseTheme.palette.background.paper, 0.9)
            },
            '&::before': isPast && !isAdmin && !isManager ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: baseTheme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.1)',
              zIndex: 1,
              pointerEvents: 'none'
            } : {}
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 1
          }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Badge
                color={isToday ? 'primary' : 'default'}
                variant={isToday ? 'dot' : 'standard'}
                sx={{ 
                  '& .MuiBadge-dot': {
                    transform: 'translate(4px, -4px)'
                  }
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: isToday ? 700 : 500,
                    color: isToday 
                      ? 'primary.main' 
                      : isWeekendDay
                        ? baseTheme.palette.mode === 'dark'
                          ? baseTheme.palette.error.light
                          : baseTheme.palette.error.main
                        : baseTheme.palette.mode === 'dark'
                          ? baseTheme.palette.text.primary
                          : baseTheme.palette.text.primary
                  }}
                >
                  {date.format('D')}
                </Typography>
              </Badge>
              {isPast && !isAdmin && !isManager && (
                <Tooltip title="Past date">
                  <InfoIcon 
                    sx={{ 
                      fontSize: '0.875rem', 
                      color: baseTheme.palette.mode === 'dark'
                        ? baseTheme.palette.text.secondary
                        : baseTheme.palette.text.secondary
                    }} 
                  />
                </Tooltip>
              )}
            </Stack>
            {daySchedules.length > 0 && (
              <Chip
                size="small"
                label={`${daySchedules.length} ${daySchedules.length === 1 ? 'shift' : 'shifts'}`}
                color="primary"
                variant={baseTheme.palette.mode === 'dark' ? 'filled' : 'outlined'}
                sx={{ 
                  height: 20,
                  fontSize: '0.7rem',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
          </Box>

          <Fade in={isExpanded || daySchedules.length > 0}>
            <Stack 
              spacing={0.5} 
              sx={{ 
                maxHeight: isExpanded ? 160 : { xs: 60, sm: 80 },
                overflowY: 'auto',
                transition: 'max-height 0.3s ease-in-out',
                '&::-webkit-scrollbar': {
                  width: '4px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(baseTheme.palette.primary.main, 0.2),
                  borderRadius: '4px'
                }
              }}
            >
              {daySchedules.length > 0 ? (
                daySchedules.map((schedule) => {
                  if (!schedule || !schedule.type) return null;
                  return (
                    <Tooltip
                      key={schedule._id}
                      title={
                        <React.Fragment>
                          <Typography variant="subtitle2">
                            {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} Schedule
                          </Typography>
                          <Typography variant="body2">
                            {schedule.startTime} - {schedule.endTime}
                          </Typography>
                          {schedule.notes && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              Note: {schedule.notes}
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                      arrow
                      placement="top"
                    >
                      <Chip
                        draggable={isAdmin || isManager}
                        onDragStart={(e) => handleDragStart(e, schedule)}
                        label={
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.75rem'
                          }}>
                            <TimeIcon sx={{ fontSize: '0.875rem' }} />
                            {schedule.startTime} - {schedule.endTime}
                          </Box>
                        }
                        size="small"
                        color={
                          schedule.type === 'regular' ? 'primary' :
                          schedule.type === 'overtime' ? 'error' :
                          schedule.type === 'flexible' ? 'warning' : 'success'
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPast && !isAdmin && !isManager) {
                            showNotification("Cannot edit past schedules", "error");
                            return;
                          }
                          handleEdit(schedule);
                        }}
                        onDelete={
                          (isAdmin || isManager) 
                            ? (e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this schedule?')) {
                                  handleDelete(schedule._id);
                                }
                              }
                            : undefined
                        }
                        sx={{ 
                          borderRadius: 2,
                          width: '100%',
                          justifyContent: 'flex-start',
                          transition: 'all 0.2s',
                          cursor: isPast && !isAdmin && !isManager ? 'not-allowed' : 'pointer',
                          opacity: isPast && !isAdmin && !isManager ? 0.7 : 1,
                          '&:hover': {
                            transform: isPast && !isAdmin && !isManager ? 'none' : 'scale(1.02)',
                            bgcolor: alpha(
                              schedule.type === 'regular' ? baseTheme.palette.primary.main :
                              schedule.type === 'overtime' ? baseTheme.palette.error.main :
                              schedule.type === 'flexible' ? baseTheme.palette.warning.main :
                              baseTheme.palette.success.main,
                              0.1
                            )
                          },
                          '& .MuiChip-label': {
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        }}
                      />
                    </Tooltip>
                  );
                })
              ) : (
                isCurrentMonth && isExpanded && (
                  <Box 
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      py: 2
                    }}
                  >
                    <InfoIcon sx={{ color: 'text.secondary', fontSize: '2rem' }} />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        textAlign: 'center'
                      }}
                    >
                      No schedules for this day
                      {(isAdmin || isManager || !isPast) && (
                        <Box component="span" sx={{ display: 'block', mt: 1 }}>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isPast && !isAdmin && !isManager) {
                                showNotification("Cannot add schedule to past dates", "error");
                                return;
                              }
                              setSelectedSchedule(null);
                              setFormData(prev => ({
                                ...prev,
                                startDate: date,
                                endDate: date
                              }));
                              setOpenDialog(true);
                            }}
                            disabled={isPast && !isAdmin && !isManager}
                          >
                            Add Schedule
                          </Button>
                        </Box>
                      )}
                    </Typography>
                  </Box>
                )
              )}
            </Stack>
          </Fade>
        </Paper>
      </Grid>
    );
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      // Update selected dates based on view mode
      if (newMode === 'day') {
        setSelectedDay(moment(selectedDate));
      } else if (newMode === 'week') {
        setSelectedWeek(moment(selectedDate).startOf('week'));
      }
    }
  };

  const renderViewModeSelector = () => (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={handleViewModeChange}
      aria-label="view mode"
      size="small"
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        '& .MuiToggleButton-root': {
          border: 'none',
          mx: 0.5,
          borderRadius: 2,
          '&.Mui-selected': {
            bgcolor: alpha(baseTheme.palette.primary.main, 0.1),
            color: 'primary.main',
            '&:hover': {
              bgcolor: alpha(baseTheme.palette.primary.main, 0.2),
            },
          },
        },
      }}
    >
      <ToggleButton value="day" aria-label="day view">
        <Tooltip title="Day view">
          <DayViewIcon />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="week" aria-label="week view">
        <Tooltip title="Week view">
          <WeekViewIcon />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="month" aria-label="month view">
        <Tooltip title="Month view">
          <MonthViewIcon />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="list" aria-label="list view">
        <Tooltip title="List view">
          <ListViewIcon />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'list':
        return renderListView();
      default:
        return (
          <Box sx={{ position: 'relative' }}>
            <Grid container spacing={1}>
              {getDaysInMonth().map((week, weekIndex) => (
                <React.Fragment key={`week-${weekIndex}`}>
                  {week.map((dayInfo) => renderCalendarDay(dayInfo))}
                </React.Fragment>
              ))}
            </Grid>
          </Box>
        );
    }
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const daySchedules = getSchedulesForDate(selectedDay);

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          {selectedDay.format('dddd, MMMM D, YYYY')}
        </Typography>
        <Paper 
          sx={{ 
            p: 2,
            bgcolor: baseTheme.palette.mode === 'dark' 
              ? alpha(baseTheme.palette.background.paper, 0.8)
              : 'background.paper',
          }}
        >
          <Stack spacing={0}>
            {hours.map((hour) => {
              const time = moment().set({ hour, minute: 0, second: 0 });
              const currentHourSchedules = daySchedules.filter(schedule => {
                const startTime = moment(schedule.startTime, 'HH:mm');
                const endTime = moment(schedule.endTime, 'HH:mm');
                return startTime.hour() <= hour && endTime.hour() > hour;
              });

              return (
                <Box
                  key={hour}
                  sx={{
                    display: 'flex',
                    borderBottom: 1,
                    borderColor: 'divider',
                    minHeight: 80,
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      py: 1,
                      pr: 2,
                      borderRight: 1,
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      {time.format('HH:mm')}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 1 }}>
                    <Stack spacing={1}>
                      {currentHourSchedules.map((schedule) => (
                        <Zoom in key={schedule._id}>
                          <Chip
                            label={
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 1,
                              }}>
                                <TimeIcon sx={{ fontSize: '0.875rem' }} />
                                <Typography variant="body2">
                                  {schedule.startTime} - {schedule.endTime}
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ 
                                      ml: 1,
                                      color: 'text.secondary',
                                      fontStyle: 'italic'
                                    }}
                                  >
                                    ({schedule.type})
                                  </Typography>
                                </Typography>
                              </Box>
                            }
                            color={
                              schedule.type === 'regular' ? 'primary' :
                              schedule.type === 'overtime' ? 'error' :
                              schedule.type === 'flexible' ? 'warning' : 'success'
                            }
                            onClick={() => handleEdit(schedule)}
                            onDelete={
                              (isAdmin || isManager) 
                                ? () => {
                                    if (window.confirm('Are you sure you want to delete this schedule?')) {
                                      handleDelete(schedule._id);
                                    }
                                  }
                                : undefined
                            }
                            sx={{ 
                              width: '100%',
                              height: 'auto',
                              '& .MuiChip-label': {
                                display: 'block',
                                whiteSpace: 'normal',
                                py: 1,
                              },
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: alpha(
                                  schedule.type === 'regular' ? baseTheme.palette.primary.main :
                                  schedule.type === 'overtime' ? baseTheme.palette.error.main :
                                  schedule.type === 'flexible' ? baseTheme.palette.warning.main :
                                  baseTheme.palette.success.main,
                                  0.1
                                ),
                              },
                            }}
                          />
                        </Zoom>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Paper>
      </Box>
    );
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = selectedWeek.clone().startOf('week');
    for (let i = 0; i < 7; i++) {
      dates.push(startOfWeek.clone().add(i, 'days'));
    }
    return dates;
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          Week of {selectedWeek.format('MMMM D, YYYY')}
        </Typography>
        <Paper 
          sx={{ 
            p: 2,
            bgcolor: baseTheme.palette.mode === 'dark' 
              ? alpha(baseTheme.palette.background.paper, 0.8)
              : 'background.paper',
            overflow: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', minWidth: 800 }}>
            {/* Time column */}
            <Box sx={{ width: 60, flexShrink: 0 }}>
              <Box sx={{ height: 50 }} /> {/* Header spacer */}
              {hours.map((hour) => (
                <Box
                  key={hour}
                  sx={{
                    height: 80,
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    pr: 2,
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      pt: 1,
                    }}
                  >
                    {moment().set({ hour, minute: 0 }).format('HH:mm')}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Day columns */}
            {weekDates.map((date) => {
              const daySchedules = getSchedulesForDate(date);
              const isToday = date.isSame(moment(), 'day');
              const isWeekend = [0, 6].includes(date.day());

              return (
                <Box
                  key={date.format('YYYY-MM-DD')}
                  sx={{
                    flex: 1,
                    minWidth: 120,
                    borderLeft: 1,
                    borderColor: 'divider',
                  }}
                >
                  {/* Day header */}
                  <Box
                    sx={{
                      height: 50,
                      p: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                      bgcolor: isToday 
                        ? alpha(baseTheme.palette.primary.main, 0.1)
                        : 'transparent',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: isWeekend ? 'error.main' : 'text.primary',
                        fontWeight: isToday ? 700 : 500,
                      }}
                    >
                      {date.format('ddd')}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isToday ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      {date.format('MMM D')}
                    </Typography>
                  </Box>

                  {/* Hour cells */}
                  {hours.map((hour) => {
                    const currentHourSchedules = daySchedules.filter(schedule => {
                      const startTime = moment(schedule.startTime, 'HH:mm');
                      const endTime = moment(schedule.endTime, 'HH:mm');
                      return startTime.hour() <= hour && endTime.hour() > hour;
                    });

                    return (
                      <Box
                        key={hour}
                        sx={{
                          height: 80,
                          borderBottom: 1,
                          borderColor: 'divider',
                          p: 0.5,
                          '&:last-child': {
                            borderBottom: 'none',
                          },
                        }}
                      >
                        <Stack spacing={0.5}>
                          {currentHourSchedules.map((schedule) => (
                            <Zoom in key={schedule._id}>
                              <Chip
                                size="small"
                                label={
                                  <Typography variant="caption" noWrap>
                                    {schedule.startTime} - {schedule.endTime}
                                  </Typography>
                                }
                                color={
                                  schedule.type === 'regular' ? 'primary' :
                                  schedule.type === 'overtime' ? 'error' :
                                  schedule.type === 'flexible' ? 'warning' : 'success'
                                }
                                onClick={() => handleEdit(schedule)}
                                onDelete={
                                  (isAdmin || isManager) 
                                    ? () => {
                                        if (window.confirm('Are you sure you want to delete this schedule?')) {
                                          handleDelete(schedule._id);
                                        }
                                      }
                                    : undefined
                                }
                                sx={{ 
                                  width: '100%',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: alpha(
                                      schedule.type === 'regular' ? baseTheme.palette.primary.main :
                                      schedule.type === 'overtime' ? baseTheme.palette.error.main :
                                      schedule.type === 'flexible' ? baseTheme.palette.warning.main :
                                      baseTheme.palette.success.main,
                                      0.1
                                    ),
                                  },
                                }}
                              />
                            </Zoom>
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderListView = () => {
    const filteredSchedules = schedules
      .filter(schedule => 
        searchTerm === '' || 
        (schedule.notes && schedule.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (schedule.type && schedule.type.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => moment(a.startDate).diff(moment(b.startDate)));

    return (
      <Box>
        <Paper 
          sx={{ 
            p: 2,
            bgcolor: baseTheme.palette.mode === 'dark' 
              ? alpha(baseTheme.palette.background.paper, 0.8)
              : 'background.paper',
            overflow: 'auto'
          }}
        >
          {filteredSchedules.length > 0 ? (
            <Stack spacing={2}>
              {filteredSchedules.map((schedule) => {
                const startDate = moment(schedule.startDate);
                const endDate = moment(schedule.endDate);
                const isPast = isPastDate(startDate);

                return (
                  <Zoom in key={schedule._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: baseTheme.palette.mode === 'dark'
                          ? alpha(baseTheme.palette.background.default, 0.5)
                          : alpha(baseTheme.palette.background.default, 0.5),
                        opacity: isPast && !isAdmin && !isManager ? 0.7 : 1,
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: baseTheme.palette.mode === 'dark'
                            ? alpha(baseTheme.palette.background.default, 0.8)
                            : alpha(baseTheme.palette.background.default, 0.8),
                          transform: isPast && !isAdmin && !isManager ? 'none' : 'translateY(-2px)',
                        }
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Date Range
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CalendarIcon sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
                              <Typography>
                                {startDate.format('MMM D')} - {endDate.format('MMM D, YYYY')}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Time
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TimeIcon sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
                              <Typography>
                                {schedule.startTime} - {schedule.endTime}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Working Days
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {schedule.days.map((day) => (
                                <Chip
                                  key={day}
                                  label={day.slice(0, 3)}
                                  size="small"
                                  variant={baseTheme.palette.mode === 'dark' ? 'filled' : 'outlined'}
                                  sx={{ 
                                    borderRadius: 1,
                                    height: 24,
                                    '& .MuiChip-label': { px: 1 }
                                  }}
                                />
                              ))}
                            </Stack>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={2}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Chip
                              label={schedule.type}
                              size="small"
                              color={
                                schedule.type === 'regular' ? 'primary' :
                                schedule.type === 'overtime' ? 'error' :
                                schedule.type === 'flexible' ? 'warning' : 'success'
                              }
                              sx={{ borderRadius: 2 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(schedule)}
                              disabled={isPast && !isAdmin && !isManager}
                              sx={{
                                color: 'primary.main',
                                bgcolor: alpha(baseTheme.palette.primary.main, 0.1),
                                '&:hover': {
                                  bgcolor: alpha(baseTheme.palette.primary.main, 0.2),
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {(isAdmin || isManager) && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this schedule?')) {
                                    handleDelete(schedule._id);
                                  }
                                }}
                                sx={{
                                  color: 'error.main',
                                  bgcolor: alpha(baseTheme.palette.error.main, 0.1),
                                  '&:hover': {
                                    bgcolor: alpha(baseTheme.palette.error.main, 0.2),
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </Grid>

                        {schedule.notes && (
                          <Grid item xs={12}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 1,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: alpha(baseTheme.palette.primary.main, 0.05),
                                borderLeft: 3,
                                borderColor: 'primary.main'
                              }}
                            >
                              {schedule.notes}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Zoom>
                );
              })}
            </Stack>
          ) : (
            <Box 
              sx={{ 
                py: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <InfoIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                No schedules found
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start by adding a new schedule'}
              </Typography>
              {(isAdmin || isManager) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedSchedule(null);
                    setOpenDialog(true);
                  }}
                  sx={{ 
                    mt: 2,
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                  }}
                >
                  New Schedule
                </Button>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewData(null);
  };

  const handleCustomRangeClose = () => {
    setCustomRangeOpen(false);
  };

  const getExportData = (period) => {
    let exportSchedules = [];
    let fileName = '';

    switch (period) {
      case 'current':
        exportSchedules = schedules;
        fileName = `schedules_${selectedDate.format('YYYY_MM')}`;
        break;
      case 'month':
        const startOfMonth = moment(selectedDate).startOf('month');
        const endOfMonth = moment(selectedDate).endOf('month');
        exportSchedules = schedules.filter(schedule => 
          moment(schedule.startDate).isBetween(startOfMonth, endOfMonth, 'day', '[]')
        );
        fileName = `schedules_${selectedDate.format('YYYY_MM')}`;
        break;
      case 'week':
        const startOfWeek = moment(selectedWeek).startOf('week');
        const endOfWeek = moment(selectedWeek).endOf('week');
        exportSchedules = schedules.filter(schedule => 
          moment(schedule.startDate).isBetween(startOfWeek, endOfWeek, 'day', '[]')
        );
        fileName = `schedules_week_${startOfWeek.format('YYYY_MM_DD')}`;
        break;
      case 'custom':
        const customStart = moment(customDateRange.startDate).startOf('day');
        const customEnd = moment(customDateRange.endDate).endOf('day');
        exportSchedules = schedules.filter(schedule => 
          moment(schedule.startDate).isBetween(customStart, customEnd, 'day', '[]')
        );
        fileName = `schedules_${customStart.format('YYYY_MM_DD')}_to_${customEnd.format('YYYY_MM_DD')}`;
        break;
      case 'all':
        exportSchedules = schedules;
        fileName = `all_schedules_${moment().format('YYYY_MM_DD')}`;
        break;
      default:
        exportSchedules = schedules;
        fileName = `schedules_${moment().format('YYYY_MM_DD')}`;
    }

    return { schedules: exportSchedules, fileName };
  };

  const exportToCSV = (period) => {
    const { schedules: exportSchedules, fileName } = getExportData(period);
    
    const headers = ['Start Date', 'End Date', 'Start Time', 'End Time', 'Type', 'Working Days', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...exportSchedules.map(schedule => [
        moment(schedule.startDate).format('YYYY-MM-DD'),
        moment(schedule.endDate).format('YYYY-MM-DD'),
        schedule.startTime,
        schedule.endTime,
        schedule.type,
        schedule.days.join(';'),
        `"${(schedule.notes || '').replace(/"/g, '""')}"` // Escape quotes in notes
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleExportClose();
    showNotification('Schedule exported successfully as CSV');
  };

  const exportToJSON = (period) => {
    const { schedules: exportSchedules, fileName } = getExportData(period);
    
    const jsonContent = JSON.stringify(exportSchedules, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${fileName}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleExportClose();
    showNotification('Schedule exported successfully as JSON');
  };

  const exportToExcel = (period) => {
    const { schedules: exportSchedules, fileName } = getExportData(period);
    
    const worksheet = XLSX.utils.json_to_sheet(exportSchedules.map(schedule => ({
      'Start Date': moment(schedule.startDate).format('YYYY-MM-DD'),
      'End Date': moment(schedule.endDate).format('YYYY-MM-DD'),
      'Start Time': schedule.startTime,
      'End Time': schedule.endTime,
      'Type': schedule.type,
      'Working Days': schedule.days.join(', '),
      'Notes': schedule.notes || ''
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedules');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(data, `${fileName}.xlsx`);
    handleExportClose();
    showNotification('Schedule exported successfully as Excel');
  };

  const previewExport = (period) => {
    const { schedules: exportSchedules } = getExportData(period);
    setPreviewData(exportSchedules);
    setPreviewOpen(true);
    handleExportClose();
  };

  const handleExport = (period) => {
    switch (exportFormat) {
      case 'csv':
        exportToCSV(period);
        break;
      case 'json':
        exportToJSON(period);
        break;
      case 'excel':
        exportToExcel(period);
        break;
      default:
        exportToCSV(period);
    }
  };

  if (loading && schedules.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2 },
        transition: 'background 0.3s ease-in-out',
      }}
      role="main"
      aria-label="Schedule Management"
    >
      <Container maxWidth="lg">
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: theme => `0 4px 20px ${alpha(theme.palette.error.main, 0.1)}`
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Card sx={{ 
          mb: 4,
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          bgcolor: alpha(customTheme.palette.background.paper, 0.8),
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }}>
          <CardContent sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            py: 3
          }}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #64B5F6 30%, #81D4FA 90%)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Work Schedule
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CalendarIcon fontSize="small" />
                {selectedDate.format('MMMM YYYY')}
              </Typography>
            </Box>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              width={{ xs: '100%', sm: 'auto' }}
              alignItems="center"
            >
              {renderViewModeSelector()}
              <TextField
                placeholder="Search schedules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3 }
                }}
                sx={{ 
                  minWidth: { sm: 200 },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper'
                  }
                }}
              />
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportClick}
                sx={{ 
                  borderRadius: 3,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: alpha(baseTheme.palette.primary.main, 0.1),
                  }
                }}
              >
                Export
              </Button>

              {(isAdmin || isManager) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedSchedule(null);
                    setOpenDialog(true);
                  }}
                  sx={{ 
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 5px 15px 2px rgba(33, 203, 243, .4)'
                    }
                  }}
                >
                  New Schedule
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ 
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          bgcolor: alpha(customTheme.palette.background.paper, 0.8),
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          overflow: 'hidden'
        }}>
          <CardContent>
            <Box 
              sx={{ 
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton
                  onClick={() => setSelectedDate(moment(selectedDate).subtract(1, 'month'))}
                  aria-label="Previous month"
                  sx={{
                    '&:hover': {
                      bgcolor: alpha(customTheme.palette.primary.main, 0.2)
                    }
                  }}
                >
                  <PrevIcon />
                </IconButton>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    views={['year', 'month']}
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        sx={{ 
                          width: 200,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: 'background.paper'
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
                <IconButton
                  onClick={() => setSelectedDate(moment(selectedDate).add(1, 'month'))}
                  aria-label="Next month"
                  sx={{
                    '&:hover': {
                      bgcolor: alpha(customTheme.palette.primary.main, 0.2)
                    }
                  }}
                >
                  <NextIcon />
                </IconButton>
              </Stack>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {scheduleTypes.map((type) => (
                  <Tooltip 
                    key={type.value} 
                    title={`${type.label} schedule`}
                    arrow
                  >
                    <Chip
                      label={type.label}
                      size="small"
                      color={
                        type.value === 'regular' ? 'primary' :
                        type.value === 'overtime' ? 'error' :
                        type.value === 'flexible' ? 'warning' : 'success'
                      }
                      sx={{ 
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-2px)'
                        },
                        transition: 'transform 0.2s'
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>

            {renderContent()}
          </CardContent>
        </Card>

        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              bgcolor: alpha(customTheme.palette.background.paper, 0.95),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedSchedule ? 'Edit Schedule' : 'New Schedule'}
            </Typography>
            <IconButton onClick={() => {
              setOpenDialog(false);
              resetForm();
            }} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pb: 2 }}>
              <Stack spacing={3}>
                {validationErrors.length > 0 && (
                  <Alert 
                    severity="error"
                    sx={{ 
                      borderRadius: 2,
                      '& .MuiAlert-message': { width: '100%' }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Please correct the following errors:
                    </Typography>
                    <Stack spacing={1}>
                      {validationErrors.map((error, index) => (
                        <Typography key={index} variant="body2">
                          • {error.message}
                          {error.conflicts && (
                            <Button
                              size="small"
                              onClick={() => setShowSuggestions(true)}
                              sx={{ ml: 1 }}
                            >
                              View Suggestions
                            </Button>
                          )}
                        </Typography>
                      ))}
                    </Stack>
                  </Alert>
                )}

                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Start Date"
                        value={formData.startDate}
                        onChange={(newValue) => setFormData({ ...formData, startDate: newValue })}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="End Date"
                        value={formData.endDate}
                        onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                          />
                        )}
                        minDate={formData.startDate}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TimePicker
                        label="Start Time"
                        value={formData.startTime}
                        onChange={(newValue) => setFormData({ ...formData, startTime: newValue })}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TimePicker
                        label="End Time"
                        value={formData.endTime}
                        onChange={(newValue) => setFormData({ ...formData, endTime: newValue })}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth
                            required
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider>

                <TextField
                  select
                  label="Schedule Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                >
                  {scheduleTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Working Days
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {weekDays.map((day) => (
                      <Chip
                        key={day.value}
                        label={day.label.slice(0, 3)}
                        color={formData.days.includes(day.value) ? 'primary' : 'default'}
                        onClick={() => {
                          const newDays = formData.days.includes(day.value)
                            ? formData.days.filter(d => d !== day.value)
                            : [...formData.days, day.value];
                          setFormData({ ...formData, days: newDays });
                        }}
                        sx={{ 
                          borderRadius: 2,
                          m: 0.5
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                <TextField
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={3}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Suggested Alternatives:
                    </Typography>
                    <Stack spacing={1}>
                      {suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outlined"
                          size="small"
                          onClick={() => handleSuggestionSelect(suggestion)}
                          sx={{ 
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            borderRadius: 2
                          }}
                        >
                          {suggestion.message}
                        </Button>
                      ))}
                    </Stack>
                  </Paper>
                )}

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Working Hours: {calculateWorkingHours(formData).toFixed(1)} hours
                    {checkWorkingHoursLimit(formData) && (
                      <Typography 
                        variant="caption" 
                        color="error" 
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        Warning: Exceeds 40 hours per week
                      </Typography>
                    )}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={() => {
                  setOpenDialog(false);
                  resetForm();
                }}
                sx={{ 
                  borderRadius: 3,
                  px: 3
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                }}
              >
                {selectedSchedule ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={handleExportClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              borderRadius: 2,
              minWidth: 200,
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            }
          }}
        >
          <MenuItem sx={{ typography: 'subtitle2', color: 'text.secondary', cursor: 'default' }}>
            Export Format
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setExportFormat('csv')}>
            <ListItemIcon>
              <RadioButtonChecked 
                fontSize="small"
                sx={{ 
                  visibility: exportFormat === 'csv' ? 'visible' : 'hidden',
                  color: 'primary.main'
                }}
              />
            </ListItemIcon>
            CSV Format
          </MenuItem>
          <MenuItem onClick={() => setExportFormat('excel')}>
            <ListItemIcon>
              <RadioButtonChecked 
                fontSize="small"
                sx={{ 
                  visibility: exportFormat === 'excel' ? 'visible' : 'hidden',
                  color: 'primary.main'
                }}
              />
            </ListItemIcon>
            Excel Format
          </MenuItem>
          <MenuItem onClick={() => setExportFormat('json')}>
            <ListItemIcon>
              <RadioButtonChecked 
                fontSize="small"
                sx={{ 
                  visibility: exportFormat === 'json' ? 'visible' : 'hidden',
                  color: 'primary.main'
                }}
              />
            </ListItemIcon>
            JSON Format
          </MenuItem>
          <Divider />
          <MenuItem sx={{ typography: 'subtitle2', color: 'text.secondary', cursor: 'default' }}>
            Export Period
          </MenuItem>
          <MenuItem onClick={() => handleExport('current')}>
            Current View
          </MenuItem>
          <MenuItem onClick={() => handleExport('month')}>
            Current Month
          </MenuItem>
          <MenuItem onClick={() => handleExport('week')}>
            Current Week
          </MenuItem>
          <MenuItem onClick={() => setCustomRangeOpen(true)}>
            Custom Range...
          </MenuItem>
          <MenuItem onClick={() => handleExport('all')}>
            All Schedules
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => previewExport(exportPeriod)}>
            <ListItemIcon>
              <PreviewIcon fontSize="small" />
            </ListItemIcon>
            Preview Export
          </MenuItem>
        </Menu>

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={handlePreviewClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: alpha(customTheme.palette.background.paper, 0.95),
            }
          }}
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Export Preview</Typography>
              <IconButton onClick={handlePreviewClose} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Working Days</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData?.map((schedule, index) => (
                    <TableRow key={index}>
                      <TableCell>{moment(schedule.startDate).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{moment(schedule.endDate).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{schedule.startTime} - {schedule.endTime}</TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.type}
                          size="small"
                          color={
                            schedule.type === 'regular' ? 'primary' :
                            schedule.type === 'overtime' ? 'error' :
                            schedule.type === 'flexible' ? 'warning' : 'success'
                          }
                        />
                      </TableCell>
                      <TableCell>{schedule.days.join(', ')}</TableCell>
                      <TableCell>{schedule.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePreviewClose}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                handleExport(exportPeriod);
                handlePreviewClose();
              }}
              startIcon={<FileDownloadIcon />}
            >
              Export
            </Button>
          </DialogActions>
        </Dialog>

        {/* Custom Date Range Dialog */}
        <Dialog
          open={customRangeOpen}
          onClose={handleCustomRangeClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: alpha(customTheme.palette.background.paper, 0.95),
            }
          }}
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Custom Date Range</Typography>
              <IconButton onClick={handleCustomRangeClose} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="Start Date"
                  value={customDateRange.startDate}
                  onChange={(newValue) => setCustomDateRange(prev => ({ ...prev, startDate: newValue }))}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                />
                <DatePicker
                  label="End Date"
                  value={customDateRange.endDate}
                  onChange={(newValue) => setCustomDateRange(prev => ({ ...prev, endDate: newValue }))}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                  minDate={customDateRange.startDate}
                />
              </LocalizationProvider>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCustomRangeClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                handleExport('custom');
                handleCustomRangeClose();
              }}
            >
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Schedule;
