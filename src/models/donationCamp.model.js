import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { addressSchema } from "./helperModels/address.model.js";
import { sendMail } from "../utils/mailService.js";

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
    },
    campName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: addressSchema,
      required: true,
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

    //sponser or prayojak in hindi
    supporter: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
      enum: ["Pending", "Approved", "Rejected", "Completed"], //Completed status is for the camps that are already done
      default: "Pending",
    },
    password: {
      type: String,
      select: false,
      required: true,
      validate: {
        validator: function (v) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            v
          );
        },
        message: () =>
          `Password is not valid. It must contain at least one lowercase letter, one uppercase letter, one digit, one special character (@$!%*?&), and be at least 8 characters long.`,
      },
    },
  },
  {
    timestamps: true,
  }
);

//hash the plain text password before saving
donationCampSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

//create a pre save hook for initial creation of blood bank
donationCampSchema.pre("save", async function (next) {
  const subject = "Welcome to Vital~Flow!";
  const html = `<p>Thank you for registering your Blood donation camp with Vital~Flow and ${this.bloodbank} . Your account is under review. You will be notified once your account is approved.</p>`;
  if (this.isNew) {
    await sendMail(this.organizerEmail, subject, html);
  }
  next();
});

//check password
donationCampSchema.methods.checkPassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};

//generate auth token
donationCampSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id.toString(), role: "camp" },
    process.env.ACCESS_TOKEN_SECRET
  );
  return token;
};

//generate refresh token
donationCampSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    { _id: this._id.toString(), role: "camp" },
    process.env.REFRESH_TOKEN_SECRET
  );
  return refreshToken;
};

export const DonationCamp = mongoose.model("DonationCamp", donationCampSchema);
