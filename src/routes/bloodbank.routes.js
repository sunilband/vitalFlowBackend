import { Router } from "express";
import {
  registerBloodBank,
  sendEmailVerifyOTP,
} from "../controllers/bloodbank.controller.js";

import { rateLimit } from "../middlewares/ratelimiter.middleware.js";

const router = Router();

// POST
router.route("/send-register-otp").post(rateLimit(50), sendEmailVerifyOTP);
router.route("/register").post(rateLimit(50), registerBloodBank);

// GET

// router
//   .route("/change-password")
//   .put(rateLimit(1), verifyJWT, changeUserpassword);

// router
//   .route("/update-account")
//   .put(rateLimit(1), verifyJWT, updateAccountDetails);

export default router;
