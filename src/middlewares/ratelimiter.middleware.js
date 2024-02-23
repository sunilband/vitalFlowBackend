import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { maxRequests } from "../constants.js";
import { cache } from "../db/NodeCacher/index.js";

const rateLimit = (customMaxRequests) =>
  asyncHandler(async (req, res, next) => {
    // customMaxRequests is optional
    const maxRequestAllowed = customMaxRequests || maxRequests;
    const clientIP = req.ip;
    const route = req.route.path;
    const key = `${clientIP}-${route}`;

    let data = cache.get(key);

    if (!data) {
      data = { count: 1 };
      cache.set(key, data);
    } else if (data.count >= maxRequestAllowed) {
      throw new ApiError(429, "Too many requests. Please try again later.");
    } else {
      data.count++;
      cache.set(key, data);
    }
    next();
  });

export { rateLimit };
