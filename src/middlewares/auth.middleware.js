import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Donor } from "../models/donor.model.js";
import { BloodBank } from "../models/bloodBank.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req?.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      throw new ApiError(401, "Middleware: Invalid token");
    }

    const { _id, role } = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw new ApiError(401, "Middleware: Invalid token");
    }

    let user;

    if (!role) {
      user = await Donor.findById(_id);
    }

    if (role === "bloodBank") {
      user = await BloodBank.findById(_id);
    }

    if (!user) {
      throw new ApiError(401, "Middleware: User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Middleware: Invalid token");
  }
});

export { verifyJWT };
