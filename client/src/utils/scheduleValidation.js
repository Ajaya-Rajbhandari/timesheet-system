import moment from 'moment';

/**
 * Check if two time ranges overlap
 */
export const doTimesOverlap = (startTime1, endTime1, startTime2, endTime2) => {
  const start1 = moment(startTime1, 'HH:mm');
  const end1 = moment(endTime1, 'HH:mm');
  const start2 = moment(startTime2, 'HH:mm');
  const end2 = moment(endTime2, 'HH:mm');

  return start1.isBefore(end2) && end1.isAfter(start2);
};

/**
 * Check if two date ranges overlap
 */
export const doDateRangesOverlap = (startDate1, endDate1, startDate2, endDate2) => {
  const start1 = moment(startDate1).startOf('day');
  const end1 = moment(endDate1).endOf('day');
  const start2 = moment(startDate2).startOf('day');
  const end2 = moment(endDate2).endOf('day');

  return start1.isBefore(end2) && end1.isAfter(start2);
};

/**
 * Check if two schedules have overlapping working days
 */
export const haveOverlappingDays = (days1, days2) => {
  return days1.some(day => days2.includes(day));
};

/**
 * Find all schedule conflicts for a given schedule
 */
export const findScheduleConflicts = (schedule, allSchedules) => {
  const conflicts = [];

  for (const existingSchedule of allSchedules) {
    // Skip comparing with itself
    if (existingSchedule._id === schedule._id) continue;

    // Check if date ranges overlap
    const datesOverlap = doDateRangesOverlap(
      schedule.startDate,
      schedule.endDate,
      existingSchedule.startDate,
      existingSchedule.endDate
    );

    if (!datesOverlap) continue;

    // Check if working days overlap
    const daysOverlap = haveOverlappingDays(schedule.days, existingSchedule.days);

    if (!daysOverlap) continue;

    // Check if times overlap
    const timesOverlap = doTimesOverlap(
      schedule.startTime,
      schedule.endTime,
      existingSchedule.startTime,
      existingSchedule.endTime
    );

    if (timesOverlap) {
      conflicts.push({
        conflictingSchedule: existingSchedule,
        type: 'time_overlap',
        message: `Schedule overlaps with existing schedule (${existingSchedule.startTime}-${existingSchedule.endTime})`
      });
    }
  }

  return conflicts;
};

/**
 * Validate a schedule for various constraints
 */
export const validateSchedule = (schedule, allSchedules) => {
  const errors = [];

  // Check if end date is after start date
  if (moment(schedule.endDate).isBefore(moment(schedule.startDate))) {
    errors.push({
      field: 'endDate',
      message: 'End date must be after start date'
    });
  }

  // Check if end time is after start time
  const startTime = moment(schedule.startTime, 'HH:mm');
  const endTime = moment(schedule.endTime, 'HH:mm');
  if (endTime.isSameOrBefore(startTime)) {
    errors.push({
      field: 'endTime',
      message: 'End time must be after start time'
    });
  }

  // Check if at least one working day is selected
  if (!schedule.days || schedule.days.length === 0) {
    errors.push({
      field: 'days',
      message: 'At least one working day must be selected'
    });
  }

  // Find any scheduling conflicts
  const conflicts = findScheduleConflicts(schedule, allSchedules);
  if (conflicts.length > 0) {
    errors.push({
      field: 'time',
      conflicts,
      message: 'Schedule conflicts detected'
    });
  }

  return errors;
};

/**
 * Calculate total working hours for a schedule
 */
export const calculateWorkingHours = (schedule) => {
  const startTime = moment(schedule.startTime, 'HH:mm');
  const endTime = moment(schedule.endTime, 'HH:mm');
  const hoursPerDay = endTime.diff(startTime, 'hours', true);
  
  const startDate = moment(schedule.startDate);
  const endDate = moment(schedule.endDate);
  const totalDays = endDate.diff(startDate, 'days') + 1;
  
  const workingDaysInPeriod = Array.from({ length: totalDays }, (_, i) => {
    const date = startDate.clone().add(i, 'days');
    return date.format('dddd').toLowerCase();
  }).filter(day => schedule.days.includes(day)).length;

  return hoursPerDay * workingDaysInPeriod;
};

/**
 * Check if a schedule exceeds maximum working hours
 */
export const checkWorkingHoursLimit = (schedule, maxHoursPerWeek = 40) => {
  const startTime = moment(schedule.startTime, 'HH:mm');
  const endTime = moment(schedule.endTime, 'HH:mm');
  const hoursPerDay = endTime.diff(startTime, 'hours', true);
  const workingDaysPerWeek = schedule.days.length;
  const hoursPerWeek = hoursPerDay * workingDaysPerWeek;

  return hoursPerWeek > maxHoursPerWeek;
};

/**
 * Suggest alternative schedules when conflicts are detected
 */
export const suggestAlternativeSchedules = (schedule, allSchedules) => {
  const conflicts = findScheduleConflicts(schedule, allSchedules);
  if (conflicts.length === 0) return [];

  const suggestions = [];
  const startTime = moment(schedule.startTime, 'HH:mm');
  const endTime = moment(schedule.endTime, 'HH:mm');
  const duration = endTime.diff(startTime, 'hours', true);

  // Try different time slots
  const timeSlots = [
    { start: '09:00', end: '17:00' },
    { start: '14:00', end: '22:00' },
    { start: '22:00', end: '06:00' }
  ];

  for (const slot of timeSlots) {
    const suggestedSchedule = {
      ...schedule,
      startTime: slot.start,
      endTime: slot.end
    };

    if (findScheduleConflicts(suggestedSchedule, allSchedules).length === 0) {
      suggestions.push({
        type: 'alternative_time',
        schedule: suggestedSchedule,
        message: `Consider changing time to ${slot.start}-${slot.end}`
      });
    }
  }

  // Try different days
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const alternativeDays = allDays.filter(day => !schedule.days.includes(day));

  if (alternativeDays.length > 0) {
    const suggestedSchedule = {
      ...schedule,
      days: alternativeDays.slice(0, schedule.days.length)
    };

    if (findScheduleConflicts(suggestedSchedule, allSchedules).length === 0) {
      suggestions.push({
        type: 'alternative_days',
        schedule: suggestedSchedule,
        message: `Consider changing working days to ${suggestedSchedule.days.join(', ')}`
      });
    }
  }

  return suggestions;
}; 