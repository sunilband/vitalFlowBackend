import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import { BloodBank } from "../models/bloodBank.model.js";
import { Otp } from "../models/otp.model.js";
import { DonationCamp } from "../models/donationCamp.model.js";
import { Donation } from "../models/donation.model.js";
import { Donor } from "../models/donor.model.js";
import mongoose from "mongoose";

const sendEmailVerifyOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Please provide a email ");
  } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email ");
  }

  const existingUser = await BloodBank.findOne({ email, emailVerified: true });

  if (existingUser) {
    throw new ApiError(409, `Email already registered`);
  }

  const existingOtp = await Otp.findOne({
    email,
    status: "pending",
    expiry: { $gt: new Date() },
    type: "verification",
  });

  if (existingOtp) {
    throw new ApiError(
      409,
      `OTP already sent to ${email}, please check your email`
    );
  }

  const newOtp = await Otp.create({ email, type: "verification" });

  res
    .status(200)
    .json(new ApiResponse(200, {}, `OTP sent successfully to ${email}`));
});

// -------------verify otp---------------
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  //  check if phone or email is present and otp must be present
  if (!email || !otp) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  let existingOtp = await Otp.findOne({
    email,
    otp,
    status: "pending",
  });

  if (existingOtp) existingOtp.status = "verified";

  if (!existingOtp) throw new ApiError(400, "Invalid OTP");

  await existingOtp.save({
    validateBeforeSave: false,
  });
  res.status(200).json(new ApiResponse(200, {}, "OTP verified successfully"));
});

// -------------register blood bank---------------
const registerBloodBank = asyncHandler(async (req, res, next) => {
  const {
    name,
    parentHospitalName,
    category,
    contactPersonName,
    contactPersonPhone,
    email,
    license,
    licenseValidity,
    address,
    website,
    componentFacility,
    apheresisFacility,
    helplineNumber,
    acceptedDonorType,
    acceptedDonationType,
    acceptedComponentType,
    bagType,
    ttiType,
    remarks,
    password,
    confirmPassword,
  } = req.body;

  if (
    !name ||
    !category ||
    !contactPersonName ||
    !contactPersonPhone ||
    !email ||
    !license ||
    !licenseValidity ||
    !password ||
    !confirmPassword
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  if (
    !address ||
    !address.addressLine1 ||
    !address.state ||
    !address.city ||
    !address.pincode
  ) {
    throw new ApiError(400, "All address fields are required");
  }

  const verifiedEmail = await Otp.findOne({
    email,
    status: "verified",
  });

  if (!verifiedEmail) {
    throw new ApiError(400, "Please verify your email first");
  }

  const existingUser = await BloodBank.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const bloodBank = await BloodBank.create({
    name,
    parentHospitalName,
    category,
    contactPersonName,
    contactPersonPhone,
    email,
    license,
    licenseValidity,
    address: {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      state: address.state,
      city: address.city,
      pincode: address.pincode,
      addressType: "Bloodbank",
    },
    website,
    componentFacility,
    apheresisFacility,
    helplineNumber,
    acceptedDonorType,
    acceptedDonationType,
    acceptedComponentType,
    bagType,
    ttiType,
    remarks,
    password,
  });

  const accessToken = await bloodBank.generateAuthToken();
  const refreshToken = await bloodBank.generateRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new ApiError(500, "Token generation failed");
  }

  res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        { bloodBank },
        "Blood Bank registered successfully , Awaiting admin approval"
      )
    );
});

// -------------login blood bank---------------
const loginBloodBank = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!password || !email) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  let existingUser = await BloodBank.findOne({ email }).select("+password");

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const validPassword = await existingUser.checkPassword(password);

  if (!validPassword) {
    throw new ApiError(400, "Invalid credentials");
  }

  const accessToken = await existingUser.generateAuthToken();
  const refreshToken = await existingUser.generateRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new ApiError(500, "Token generation failed");
  }

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, existingUser, "User logged in successfully"));
});

// -------------Get all camps---------------
const getCamps = asyncHandler(async (req, res, next) => {
  const query = {};

  if (req.query.status) query.status = req.query.status;
  if (req.query.organizationType)
    query.organizationType = req.query.organizationType;
  if (req.query.date) query.category = req.query.date;

  if (req.query.address) {
    query["address.state"] = req.query.address.state;
    query["address.city"] = req.query.address.city;
  }
  const bloodBankId = req.user._id.toHexString();
  query.bloodbank = bloodBankId;
  const camps = await DonationCamp.find(query);
  res.status(200).json(new ApiResponse(200, { camps }));
});

// -------------Change Camp status---------------
const changeCampStatus = asyncHandler(async (req, res, next) => {
  const status = req.query.status;
  const campId = req.query.id;

  const camp = await DonationCamp.findById(campId);
  if (!camp) {
    throw new ApiError(404, "Camp not found");
  }
  camp.status = status;
  await camp.save();
  res.status(200).json(new ApiResponse(200, { camp }));
});

