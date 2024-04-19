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
  extractComponentsFromWholeBlood,
  filterDonations,
  getOwnAvailableComponentQuantity,
} from "../controllers/bloodbank.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/ratelimiter.middleware.js";

const router = Router();

// POST
router.route("/send-register-otp").post(rateLimit(50), sendEmailVerifyOTP);
router.route("/verify-otp").post(rateLimit(50), verifyOTP);
router.route("/register").post(rateLimit(50), registerBloodBank);
router.route("/login").post(rateLimit(50), loginBloodBank);
router.route("/get-camps").post(rateLimit(50), verifyJWT, getCamps); //auth

// GET
router.route("/get-blood-bank").get(rateLimit(50), verifyJWT, getBloodBank); //auth
router.route("/logout").get(rateLimit(50), verifyJWT, logoutBloodBank); //auth
router
  .route("/get-available-quantity")
  .get(rateLimit(50), verifyJWT, getOwnAvailableComponentQuantity); //auth
router
  .route("/filter-donations")
  .get(rateLimit(50), verifyJWT, filterDonations); //auth

// PUT
router
  .route("/change-camp-status")
  .put(rateLimit(50), verifyJWT, changeCampStatus); //auth
router
  .route("/assign-recipient")
  .put(rateLimit(50), verifyJWT, assignRecipient); //auth
router
  .route("/extract-components")
  .put(rateLimit(50), verifyJWT, extractComponentsFromWholeBlood); //auth

export default router;
