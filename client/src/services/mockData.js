import moment from 'moment';

// Mock attendance history data
export const mockAttendanceHistory = [
  {
    id: 1,
    date: moment().format('YYYY-MM-DD'),
    clockIn: moment().subtract(3, 'hours').format(),
    clockOut: moment().subtract(1, 'hours').format(),
    status: 'Present'
  },
  {
    id: 2,
    date: moment().subtract(1, 'days').format('YYYY-MM-DD'),
    clockIn: moment().subtract(1, 'days').add(9, 'hours').format(),
    clockOut: moment().subtract(1, 'days').add(17, 'hours').format(),
    status: 'Present'
  },
  {
    id: 3,
    date: moment().subtract(2, 'days').format('YYYY-MM-DD'),
    clockIn: moment().subtract(2, 'days').add(9, 'hours').add(30, 'minutes').format(),
    clockOut: moment().subtract(2, 'days').add(17, 'hours').format(),
    status: 'Late'
  }
];

// Mock current status
export const mockCurrentStatus = {
  isClockedIn: false,
  clockInTime: null,
  clockOutTime: null,
  onBreak: false,
  breakStartTime: null
}; 