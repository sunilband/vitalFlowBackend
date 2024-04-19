import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import { BloodBank } from "../models/bloodBank.model.js";
import { Otp } from "../models/otp.model.js";
import { sendMail } from "../utils/mailService.js";
import { DonationCamp } from "../models/donationCamp.model.js";
import { Donation } from "../models/donation.model.js";

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

// -------------register donation camp---------------
const registerDonationCamp = asyncHandler(async (req, res, next) => {
  const {
    organizationName,
    organizationType,
    organizerName,
    organizerMobileNumber,
    organizerEmail,
    coOrganizerName,
    coOrganizerMobileNumber,
    campName,
    address,
    bloodbank,
    campDate,
    campStartTime,
    campEndTime,
    estimatedParticipants,
    supporter,
    remarks,
    password,
    confirmPassword,
  } = req.body;

  if (
    !organizationName ||
    !organizationType ||
    !organizerName ||
    !organizerMobileNumber ||
    !organizerEmail ||
    !campName ||
    !campDate ||
    !campStartTime ||
    !address ||
    !campEndTime ||
    !estimatedParticipants ||
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
    email: organizerEmail,
    status: "verified",
  });

  if (!verifiedEmail) {
    throw new ApiError(400, "Please verify your email first");
  }

  const existingUser = await DonationCamp.findOne({ organizerEmail });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const donationCamp = await DonationCamp.create({
    organizationName,
    organizationType,
    organizerName,
    organizerMobileNumber,
    organizerEmail,
    coOrganizerName,
    coOrganizerMobileNumber,
    campName,
    address: {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      state: address.state,
      city: address.city,
      pincode: address.pincode,
      addressType: "Camp",
    },
    bloodbank,
    campDate,
    campStartTime,
    campEndTime,
    estimatedParticipants,
    supporter,
    remarks,
    password,
  });

  const accessToken = await donationCamp.generateAuthToken();
  const refreshToken = await donationCamp.generateRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new ApiError(500, "Token generation failed");
  }

  const donationCampObject = donationCamp.toObject();
  delete donationCampObject.password;

  res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        { donationCampObject },
        "Donation Camp registered successfully , Awaiting blood bank approval"
      )
    );
});

// -------------login camp---------------
const loginDonationCamp = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!password || !email) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  let existingUser = await DonationCamp.findOne({
    organizerEmail: email,
  }).select("+password");

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

// --------------get camp----------------
const getDonationCamp = asyncHandler(async (req, res, next) => {
  const user = req.user;
  res.status(200).json(new ApiResponse(200, user, "Camp profile fetched"));
});

// ---------------logout camp----------------
const logoutCamp = asyncHandler(async (req, res, next) => {
  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//-----------------get blood banks----------------
const getRegisteredBloodBanks = asyncHandler(async (req, res, next) => {
  const { pincode, category, name, status, mode } = req.body;

  let query = {
    status: "Approved",
  };

  if (pincode) {
    query["address.pincode"] = pincode;
  }

  if (category) {
    query.category = category;
  }

  if (name) {
    query.name = { $regex: new RegExp("^" + name, "i") };
  }

  if (status !== (undefined || null || "") && mode == "admin") {
    query["status"] = status;
  }

  if (status == "" && mode == "admin") {
    delete query.status;
  }

  const bloodBanks = await BloodBank.find(query);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        bloodBanks,
        "Filtered blood banks fetched successfully"
      )
    );
});

export {
  sendEmailVerifyOTP,
  verifyOTP,
  registerDonationCamp,
  loginDonationCamp,
  getDonationCamp,
  logoutCamp,
  getRegisteredBloodBanks,
  // registerBloodBank,
  // loginBloodBank,
  // getBloodBank,
  // logoutBloodBank,
};
