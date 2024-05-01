import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Donor } from "../models/donor.model.js";
import { BloodBank } from "../models/bloodBank.model.js";
import { DonationCamp } from "../models/donationCamp.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req?.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      throw new ApiError(401, "Middleware: Invalid token");
    }

    const { _id, role, email } = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    console.log("Auth Middleware:-", _id, role, email);

    if (!mongoose.Types.ObjectId.isValid(_id) && role !== "superAdmin") {
      throw new ApiError(401, "Middleware: Invalid token");
    }

    let user;

    // Check Roles
    if (!role) {
      user = await Donor.findById(_id);
    }

    if (role === "superAdmin") {
      if (email !== process.env.SUPER_ADMIN_EMAIL) {
        throw new ApiError(401, "Middleware: Invalid token");
      }
      user = { email };
    }

    if (role === "bloodBank") {
      user = await BloodBank.findById(_id);
    }

    if (role === "camp") {
      user = await DonationCamp.findById(_id);
    }

    if (!user && role !== "superAdmin") {
      throw new ApiError(401, "Middleware: User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Middleware: Invalid token");
  }
});

export { verifyJWT };
