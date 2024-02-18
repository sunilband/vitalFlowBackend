import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const donationCampSchema = new Schema(
  {
    oranizationName: {
      type: String,
      required: true,
      trim: true,
    },
    organizationType: {
      type: String,
      required: true,
      enum: [
        "Sewa hi Sangathan - Health Volunteers",
        "Terapanth Yuvak Parishad",
        "RedCross",
        "RWA",
        "Other",
      ],
      trim: true,
    },
    organizerName: {
      type: String,
      required: true,
      trim: true,
    },
    organizerMobileNumber: {
      type: Number,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number`,
      },
    },
    organizerEmail: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email`,
      },
    },
    coOrganizerName: {
      type: String,
      trim: true,
    },
    coOrganizerMobileNumber: {
      type: Number,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number`,
      },
    },
    campName: {
      type: String,
      required: true,
      trim: true,
    },
    campAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
    bloodbank: {
      type: String,
      trim: true,
      required: true,
    },
    campDate: {
      type: Date,
      required: true,
    },
    campStartTime: {
      type: Date,
      required: true,
      trim: true,
    },
    campEndTime: {
      type: Date,
      required: true,
      trim: true,
    },
    estimatedParticipants: {
      type: Number,
      required: true,
      trim: true,
    },
    supporter: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const DonationCamp = mongoose.model("DonationCamp", donationCampSchema);
