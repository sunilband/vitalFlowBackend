import { Router } from "express";
import {
  sendEmailVerifyOTP,
  verifyOTP,
  registerBloodBank,
  loginBloodBank,
  getBloodBank,
} from "../controllers/bloodbank.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/ratelimiter.middleware.js";

const router = Router();

// POST
router.route("/send-register-otp").post(rateLimit(50), sendEmailVerifyOTP);
router.route("/verify-otp").post(rateLimit(50), verifyOTP);
router.route("/register").post(rateLimit(50), registerBloodBank);
router.route("/login").post(rateLimit(50), loginBloodBank);

// GET
router.route("/get-blood-bank").get(rateLimit(50), verifyJWT, getBloodBank);

// router
//   .route("/change-password")
//   .put(rateLimit(1), verifyJWT, changeUserpassword);

// router
//   .route("/update-account")
//   .put(rateLimit(1), verifyJWT, updateAccountDetails);

export default router;
