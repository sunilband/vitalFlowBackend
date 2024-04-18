import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import { BloodBank } from "../models/bloodBank.model.js";
import jwt from "jsonwebtoken";

const loginSuperAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (email !== superAdminEmail || password !== superAdminPassword) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = jwt.sign(
    { email, role: "superAdmin" },
    process.env.ACCESS_TOKEN_SECRET
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, {}, "Super Admin logged in successfully"));
});

const getBloodBanks = asyncHandler(async (req, res, next) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.category) query.category = req.query.category;
  if (req.query.address) {
    query["address.state"] = req.query.address.state;
    query["address.city"] = req.query.address.city;
  }

  const bloodBanks = await BloodBank.find(query);
  res.status(200).json(new ApiResponse(200, { bloodBanks }));
});

const changeBloodBankStatus = asyncHandler(async (req, res, next) => {
  const status = req.query.status;
  const bloodBankId = req.query.id;

  const { email } = req.user;
  if (!email || email !== process.env.SUPER_ADMIN_EMAIL) {
    throw new ApiError(401, "Unauthorized");
  }

  const bloodBank = await BloodBank.findById(bloodBankId);
  if (!bloodBank) {
    throw new ApiError(404, "Blood Bank not found");
  }
  bloodBank.status = status;
  await bloodBank.save();
  res.status(200).json(new ApiResponse(200, { bloodBank }));
});

const logoutSuperAdmin = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    throw new ApiError(401, "Super Admin not logged in");
  }
  const verifyJWT = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  if (!verifyJWT) {
    throw new ApiError(401, "Invalid access token");
  }
  res
    .status(200)
    .clearCookie("accessToken")
    .json(new ApiResponse(200, {}, "Super Admin logged out successfully"));
});

const getSuperAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!email || email !== superAdminEmail) {
    throw new ApiError(401, "Invalid access token");
  }
  res.status(200).json(new ApiResponse(200, { superAdmin: verifyJWT }));
});

export {
  loginSuperAdmin,
  getBloodBanks,
  changeBloodBankStatus,
  logoutSuperAdmin,
  getSuperAdmin,
};
