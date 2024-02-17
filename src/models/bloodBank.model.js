import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const bloodBankAddressSchema = new Schema({
  address: {
    type: String,
    required: true,
    trim: true,
  },
  district: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  pincode: {
    type: Number,
    required: true,
    trim: true,
  },
});

const geograpgicalLocationSchema = new Schema({
  longitude: {
    type: Number,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
});

const bloodBankSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  parentHospitalName: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["Government", "RedCross", "Charitable/Vol", "Private"],
    trim: true,
  },
  contactPersonName: {
    type: String,
    required: true,
    trim: true,
  },
  contactPersonPhone: {
    type: Number,
    required: true,
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
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          v
        );
      },
      message: (props) => `${props.value} is not a valid password`,
    },
  },
  license: {
    type: String,
    unique: true,
    trim: true,
  },
  licenseValidity: {
    type: Date,
    required: true,
  },
  address: bloodBankAddressSchema,
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid website`,
    },
  },
  componentFacility: {
    type: Boolean,
    default: false,
  },
  apheresisFacility: {
    type: Boolean,
    default: false,
  },
  helplineNumber: {
    type: Number,
    trim: true,
  },
  geograpgicalCoordinates: geograpgicalLocationSchema,
});

//hash the plain text password before saving
bloodBankSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

//check password
bloodBankSchema.methods.checkPassword = async function (password) {
  const bloodBank = this;
  const isMatch = await bcrypt.compare(password, bloodBank.password);
  return isMatch;
};

//generate auth token
bloodBankSchema.methods.generateAuthToken = function () {
  const bloodBank = this;
  const token = jwt.sign(
    { _id: bloodBank._id.toString(), role: "bloodBank" },
    process.env.JWT_SECRET
  );
  return token;
};

//generate refresh token
bloodBankSchema.methods.generateRefreshToken = function () {
  const bloodBank = this;
  const refreshToken = jwt.sign(
    { _id: bloodBank._id.toString(), role: "bloodBank" },
    process.env.REFRESH_TOKEN_SECRET
  );
  return refreshToken;
};

const BloodBank = mongoose.model("BloodBank", bloodBankSchema);
