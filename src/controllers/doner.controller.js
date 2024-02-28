import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import jwt from "jsonwebtoken";
import { Otp } from "../models/otp.model.js";
import { Donor } from "../models/donor.model.js";

const generateAuthAndRefreshTokens = async (_id, user) => {
  try {
    // user is optional
    let fetchedUser = user ? user : await User.findById(_id);
    const accessToken = await fetchedUser.generateAuthToken();
    const refreshToken = await fetchedUser.generateRefreshToken();
    fetchedUser.refreshToken = refreshToken;
    await fetchedUser.save({
      validateBeforeSave: false,
    });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

// Send OTP
const sendPhoneOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    throw new ApiError(400, "Please provide a phone number");
  } else if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new ApiError(400, "Please provide a valid phone number");
  }
  await Otp.deleteOldOtps();
  const existingOtp = await Otp.findOne({ phone, status: "pending" });

  if (existingOtp) {
    throw new ApiError(409, `OTP already sent to ${phone}`);
  }

  const newOtp = await Otp.create({ phone });

  res
    .status(200)
    .json(new ApiResponse(200, {}, `OTP sent successfully to ${phone}`));
});

// Send OTP Email
const sendEmailOTP = asyncHandler(async (req, res) => {
  await Otp.deleteOldOtps();
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Please provide a email ");
  } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email ");
  }

  const existingOtp = await Otp.findOne({ email, status: "pending" });

  if (existingOtp) {
    throw new ApiError(409, `OTP already sent to ${email}`);
  }

  const newOtp = await Otp.create({ email });

  res
    .status(200)
    .json(new ApiResponse(200, {}, `OTP sent successfully to ${email}`));
});

// ----------------Verify OTP----------------
const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, email } = req.body;
  //  check if phone or email is present and otp must be present
  if ((!phone && !email) || !otp) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  let existingOtp = phone
    ? await Otp.findOne({
        phone,
        otp,
        status: "pending",
      })
    : await Otp.findOne({
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
// --------------Register User--------------
const registerDoner = asyncHandler(async (req, res) => {
  // required
  const {
    fullName,
    dob,
    weight,
    gender,
    bloodGroup,
    email,
    phone,
    whatsapp,
    address,
  } = req.body;

  console.log("fullName", fullName);
  console.log("dob", dob);
  console.log("weight", weight);
  console.log("gender", gender);
  console.log("bloodGroup", bloodGroup);
  console.log("email", email);
  console.log("phone", phone);
  console.log("whatsapp", whatsapp);
  console.log("address", address);

  if (
    !fullName ||
    !dob ||
    !weight ||
    !gender ||
    !bloodGroup ||
    (!phone && !email)
  ) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  const existingUser = await Donor.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    throw new ApiError(409, "Email or Username already exists");
  }

  let verifiedPhone;
  let verifiedEmail;
  if (phone) verifiedPhone = await Otp.findOne({ phone, status: "verified" });
  if (email) verifiedEmail = await Otp.findOne({ email, status: "verified" });

  if (!verifiedPhone && !verifiedEmail) {
    throw new ApiError(400, `Phone or Email not verified`);
  }

  const newUser = await Donor.create({
    fullName,
    dob,
    weight,
    gender,
    bloodGroup,
    email,
    phone,
    phoneVerified: verifiedPhone ? true : false,
    emailVerified: verifiedEmail ? true : false,
    whatsapp,
    address: {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      state: address.state,
      city: address.city,
      pincode: address.pincode,
      addressType: "Donor",
    },
  });

  // check if user was created and deselect password and refreshToken
  const createdUser = await Donor.findById({
    _id: newUser._id,
  }).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

// --------------Login User--------------
const loginUser = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (bodyDataExists(usernameOrEmail, password)) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  // find user
  const loggedInUser = await User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
  }).select("+password");

  if (!loggedInUser) {
    throw new ApiError(404, "User Does Not Exist");
  }
  // password check
  const isPasswordCorrect = await loggedInUser.ispasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }
  // create tokens
  const { accessToken, refreshToken } = await generateAuthAndRefreshTokens(
    loggedInUser._id,
    loggedInUser
  );

  // send secure cookies and response
  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// --------------Logout User--------------
