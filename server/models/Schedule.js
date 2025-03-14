const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format. Use HH:mm format (e.g., 09:00)`,
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format. Use HH:mm format (e.g., 09:00)`,
      },
    },
    days: {
      type: [String],
      enum: {
        values: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
        message: "{VALUE} is not a valid day",
      },
      required: true,
    },
    type: {
      type: String,
      enum: ["regular", "overtime", "flexible", "remote"],
      default: "regular",
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
ScheduleSchema.index({ user: 1, startDate: 1, endDate: 1 });
ScheduleSchema.index({ department: 1, startDate: 1 });

// Virtual for schedule duration in hours
ScheduleSchema.virtual("duration").get(function () {
  const start = this.startTime.split(":").map(Number);
  const end = this.endTime.split(":").map(Number);
  let hours = end[0] - start[0];
  let minutes = end[1] - start[1];

  if (minutes < 0) {
    hours--;
    minutes += 60;
  }

  return hours + minutes / 60;
});

// Configure virtuals
ScheduleSchema.set("toJSON", { virtuals: true });
ScheduleSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Schedule", ScheduleSchema);
