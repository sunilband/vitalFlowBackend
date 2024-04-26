import { Router } from "express";
import {
  bloodBankChat,
  removeChatContext,
  getChatHistory,
} from "../controllers/chat.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/ratelimiter.middleware.js";

const router = Router();

// POST
router.route("/blood-bank-chat").post(rateLimit(50), verifyJWT, bloodBankChat); //auth

// GET
router.route("/get-chat-history").get(rateLimit(50), verifyJWT, getChatHistory); //auth

// PUT
router
  .route("/remove-chat-context")
  .put(rateLimit(50), verifyJWT, removeChatContext); //auth

// router
//   .route("/change-password")
//   .put(rateLimit(1), verifyJWT, changeUserpassword);

// router
//   .route("/update-account")
//   .put(rateLimit(1), verifyJWT, updateAccountDetails);

export default router;
