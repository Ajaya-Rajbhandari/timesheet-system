import mongoose from "mongoose";

const timesheetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
  },
  project: {
    type: String,
    required: true,
  },
  task: {
    type: String,
    required: true,
  },
});

const Timesheet = mongoose.model("Timesheet", timesheetSchema);

export default Timesheet;
