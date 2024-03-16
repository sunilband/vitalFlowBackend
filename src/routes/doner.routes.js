import { Router } from "express";
import {
  sendPhoneOTP,
  sendEmailOTP,
  verifyOTP,
  registerDoner,
  loginOTP,
  loginDonor,
  logoutUser,
  refreshAccessToken,
  changeUserpassword,
  getCurrentUser,
  updateAccountDetails,
} from "../controllers/doner.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/ratelimiter.middleware.js";

const router = Router();

// POST
router.route("/send-phone-otp").post(rateLimit(50), sendPhoneOTP);
router.route("/send-email-otp").post(rateLimit(50), sendEmailOTP);
router.route("/verify-otp").post(rateLimit(50), verifyOTP);
router.route("/register-doner").post(rateLimit(50), registerDoner);
router.route("/send-login-otp").post(rateLimit(50), loginOTP);
router.route("/login-donor").post(rateLimit(50), loginDonor);

// GET
router.route("/get-donor").get(rateLimit(50), verifyJWT, getCurrentUser); //auth
router.route("/logout").get(rateLimit(50), verifyJWT, logoutUser); //auth
router.route("/refresh-token").get(rateLimit(50), refreshAccessToken);

// router
//   .route("/change-password")
//   .put(rateLimit(1), verifyJWT, changeUserpassword);

// router
//   .route("/update-account")
//   .put(rateLimit(1), verifyJWT, updateAccountDetails);

export default router;