// -------------Get blood bank---------------
const getBloodBank = asyncHandler(async (req, res, next) => {
  const user = req.user;
  res
    .status(200)
    .json(new ApiResponse(200, user, "Blood bank profile fetched"));
});

// -------------logout blood bank---------------
const logoutBloodBank = asyncHandler(async (req, res, next) => {
  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// -------------assign recipient to donation---------------
const assignRecipient = asyncHandler(async (req, res, next) => {
  let {
    donationId,
    recipientId,
    fullName,
    phone,
    email,
    componentGiven,
    componentQuantityGiven,
  } = req.body;

  if (
    !donationId ||
    (!recipientId && (!fullName || !phone || !email)) ||
    !componentGiven ||
    !componentQuantityGiven
  ) {
    throw new Error("Incomplete details");
  }

  const donation = await Donation.findById(donationId);

  if (!donation) {
    throw new Error("Donation data was not found");
  }

  let recipient;
  if (recipientId) {
    recipient = await Donor.findById(recipientId);

    if (!recipient) {
      throw new Error("Recipient not found");
    }
  }

  // if donation is of whole blood type, then componentGiven should be extracted from whole blood
  if (donation.componentDetails.componentType === "Whole Blood") {
    const extractedComponentsFromWholeBlood =
      donation.extractedComponentsFromWholeBlood.find(
        (item) => item.component === componentGiven
      );
    if (!extractedComponentsFromWholeBlood) {
      throw new Error(
        "Component not extracted from whole blood for this donation"
      );
    }
    if (extractedComponentsFromWholeBlood.quantity < componentQuantityGiven) {
      throw new Error(`The given quantity is more than the extracted quantity`);
    }

    // there can be previous recipients, so we need to check the remaining quantity as the recipients field is an array.first find what previous recipients have taken the component and then subtract the quantity from the extracted quantity
    const previousRecipients = donation.recipients.filter(
      (item) => item.componentGiven === componentGiven
    );
    let totalQuantityGiven = 0;
    previousRecipients.forEach((item) => {
      totalQuantityGiven += item.componentQuantityGiven;
    });

    const remainingQuantity =
      extractedComponentsFromWholeBlood.quantity - totalQuantityGiven;

    if (remainingQuantity < componentQuantityGiven) {
      throw new Error(
        `The given quantity is more than the remaining quantity of the extracted component.Its been assigned to previous recipients of this donation. The remaining quantity for ${componentGiven} is ${remainingQuantity} ml.`
      );
    }
  }
  // if donation is not of whole blood type, then componentGiven should be same as donated component type
  if (
    donation.componentDetails.componentType !== "Whole Blood" &&
    componentGiven !== donation.componentDetails.componentType
  ) {
    throw new Error(
      "The given component type does not match the donated component type"
    );
  }
  // if donation is not of whole blood type, then componentQuantityGiven should be less than or equal to donated component quantity
  const previousRecipients = donation.recipients.filter(
    (item) => item.componentGiven === componentGiven
  );
  let totalQuantityGiven = 0;
  previousRecipients.forEach((item) => {
    totalQuantityGiven += item.componentQuantityGiven;
  });

  const remainingQuantity =
    donation.componentDetails.componentQuantity - totalQuantityGiven;

  if (remainingQuantity < componentQuantityGiven) {
    throw new Error(
      `The given quantity is more than the remaining quantity of the donated component. Its been assigned to previous recipients of this donation. The remaining quantity is ${remainingQuantity} ml.`
    );
  }

  if (recipient) {
    fullName = recipient.fullName;
    phone = recipient.phone;
    email = recipient.email;

    donation.recipients.push({
      registered: true,
      recipientId,
      fullName,
      phone,
      email,
      componentGiven,
      componentQuantityGiven,
    });
  } else {
    donation.recipients.push({
      registered: false,
      fullName,
      phone,
      email,
      componentGiven,
    });
  }

  await donation.save();

  res.status(200).json(new ApiResponse(200, { donation }));
});

// -------------Extract components from whole blood---------------
const extractComponentsFromWholeBlood = asyncHandler(async (req, res, next) => {
  // the data is coming like this { donationId: '60f9b3b3b3b3b3b3b3b3b3b3', extractedComponentsFromWholeBlood:[{Plasma:200},"Platelet Concentrate":"300"]   }
  let { donationId, extractedComponentsFromWholeBlood } = req.body;
  if (!donationId || !extractedComponentsFromWholeBlood) {
    throw new Error("Incomplete details");
  }
  const donation = await Donation.findById(donationId);
  if (!donation) {
    throw new Error("Donation data was not found");
  }
  if (donation.componentDetails.componentType !== "Whole Blood") {
    throw new Error("The donation is not of whole blood type.");
  }

  let componentDetails = donation.componentDetails;
  let wholeBloodQuantity = componentDetails.componentQuantity; // directly access the componentQuantity
  let totalExtractedQuantity = 0;
  extractedComponentsFromWholeBlood.forEach((item) => {
    totalExtractedQuantity += item.quantity;
  });
  if (totalExtractedQuantity > wholeBloodQuantity) {
    throw new Error(
      `The total quantity of the extracted components cannot exceed the donated quantity of whole blood. The donated quantity of whole blood is ${wholeBloodQuantity} ml. and the total quantity of the extracted components is ${totalExtractedQuantity} ml.`
    );
  }
  donation.extractedComponentsFromWholeBlood =
    extractedComponentsFromWholeBlood;
  await donation.save();
  res.status(200).json(new ApiResponse(200, { donation }));
});

// ------------find donations (filterable)------------
const filterDonations = asyncHandler(async (req, res, next) => {
  // part of recipient name and donor name can also be searched

  const {
    recipientfullName,
    donorFullName,
    email,
    bloodGroup,
    componentType,
    donationTime,
  } = req.body;
  const { _id } = req.user;

  let query = { bloodbankId: _id };

  if (recipientfullName) {
    query["recipients.fullName"] = {
      $regex: new RegExp(recipientfullName, "i"),
    };
  }
  if (email) {
    query["recipients.email"] = email;
  }

  if (bloodGroup) {
    query["componentDetails.bloodGroup"] = bloodGroup;
  }

  if (componentType) {
    query["componentDetails.componentType"] = componentType;
  }

  if (donationTime) {
    query.donationTime = { $gte: new Date(donationTime) };
  }

  let donations = await Donation.find(query).populate("donorId");

  if (donorFullName) {
    donations = donations.filter((donation) =>
      donation.donorId.fullName
        .toLowerCase()
        .includes(donorFullName.toLowerCase())
    );
  }

  if (!donations) {
    throw new Error("No donations found");
  }

  res.status(200).json(new ApiResponse(200, { donations }));
});

// ---------------TODO:THIS IS INCOMPLETE (NEEDS TO BE COMPLETED) the remaining quantity needs to be minus from donated----------------
const getOwnAvailableComponentQuantity = asyncHandler(
  async (req, res, next) => {
    let { _id } = req.user;
    console.log(_id);
    // _id is new ObjectId('65f967279a6c3cc8a62e2f67')

    const availableQuantities = await Donation.aggregate([
      {
        $project: {
          _id: 0,
          componentType: {
            $cond: [
              { $eq: ["$componentDetails.componentType", "Whole Blood"] },
              {
                $cond: [
                  { $isArray: "$extractedComponentsFromWholeBlood" },
                  {
                    $map: {
                      input: "$extractedComponentsFromWholeBlood",
                      as: "extracted",
                      in: "$$extracted.component",
                    },
                  },
                  [],
                ],
              },
              "$componentDetails.componentType",
            ],
          },
          componentQuantity: {
            $cond: [
              { $eq: ["$componentDetails.componentType", "Whole Blood"] },
              {
                $cond: [
                  { $isArray: "$extractedComponentsFromWholeBlood" },
                  { $sum: "$extractedComponentsFromWholeBlood.quantity" },
                  "$componentDetails.componentQuantity",
                ],
              },
              "$componentDetails.componentQuantity",
            ],
          },
        },
      },
      {
        $unwind: "$componentType",
      },
      {
        $group: {
          _id: "$componentType",
          totalAvailable: { $sum: "$componentQuantity" },
        },
      },
    ]);

    // Step 2: Calculate Given Quantities
    const givenQuantities = await Donation.aggregate([
      {
        $unwind: "$recipients",
      },
      {
        $group: {
          _id: "$recipients.componentGiven",
          totalGiven: { $sum: "$recipients.componentQuantityGiven" },
        },
      },
    ]);

    // Step 3: Subtract Given from Available
    const remainingQuantities = availableQuantities.map((available) => {
      const given = givenQuantities.find(
        (given) => given._id === available._id
      );
      const remaining = given
        ? available.totalAvailable - given.totalGiven
        : available.totalAvailable;
      // Ensure remaining quantity is not negative
      return {
        componentType: available._id,
        remainingQuantity: Math.max(0, remaining),
      };
    });

    console.log(availableQuantities);
    console.log("-----------");
    console.log(givenQuantities);
    console.log("-----------");
    console.log(remainingQuantities);

    res.status(200).json(new ApiResponse(200, {}));
  }
);

export {
  sendEmailVerifyOTP,
  verifyOTP,
  registerBloodBank,
  loginBloodBank,
  getCamps,
  changeCampStatus,
  getBloodBank,
  logoutBloodBank,
  assignRecipient,
  getOwnAvailableComponentQuantity,
  extractComponentsFromWholeBlood,
  filterDonations,
};
