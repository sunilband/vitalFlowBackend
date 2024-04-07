import { Router } from "express";
import {
  sendEmailVerifyOTP,
  verifyOTP,
  registerBloodBank,
  loginBloodBank,
  getBloodBank,
  logoutBloodBank,
  changeCampStatus,
  getCamps,
  assignRecipient,
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
router.route("/get-blood-bank").get(rateLimit(50), verifyJWT, getBloodBank); //auth
router.route("/get-camps").get(rateLimit(50), verifyJWT, getCamps); //auth
router.route("/logout").get(rateLimit(50), verifyJWT, logoutBloodBank); //auth

// PUT
router
  .route("/change-camp-status")
  .put(rateLimit(50), verifyJWT, changeCampStatus); //auth
router
  .route("/assign-recipient")
  .put(rateLimit(50), verifyJWT, assignRecipient); //auth

export default router;
