import mongoose, { Schema } from "mongoose";
import { DonationCamp } from "./donationCamp.model.js";
import { Donor } from "./donor.model.js";
import { sendMail } from "../utils/mailService.js";

const chatSchema = new Schema(
  {
    senderId: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    considerContext: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);
