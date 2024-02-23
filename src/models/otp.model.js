import mongoose, { Schema } from "mongoose";
import { sendMail } from "../utils/mailService.js";
import otpGenerator from "otp-generator";

const otpSchema = new Schema(
  {
    phone: {
      type: String,
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number`,
      },
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email`,
      },
    },
    otp: {
      type: String,
      trim: true,
    },
    expiry: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// delete old otps
otpSchema.statics.deleteOldOtps = async function () {
  await this.deleteMany({ expiry: { $lt: new Date() } });
};

otpSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const subject = "OTP for verification";
    const html = `<p>Your OTP for verification is ${this.otp}</p>`;
    if (this.email && this.status === "pending") {
      await sendMail(this.email, subject, html);
    }
    if (this.phone && this.status === "pending") {
      // TODO: send OTP to phone
      this.otp = "123456";
    }
    this.expiry = new Date(new Date().getTime() + 5 * 60000); // 5 minutes
  }
  next();
});

export const Otp = mongoose.model("Otp", otpSchema);
