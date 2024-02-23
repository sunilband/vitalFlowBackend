import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const donorSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    dob: {
      type: Date,
      required: true,
    },

    //this will be filled by pre save hook
    age: {
      type: Number,
    },

    // do not block anything based on weight as it is just preference and not requirement
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

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      trim: true,
    },

    email: {
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

    phone: {
      type: String,
      countryCode: {
        type: String,
        default: "+91",
      },
      unique: true,
      required: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number`,
      },
      trim: true,
      index: true,
    },

    whatsapp: {
      type: String,
      unique: true,
      countryCode: {
        type: String,
        default: "+91",
      },
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid whatsapp number`,
      },
      trim: true,
      index: true,
    },

    address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
    },

    donationHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Donation",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// pre save hook to calculate age from dob
donorSchema.pre("save", function (next) {
  const dob = this.dob;
  const ageDate = new Date(Date.now() - dob.getTime()); // miliseconds from epoch
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  this.age = age;
  next();
});

// we are not using arrow function here because we need access to "this"
donorSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// check password
donorSchema.methods.ispasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// custom method to generate authToken
donorSchema.methods.generateAuthToken = async function () {
  const token = await jwt.sign(
    {
      _id: this._id,
      donorname: this.donorname,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
  return token;
};

// custom method to generate refreshToken
donorSchema.methods.generateRefreshToken = async function () {
  const token = await jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
  return token;
};

export const Donor = mongoose.model("Donor", donorSchema);
