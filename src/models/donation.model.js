import mongoose, { Schema } from "mongoose";

const donationSchema = new Schema({
  donorId: {
    type: Schema.Types.ObjectId,
    ref: "Donor",
    required: true,
  },
  donationDate: {
    type: Date,
    required: true,
  },
  campId: {
    type: Schema.Types.ObjectId,
    ref: "DonationCamp",
  },
});

export const Donation = mongoose.model("Donation", donationSchema);
