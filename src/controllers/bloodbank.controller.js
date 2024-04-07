import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import { BloodBank } from "../models/bloodBank.model.js";
import { Otp } from "../models/otp.model.js";
import { DonationCamp } from "../models/donationCamp.model.js";
import { Donation } from "../models/donation.model.js";
import { Donor } from "../models/donor.model.js";

const sendEmailVerifyOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Please provide a email ");
  } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email ");
  }

  const existingUser = await BloodBank.findOne({ email, emailVerified: true });

  if (existingUser) {
    throw new ApiError(409, `Email already registered`);
  }

  const existingOtp = await Otp.findOne({
    email,
    status: "pending",
    expiry: { $gt: new Date() },
    type: "verification",
  });

  if (existingOtp) {
    throw new ApiError(
      409,
      `OTP already sent to ${email}, please check your email`
    );
  }

  const newOtp = await Otp.create({ email, type: "verification" });

  res
    .status(200)
    .json(new ApiResponse(200, {}, `OTP sent successfully to ${email}`));
});

// -------------verify otp---------------
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  //  check if phone or email is present and otp must be present
  if (!email || !otp) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  let existingOtp = await Otp.findOne({
    email,
    otp,
    status: "pending",
  });

  if (existingOtp) existingOtp.status = "verified";

  if (!existingOtp) throw new ApiError(400, "Invalid OTP");

  await existingOtp.save({
    validateBeforeSave: false,
  });
  res.status(200).json(new ApiResponse(200, {}, "OTP verified successfully"));
});

// -------------register blood bank---------------
const registerBloodBank = asyncHandler(async (req, res, next) => {
  const {
    name,
    parentHospitalName,
    category,
    contactPersonName,
    contactPersonPhone,
    email,
    license,
    licenseValidity,
    address,
    website,
    componentFacility,
    apheresisFacility,
    helplineNumber,
    acceptedDonorType,
    acceptedDonationType,
    acceptedComponentType,
    bagType,
    ttiType,
    remarks,
    password,
    confirmPassword,
  } = req.body;

  if (
    !name ||
    !category ||
    !contactPersonName ||
    !contactPersonPhone ||
    !email ||
    !license ||
    !licenseValidity ||
    !password ||
    !confirmPassword
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  if (
    !address ||
    !address.addressLine1 ||
    !address.state ||
    !address.city ||
    !address.pincode
  ) {
    throw new ApiError(400, "All address fields are required");
  }

  const verifiedEmail = await Otp.findOne({
    email,
    status: "verified",
  });

  if (!verifiedEmail) {
    throw new ApiError(400, "Please verify your email first");
  }

  const existingUser = await BloodBank.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const bloodBank = await BloodBank.create({
    name,
    parentHospitalName,
    category,
    contactPersonName,
    contactPersonPhone,
    email,
    license,
    licenseValidity,
    address: {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      state: address.state,
      city: address.city,
      pincode: address.pincode,
      addressType: "Bloodbank",
    },
    website,
    componentFacility,
    apheresisFacility,
    helplineNumber,
    acceptedDonorType,
    acceptedDonationType,
    acceptedComponentType,
    bagType,
    ttiType,
    remarks,
    password,
  });

  const accessToken = await bloodBank.generateAuthToken();
  const refreshToken = await bloodBank.generateRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new ApiError(500, "Token generation failed");
  }

  res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        { bloodBank },
        "Blood Bank registered successfully , Awaiting admin approval"
      )
    );
});

// -------------login blood bank---------------
const loginBloodBank = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!password || !email) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  let existingUser = await BloodBank.findOne({ email }).select("+password");

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const validPassword = await existingUser.checkPassword(password);

  if (!validPassword) {
    throw new ApiError(400, "Invalid credentials");
  }

  const accessToken = await existingUser.generateAuthToken();
  const refreshToken = await existingUser.generateRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new ApiError(500, "Token generation failed");
  }

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, existingUser, "User logged in successfully"));
});

// -------------Get all camps---------------
const getCamps = asyncHandler(async (req, res, next) => {
  const query = {};

  if (req.query.status) query.status = req.query.status;
  if (req.query.organizationType)
    query.organizationType = req.query.organizationType;
  if (req.query.date) query.category = req.query.date;

  if (req.query.address) {
    query["address.state"] = req.query.address.state;
    query["address.city"] = req.query.address.city;
  }
  const bloodBankId = req.user._id.toHexString();
  query.bloodbank = bloodBankId;
  const camps = await DonationCamp.find(query);
  res.status(200).json(new ApiResponse(200, { camps }));
});

// -------------Change Camp status---------------
const changeCampStatus = asyncHandler(async (req, res, next) => {
  const status = req.query.status;
  const campId = req.query.id;
  const camp = await DonationCamp.findById(campId);
  if (!camp) {
    throw new ApiError(404, "Blood Bank not found");
  }
  camp.status = status;
  await camp.save();
  res.status(200).json(new ApiResponse(200, { camp }));
});

// -------------Get blood bank---------------
const getBloodBank = asyncHandler(async (req, res, next) => {
  const user = req.user;
  res.status(200).json(new ApiResponse(200, user, "User profile fetched"));
});

// -------------logout blood bank---------------
const logoutBloodBank = asyncHandler(async (req, res, next) => {
  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// -------------assign recipient to donation---------------
const assignRecipient = asyncHandler(async (req, res, next) => {
  let { donationId, recipientId, fullName, phone, email, componentGiven } =
    req.body;

  if (
    !donationId ||
    (!recipientId && (!fullName || !phone || !email)) ||
    !componentGiven
  ) {
    throw new Error("Incomplete details");
  }

  const donation = await Donation.findById(donationId);

  if (!donation) {
    throw new Error("Donation not found");
  }

  let recipient;
  if (recipientId) {
    recipient = await Donor.findById(recipientId);

    if (!recipient) {
      throw new Error("Recipient not found");
    }
  }

  if (recipient) {
    fullName = recipient.fullName;
    phone = recipient.phone;
    email = recipient.email;

    donation.recipient = {
      registered: true,
      recipientId,
      fullName,
      phone,
      email,
      componentGiven,
    };
  } else {
    donation.recipient = {
      registered: false,
      fullName,
      phone,
      email,
      componentGiven,
    };
  }

  await donation.save();

  res.status(200).json(new ApiResponse(200, { donation }));
});

export {
  sendEmailVerifyOTP,
  verifyOTP,
  registerBloodBank,
  loginBloodBank,
  getCamps,
  changeCampStatus,
  getBloodBank,
  logoutBloodBank,
  assignRecipient,
};
