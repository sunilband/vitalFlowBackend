import mongoose, { Schema } from "mongoose";

const bloodRequestSchema = new Schema({
  bloodGroup: {
    type: String,
    required: true,
    trim: true,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },
  units: {
    type: Number,
    required: true,
  },
  bloodBankId: {
    type: Schema.Types.ObjectId,
    ref: "BloodBank",
    required: true,
  },
  status: {
    type: String,
    required: true,
    trim: true,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requestedAt: {
    type: Date,
    required: true,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
});
