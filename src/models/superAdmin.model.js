import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const superAdminSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        // return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
        return /^([\w.]+@([\w]+\.)+[\w]{2,4})?$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email`,
    },
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          v
        );
      },
      message: (props) => `${props.value} is not a valid password`,
    },
  },
  phone: {
    type: Number,
    required: true,
    trim: true,
    countryCode: {
      type: String,
      default: "+91",
    },
    validate: {
      validator: function (v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number`,
    },
  },
  dob: {
    type: Date,
    required: true,
  },
  age: {
    type: Number,
    required,
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
  },
  weight: {
    type: Number,
    required: true,
    min: [45, "The minimum allowed weight is 45"],
    trim: true,
  },

  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female", "Other"],
  },

  lastLogin: {
    type: Date,
  },
});

export const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);
