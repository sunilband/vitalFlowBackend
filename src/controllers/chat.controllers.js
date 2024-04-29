import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import { BloodBank } from "../models/bloodBank.model.js";
import { Otp } from "../models/otp.model.js";
import { sendMail } from "../utils/mailService.js";
import { DonationCamp } from "../models/donationCamp.model.js";
import { Donation } from "../models/donation.model.js";
import { Donor } from "../models/donor.model.js";
import mongoose from "mongoose";
import { generateAiOutput } from "../utils/generateAiOutput.js";
import { cache } from "../db/NodeCacher/index.js";
import { Chat } from "../models/chat.model.js";

const bloodBankChat = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { question } = req.body;

  //   Cache the data use nodecacher
  const cacheKey = `${_id}`;
  const cachedData = await cache.get(cacheKey);

  let result = !cachedData
    ? await BloodBank.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(_id),
          },
        },
        {
          $lookup: {
            from: "donationcamps",
            localField: "_id",
            foreignField: "bloodbank",
            as: "campsAssociatedWithBloodBank",
          },
        },
        {
          $lookup: {
            from: "donations",
            let: { bloodbankId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$bloodbankId", "$$bloodbankId"],
                  },
                },
              },
            ],
            as: "donations",
          },
        },
        {
          $lookup: {
            from: "donors",
            localField: "donations.donorId",
            foreignField: "_id",
            as: "donors",
          },
        },
      ])
    : [cachedData];

  if (!cachedData) {
    cache.set(cacheKey, result);
  }

  const [bloodBankDetails] = result;

  let history = await Chat.find({ senderId: _id, considerContext: true });
  history = history.map((chat) => ({
    role: chat.role,
    parts: [{ text: chat.message }],
  }));

  const AiOutput = await generateAiOutput(history, question, {
    bloodBankDetails,
  });

  await Chat.insertMany([
    {
      senderId: _id,
      role: "user",
      message: question,
    },
    {
      senderId: _id,
      role: "model",
      message: AiOutput,
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      AiOutput,
    })
  );
});

const campChat = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { question } = req.body;

  // Cache the data use nodecacher
  const cacheKey = `${_id}`;
  const cachedData = await cache.get(cacheKey);

  let result = !cachedData
    ? await DonationCamp.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(_id),
          },
        },
        {
          $lookup: {
            from: "donations",
            let: { campId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$campId", "$$campId"],
                  },
                },
              },
            ],
            as: "donations",
          },
        },
        {
          $lookup: {
            from: "donors",
            localField: "donations.donorId",
            foreignField: "_id",
            as: "donors",
          },
        },
        {
          $lookup: {
            from: "bloodbanks",
            localField: "bloodbank",
            foreignField: "_id",
            as: "bloodbank",
          },
        },
      ])
    : [cachedData];

  if (!cachedData) {
    cache.set(cacheKey, result);
  }

  const [campDetails] = result;

  let history = await Chat.find({ senderId: _id, considerContext: true });
  history = history.map((chat) => ({
    role: chat.role,
    parts: [{ text: chat.message }],
  }));

  const AiOutput = await generateAiOutput(history, question, {
    campDetails,
  });

  await Chat.insertMany([
    {
      senderId: _id,
      role: "user",
      message: question,
    },
    {
      senderId: _id,
      role: "model",
      message: AiOutput,
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      AiOutput,
    })
  );
});

const removeChatContext = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  await Chat.updateMany({ senderId: _id }, { considerContext: false });
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Context removed , Chat History cleared"));
});

const getChatHistory = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const history = await Chat.find({ senderId: _id, considerContext: true });
  res.status(200).json(new ApiResponse(200, history, "Chat History fetched"));
});

export { bloodBankChat, campChat, removeChatContext, getChatHistory };
