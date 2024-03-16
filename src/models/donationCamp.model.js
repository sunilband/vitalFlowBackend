import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const donationCampSchema = new Schema(
  {
    organizationName: {
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
      default: "N/A",
    },
    coOrganizerMobileNumber: {
      type: Number,
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
      default: "N/A",
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodBank",
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
    //sponser or prayojak
    supporter: {
      type: String,
      trim: true,
      default: "N/A",
    },
    remarks: {
      type: String,
      trim: true,
      default: "N/A",
    },
    status: {
      type: String,
      required: true,
      trim: true,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

export const DonationCamp = mongoose.model("DonationCamp", donationCampSchema);
