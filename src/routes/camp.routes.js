import { Router } from "express";
import {
  sendEmailVerifyOTP,
  verifyOTP,
  registerDonationCamp,
  //   registerBloodBank,
  //   loginBloodBank,
  //   getBloodBank,
  //   logoutBloodBank,
} from "../controllers/camp.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/ratelimiter.middleware.js";

const router = Router();

// POST
router.route("/send-register-otp").post(rateLimit(50), sendEmailVerifyOTP);
router.route("/verify-otp").post(rateLimit(50), verifyOTP);
router.route("/register").post(rateLimit(50), registerDonationCamp);
// router.route("/login").post(rateLimit(50), loginBloodBank);

// // GET
// router.route("/get-blood-bank").get(rateLimit(50), verifyJWT, getBloodBank); //auth
// router.route("/logout").get(rateLimit(50), verifyJWT, logoutBloodBank); //auth

export default router;
