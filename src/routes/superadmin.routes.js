import { Router } from "express";
import {
  loginSuperAdmin,
  getBloodBanks,
  changeBloodBankStatus,
  logoutSuperAdmin,
  getSuperAdmin,
} from "../controllers/superadmin.controller.js";

import { rateLimit } from "../middlewares/ratelimiter.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// POST
router.route("/login").post(rateLimit(50), loginSuperAdmin);

// GET
router.route("/get-super-admin").get(rateLimit(50), verifyJWT, getSuperAdmin); //auth
router.route("/get-blood-banks").get(rateLimit(50), verifyJWT, getBloodBanks); //auth
router.route("/logout").get(rateLimit(50), logoutSuperAdmin);

// PUT
router
  .route("/change-blood-bank-status")
  .put(rateLimit(50), verifyJWT, changeBloodBankStatus); //auth

// router
//   .route("/change-password")
//   .put(rateLimit(1), verifyJWT, changeUserpassword);

// router
//   .route("/update-account")
//   .put(rateLimit(1), verifyJWT, updateAccountDetails);

export default router;
