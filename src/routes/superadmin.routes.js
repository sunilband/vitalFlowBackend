import { Router } from "express";
import {
  loginSuperAdmin,
  logoutSuperAdmin,
} from "../controllers/superadmin.controller.js";

import { rateLimit } from "../middlewares/ratelimiter.middleware.js";

const router = Router();

// POST
router.route("/login").post(rateLimit(50), loginSuperAdmin);

// GET
router.route("/logout").get(rateLimit(50), logoutSuperAdmin);

// router
//   .route("/change-password")
//   .put(rateLimit(1), verifyJWT, changeUserpassword);

// router
//   .route("/update-account")
//   .put(rateLimit(1), verifyJWT, updateAccountDetails);

export default router;
