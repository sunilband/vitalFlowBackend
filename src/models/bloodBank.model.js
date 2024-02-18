import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const bloodBankSchema = new Schema(
  {
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
      required: true,
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
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
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
    donorType: {
      type: String,
      required: true,
      enum: [
        "Voluntary",
        "Replacement",
        "Directed",
        "Autologous",
        "Family",
        "Replacement External",
      ],
      trim: true,
    },
    donationType: {
      type: String,
      required: true,
      enum: [
        "Whole Blood",
        "Plateletpheresis",
        "Plasmapheresis",
        "Leucaperesis",
      ],
      trim: true,
    },
    componentType: {
      type: String,
      enum: [
        "Cryo Poor Plasma",
        "Cryoprecipitate",
        "Fresh Frozen Plasma",
        "Irradiated RBC",
        "Leukoreduced RBC",
        "Packed Red Blood Cells",
        "Plasma",
        "Platelet Concentrate",
        "Platelet Rich Plasma",
        "Platelets additive solutions",
        "Random Donor Platelets",
        "Sagm Packed RBC",
        "Single Donor Plasma",
        "Single Donor Platelet",
        "Whole Blood",
      ],
      trim: true,
    },
    bagType: {
      type: String,
      enum: [
        "Single (350/450ml)",
        "Double (350/450ml)",
        "Triple (350/450ml)",
        "Quadruple (450ml) with inline filter",
        "Quadruple (450ml) without inline filter",
        "Penta Bag (450ml)",
        "Transfer Bag",
        "Aphearesis Bag",
        "Triple (350ml) CPD/SAGM",
        "Triple (450ml) CPD/SAGM",
      ],
      trim: true,
    },
    ttiType: {
      type: String,
      enum: ["HIV 1&2", "Hepatitis B", "Hepatitis C", "Malaria", "Syphilis"],
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

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
