import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import { BloodBank } from "../models/bloodBank.model.js";
import { Otp } from "../models/otp.model.js";
import { sendMail } from "../utils/mailService.js";

const sendEmailVerifyOTP = asyncHandler(async (req, res, next) => {
  await Otp.deleteOldOtps();
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Please provide a email ");
  } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email ");
  }

  const existingBloodBank = await BloodBank.findOne({ email });
  if (existingBloodBank) {
    throw new ApiError(409, `Email already registered`);
  }

  const existingOtp = await Otp.findOne({ email, status: "pending" });

  if (existingOtp) {
    throw new ApiError(409, `OTP already sent to ${email}`);
  }

  const newOtp = await Otp.create({ email, type: "verification" });

  res
    .status(200)
    .json(new ApiResponse(200, {}, `OTP sent successfully to ${email}`));
});

const registerBloodBank = asyncHandler(async (req, res, next) => {
  const {
    name,
    parentHospitalName,
    category,
    contactPersonName,
    contactPersonPhone,
    email,
    licence,
    licenceValidity,
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
    !licence ||
    !licenceValidity ||
    !password ||
    !confirmPassword
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  const bloodBank = await BloodBank.create({
    name,
    parentHospitalName,
    category,
    contactPersonName,
    contactPersonPhone,
    email,
    licence,
    licenceValidity,
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

  const mail = await sendMail(
    email,
    "Blood Bank Registration",
    `<h1>Thank you for registering with Vital~Flow</h1>
    <p>Your registration is pending for approval, you will be notified once it is approved</p>`
  );

  if (!mail) {
    throw new ApiError(500, "Error sending email");
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { bloodBank },
        "Blood Bank registered successfully , Awaiting admin approval"
      )
    );
});

export { sendEmailVerifyOTP, registerBloodBank };
