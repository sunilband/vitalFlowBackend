import mongoose, { Schema } from "mongoose";
import { sendMail } from "../utils/mailService.js";
import otpGenerator from "otp-generator";
import { Donor } from "./donor.model.js";
import { smsService } from "../utils/smsService.js";

const otpSchema = new Schema(
  {
    phone: {
      type: String,
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
    type: {
      type: String,
      enum: ["verification", "login", "forgotPassword"],
      required: true,
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

// Send otp on save
otpSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.otp = otpGenerator.generate(6, {
      digits: true, // only digits
      specialChars: false,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
    });

    let subject;
    let html;
    switch (this.type) {
      case "verification":
        subject = "OTP for verification";
        html = `<p>Your OTP for verification is ${this.otp}</p>`;
        break;
      case "login":
        subject = "OTP for login";
        html = `<p>Your OTP for login is ${this.otp}</p>`;
        break;
      case "forgotPassword":
        subject = "OTP for password reset";
        html = `<p>Your OTP for password reset is ${this.otp}</p>`;
        break;
    }

    if (this.email && this.status === "pending") {
      await sendMail(this.email, subject, html);
    }
    if (this.phone && this.status === "pending") {
      // TODO: send OTP to phone
      // if developement then dont send otp to phone
      process.env.NODE_ENV === "development"
        ? null
        : await smsService(
            "+91" + this.phone,
            `Your OTP for ${this.type} is ${this.otp}`
          );
    }
    this.expiry = new Date(new Date().getTime() + 5 * 60000); // 5 minutes
  }
  next();
});

export const Otp = mongoose.model("Otp", otpSchema);
