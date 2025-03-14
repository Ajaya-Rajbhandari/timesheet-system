const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "manager", "employee"],
        message: "{VALUE} is not a valid role",
      },
      default: "employee",
      required: [true, "Role is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    employeeId: {
      type: String,
      unique: true,
      trim: true,
      sparse: true, // Allows null/undefined values to pass unique constraint
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
        "Please enter a valid phone number",
      ],
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String,
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    profileImage: {
      type: String,
      default: "/uploads/profile-images/default-profile.png",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    defaultShift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
UserSchema.index({ email: 1, employeeId: 1 });
UserSchema.index({ department: 1, role: 1 });
UserSchema.index({ createdBy: 1 });

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for role-based permissions
UserSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

UserSchema.virtual("isManager").get(function () {
  return this.role === "manager";
});

// Pre-save hook to validate createdBy field
UserSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const userCount = await this.constructor.countDocuments();

      // First admin user doesn't need createdBy
      if (userCount === 0 && this.role === "admin") {
        this.createdBy = undefined;
        return next();
      }

      // All other users need createdBy
      if (!this.createdBy) {
        throw new Error(
          "CreatedBy field is required for non-first admin users"
        );
      }

      // Validate creator exists and has appropriate permissions
      const creator = await this.constructor.findById(this.createdBy);
      if (!creator) {
        throw new Error("Creator not found");
      }

      // Only admins and managers can create users
      if (creator.role !== "admin" && creator.role !== "manager") {
        throw new Error("Only admins and managers can create users");
      }

      // Only admins can create other admins
      if (this.role === "admin" && creator.role !== "admin") {
        throw new Error("Only admins can create other admins");
      }

      // Managers can only create employees
      if (creator.role === "manager" && this.role !== "employee") {
        throw new Error("Managers can only create employees");
      }

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save hook to hash password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate employee ID
UserSchema.pre("save", async function (next) {
  try {
    if (!this.employeeId) {
      const year = new Date().getFullYear().toString().slice(-2);
      const count = await this.constructor.countDocuments();
      this.employeeId = `EMP${year}${(count + 1).toString().padStart(4, "0")}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user's full name
UserSchema.methods.getFullName = function () {
  return this.fullName;
};

// Method to generate password reset token
UserSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Static method to check if user can manage other users
UserSchema.statics.canManageUsers = function (user) {
  return user && (user.role === "admin" || user.role === "manager");
};

// Static method to check if user can manage admins
UserSchema.statics.canManageAdmins = function (user) {
  return user && user.role === "admin";
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "1d",
  });
};

module.exports = mongoose.model("User", UserSchema);