const logoutUser = asyncHandler(async (req, res) => {
  // we have req.user from the auth middleware
  const { _id } = req.user;
  await User.findByIdAndUpdate(
    {
      _id,
    },
    { refreshToken: "" },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  let { refreshToken } = req.cookies || req.body;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh Token Expired or Invalid");
  }
  const { _id } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  if (!_id) {
    throw new ApiError(401, "Refresh Token Expired or Invalid");
  }

  const user = await User.findById(_id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user?.refreshToken !== refreshToken) {
    throw new ApiError(401, "Refresh Token Expired or Invalid");
  }

  const newTokens = await generateAuthAndRefreshTokens(user._id, user);

  const authToken = newTokens.accessToken;
  refreshToken = newTokens.refreshToken;

  res
    .status(200)
    .cookie("accessToken", authToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user, authToken, refreshToken },
        "Access token refreshed successfully"
      )
    );
});

const changeUserpassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { _id } = req.user;

  if (bodyDataExists(oldPassword, newPassword)) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  if (!passwordIsValid(newPassword)) {
    throw new ApiError(
      400,
      "New Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter , one number and one special character"
    );
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, "New Password cannot be same as old password");
  }

  const user = await User.findById(_id).select("+password");

  const isPasswordCorrect = await user.ispasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  user.password = newPassword; //hashing is done in pre save hook
  await user.save({
    validateBeforeSave: false, // we are not validating the other things here
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json(new ApiResponse(200, user, "User profile fetched"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  const { _id } = req.user;
  if (!fullName || !email) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  if (!emailIsValid(email)) {
    throw new ApiError(400, "Please provide a valid email");
  }

  const user = await User.findByIdAndUpdate(
    { _id },
    { fullName, email },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "Error updating user details");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateAvatarAndOrCover = asyncHandler(async (req, res) => {
  if (!req.files) {
    throw new ApiError(400, "Please provide files to upload");
  }
  const { avatar, coverImage } = req.files;
  const { _id } = req.user;

  let avatarLocalPath = "";
  let coverImageLocalPath = "";

  if (avatar) {
    avatarLocalPath = avatar[0]?.path;
  }

  if (coverImage) {
    coverImageLocalPath = coverImage[0]?.path;
  }

  if (!avatarLocalPath && !coverImageLocalPath) {
    throw new ApiError(400, "Please provide avatar or coverImage");
  }

  const avatarUploaded = await uploadOnCloudinary(avatarLocalPath);
  const coverImageUploaded = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarUploaded && !coverImageUploaded) {
    throw new ApiError(400, "Upload failed");
  }

  const user = await User.findById(_id);

  if (avatarUploaded) {
    if (user.avatar) {
      const deletedAvatar = await deleteFromCloudinary(user.avatar);
      if (!deletedAvatar) {
        throw new ApiError(400, "Update failed while deleting old avatar");
      }
      user.avatar = avatarUploaded.url;
    }
  }

  if (coverImageUploaded) {
    if (user.coverImage) {
      const deletedCover = await deleteFromCloudinary(user.coverImage);
      if (!deletedCover) {
        throw new ApiError(400, "Update failed while deleting old coverImage");
      }
      user.coverImage = coverImageUploaded.url;
    }
  }

  await user.save({
    validateBeforeSave: false,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      user,
      `
      ${avatarUploaded ? "Avatar" : ""} 
      ${coverImageUploaded ? "Cover Image" : ""}
      updated successfully`
    )
  );
});

export {
  sendPhoneOTP,
  sendEmailOTP,
  verifyOTP,
  registerDoner,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserpassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarAndOrCover,
};
