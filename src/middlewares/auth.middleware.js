import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req?.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      throw new ApiError(401, "Middleware: Invalid token");
    }

    const { _id } = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    if (!_id) {
      throw new ApiError(401, "Middleware: Invalid token");
    }

    // Check if _id is a valid string that can be converted to an ObjectId
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw new ApiError(401, "Middleware: Invalid _id");
    }

    // Finding whichever collection the user is in
    const collections = ["donors", "hospitals", "bloodbanks"]; // we have to give plural collection names
    const ObjectId = mongoose.Types.ObjectId;
    const _idObj = new ObjectId(_id);

    let pipeline = collections.slice(1).map((collectionName) => {
      return {
        $unionWith: {
          coll: collectionName,
          pipeline: [
            {
              $match: { _id: _idObj },
            },
          ],
        },
      };
    });

    const user = await mongoose.connection.db
      .collection(collections[0])
      .aggregate(pipeline)
      .toArray();

    if (!user || user.length === 0) {
      throw new ApiError(401, "Middleware: User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Middleware: Invalid token");
  }
});

export { verifyJWT };
