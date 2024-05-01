import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const addressSchema = new Schema(
  {
    addressType: {
      type: String,
      required: true,
      enum: ["Donor", "Bloodbank", "Camp"],
      trim: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
      default: "N/A",
    },
    // district: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: Number,
      required: true,
      trim: true,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    latitude: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Address = mongoose.model("Address", addressSchema);
