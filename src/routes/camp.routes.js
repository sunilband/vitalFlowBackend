import { Router } from "express";
import {
  sendEmailVerifyOTP,
  verifyOTP,
  registerDonationCamp,
  loginDonationCamp,
  getDonationCamp,
  logoutCamp,
  getRegisteredBloodBanks,
} from "../controllers/camp.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/ratelimiter.middleware.js";

const router = Router();

// POST
router.route("/send-register-otp").post(rateLimit(50), sendEmailVerifyOTP);
router.route("/verify-otp").post(rateLimit(50), verifyOTP);
router.route("/register").post(rateLimit(50), registerDonationCamp);
router.route("/login").post(rateLimit(50), loginDonationCamp);
router.route("/get-blood-banks").post(rateLimit(50), getRegisteredBloodBanks); //this will be used for registration of camp

// GET
router.route("/get-camp").get(rateLimit(50), verifyJWT, getDonationCamp); //auth
router.route("/logout").get(rateLimit(50), verifyJWT, logoutCamp); //auth

export default router;
