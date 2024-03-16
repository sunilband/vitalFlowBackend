import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
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

  const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET);

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, {}, "Super Admin logged in successfully"));
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

export { loginSuperAdmin, logoutSuperAdmin };
