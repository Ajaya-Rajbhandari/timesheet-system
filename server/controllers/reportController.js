const Schedule = require('../models/Schedule');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Get report data for schedules
exports.getReportData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const schedules = await Schedule.find({
      userId: req.user.id,
      date: {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      }
    }).populate('userId', 'name');

    res.json({ schedules });
  } catch (error) {
    console.error('Error getting report data:', error);
    res.status(500).json({ message: 'Error getting report data' });
  }
};

// Generate specific type of report
exports.generateReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const reportType = req.params.type;

    const schedules = await Schedule.find({
      userId: req.user.id,
      date: {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      }
    }).populate('userId', 'name');

    let reportData;
    switch (reportType) {
      case 'summary':
        reportData = generateSummaryReport(schedules);
        break;
      case 'detailed':
        reportData = generateDetailedReport(schedules);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({ schedules, ...reportData });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};

// Export report in various formats
exports.exportReport = async (req, res) => {
  try {
    const { format, startDate, endDate, reportType } = req.query;

    const schedules = await Schedule.find({
      userId: req.user.id,
      date: {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      }
    }).populate('userId', 'name');

    let buffer;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'xlsx':
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Schedule Report');

        // Add headers
        worksheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Type', key: 'type', width: 15 },
          { header: 'Start Time', key: 'startTime', width: 15 },
          { header: 'End Time', key: 'endTime', width: 15 },
          { header: 'Working Days', key: 'days', width: 30 },
          { header: 'Notes', key: 'notes', width: 30 }
        ];

        // Add data
        schedules.forEach(schedule => {
          worksheet.addRow({
            date: moment(schedule.date).format('YYYY-MM-DD'),
            type: schedule.type,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            days: schedule.days.join(', '),
            notes: schedule.notes || ''
          });
        });

        buffer = await workbook.xlsx.writeBuffer();
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `schedule_report_${startDate}_${endDate}.xlsx`;
        break;

      case 'pdf':
        const doc = new PDFDocument();
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          buffer = Buffer.concat(chunks);
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
          res.send(buffer);
        });

        // Add title
        doc.fontSize(20).text('Schedule Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
        doc.moveDown();

        // Add summary section if report type is summary
        if (reportType === 'summary') {
          const summary = generateSummaryReport(schedules);
          doc.fontSize(16).text('Summary', { underline: true });
          doc.moveDown();
          doc.fontSize(12).text(`Total Schedules: ${summary.totalSchedules}`);
          doc.text(`Total Hours: ${summary.totalHours.toFixed(1)}`);
          doc.moveDown();

          // Add type breakdown
          doc.fontSize(14).text('Schedule Types');
          doc.moveDown();
          Object.entries(summary.schedulesByType).forEach(([type, count]) => {
            doc.text(`${type}: ${count}`);
          });
          doc.moveDown();

          // Add day breakdown
          doc.fontSize(14).text('Hours by Day');
          doc.moveDown();
          Object.entries(summary.schedulesByDay).forEach(([day, hours]) => {
            doc.text(`${day}: ${hours.toFixed(1)} hours`);
          });
        }

        // Add detailed schedule list
        doc.addPage();
        doc.fontSize(16).text('Schedule Details', { underline: true });
        doc.moveDown();

        schedules.forEach(schedule => {
          doc.fontSize(12).text(`Date: ${moment(schedule.date).format('YYYY-MM-DD')}`);
          doc.text(`Type: ${schedule.type}`);
          doc.text(`Time: ${schedule.startTime} - ${schedule.endTime}`);
          doc.text(`Working Days: ${schedule.days.join(', ')}`);
          if (schedule.notes) {
            doc.text(`Notes: ${schedule.notes}`);
          }
          doc.moveDown();
        });

        doc.end();
        contentType = 'application/pdf';
        filename = `schedule_report_${startDate}_${endDate}.pdf`;
        return; // Response is handled in doc.on('end')

      case 'csv':
        const csvRows = [];
        csvRows.push(['Date', 'Type', 'Start Time', 'End Time', 'Working Days', 'Notes']);
        
        schedules.forEach(schedule => {
          csvRows.push([
            moment(schedule.date).format('YYYY-MM-DD'),
            schedule.type,
            schedule.startTime,
            schedule.endTime,
            schedule.days.join(', '),
            schedule.notes || ''
          ]);
        });

        buffer = Buffer.from(csvRows.map(row => row.join(',')).join('\n'));
        contentType = 'text/csv';
        filename = `schedule_report_${startDate}_${endDate}.csv`;
        break;

      default:
        return res.status(400).json({ message: 'Unsupported format' });
    }

    if (buffer) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ message: 'Error exporting report' });
  }
};

// Helper function to generate summary report
const generateSummaryReport = (schedules) => {
  const summary = {
    totalSchedules: schedules.length,
    totalHours: 0,
    schedulesByType: {},
    schedulesByDay: {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0
    }
  };

  schedules.forEach(schedule => {
    // Calculate hours
    const hours = moment(schedule.endTime, 'HH:mm')
      .diff(moment(schedule.startTime, 'HH:mm'), 'hours', true);
    summary.totalHours += hours;

    // Count by type
    summary.schedulesByType[schedule.type] = (summary.schedulesByType[schedule.type] || 0) + 1;

    // Count by day
    schedule.days.forEach(day => {
      summary.schedulesByDay[day.charAt(0).toUpperCase() + day.slice(1)] += hours;
    });
  });

  return summary;
};

// Helper function to generate detailed report
const generateDetailedReport = (schedules) => {
  return schedules.map(schedule => ({
    date: moment(schedule.date).format('YYYY-MM-DD'),
    type: schedule.type,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    days: schedule.days,
    notes: schedule.notes,
    hours: moment(schedule.endTime, 'HH:mm')
      .diff(moment(schedule.startTime, 'HH:mm'), 'hours', true)
  }));
}; 