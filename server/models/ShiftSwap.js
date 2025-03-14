const mongoose = require("mongoose");

const ShiftSwapSchema = new mongoose.Schema(
  {
    requestingUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requesting user is required"],
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Target user is required"],
    },
    requestingSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: [true, "Requesting schedule is required"],
    },
    targetSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: [true, "Target schedule is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected", "cancelled", "completed"],
        message: "{VALUE} is not a valid status",
      },
      default: "pending",
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    responseDate: {
      type: Date,
    },
    managerApproval: {
      approved: {
        type: Boolean,
        default: false,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvalDate: Date,
      notes: {
        type: String,
        maxlength: [500, "Manager notes cannot exceed 500 characters"],
      },
    },
    reason: {
      type: String,
      required: [true, "Reason for swap is required"],
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
ShiftSwapSchema.index({ requestingUser: 1, status: 1 });
ShiftSwapSchema.index({ targetUser: 1, status: 1 });
ShiftSwapSchema.index({ status: 1, requestDate: -1 });

// Helper function to check if a date is within working hours
function isWithinWorkingHours(date) {
  const hours = date.getHours();
  return hours >= 8 && hours <= 17; // 8 AM to 5 PM
}

// Helper function to get the next working day
function getNextWorkingDay(date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(8, 0, 0, 0); // Set to 8 AM
  return nextDay;
}

// Method to check if swap is valid for approval
ShiftSwapSchema.methods.isValidForApproval = async function () {
  try {
    // If not already populated, populate the schedules
    if (!this.populated("requestingSchedule")) {
      await this.populate("requestingSchedule");
    }
    if (!this.populated("targetSchedule")) {
      await this.populate("targetSchedule");
    }

    const now = new Date();
    const requestingSchedule = this.requestingSchedule;
    const targetSchedule = this.targetSchedule;

    // Log validation details for debugging
    console.log("Validating swap request:", {
      now: now.toISOString(),
      requestingScheduleStart: requestingSchedule?.startDate?.toISOString(),
      targetScheduleStart: targetSchedule?.startDate?.toISOString(),
      status: this.status,
    });

    // Check if schedules exist
    if (!requestingSchedule || !targetSchedule) {
      console.log("One or both schedules not found");
      return false;
    }

    // Get the start of the next working day
    const nextWorkingDay = getNextWorkingDay(now);

    // Check if schedules start after the next working day
    const isRequestingFuture =
      new Date(requestingSchedule.startDate) >= nextWorkingDay;
    const isTargetFuture = new Date(targetSchedule.startDate) >= nextWorkingDay;

    console.log("Schedule validation results:", {
      isRequestingFuture,
      isTargetFuture,
      nextWorkingDay: nextWorkingDay.toISOString(),
    });

    return this.status === "pending" && isRequestingFuture && isTargetFuture;
  } catch (error) {
    console.error("Error checking swap validity:", error);
    return false;
  }
};

// Pre-save middleware to validate schedules
ShiftSwapSchema.pre("save", async function (next) {
  try {
    // Only run validation if status is being modified
    if (this.isModified("status")) {
      // Populate references if they're not already populated
      if (!this.populated("requestingSchedule")) {
        await this.populate("requestingSchedule");
      }
      if (!this.populated("targetSchedule")) {
        await this.populate("targetSchedule");
      }

      // Get the start of the next working day
      const now = new Date();
      const nextWorkingDay = getNextWorkingDay(now);

      // Validate schedules exist
      if (!this.requestingSchedule || !this.targetSchedule) {
        throw new Error("One or both schedules no longer exist");
      }

      // Validate schedule dates for approval
      if (this.status === "approved" || this.status === "completed") {
        const requestingStart = new Date(this.requestingSchedule.startDate);
        const targetStart = new Date(this.targetSchedule.startDate);

        const isRequestingFuture = requestingStart >= nextWorkingDay;
        const isTargetFuture = targetStart >= nextWorkingDay;

        if (!isRequestingFuture || !isTargetFuture) {
          throw new Error(
            "Cannot swap schedules that start before the next working day (8 AM)",
          );
        }
      }

      // Validate manager approval for completed status
      if (
        this.status === "completed" &&
        (!this.managerApproval || !this.managerApproval.approved)
      ) {
        throw new Error(
          "Shift swap requires manager approval before completion",
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("ShiftSwap", ShiftSwapSchema);
