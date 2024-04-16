import mongoose, { Schema } from "mongoose";
import { DonationCamp } from "./donationCamp.model.js";
import { Donor } from "./donor.model.js";
import { sendMail } from "../utils/mailService.js";

const componentsEnum = [
  "Cryo Poor Plasma",
  "Cryoprecipitate",
  "Fresh Frozen Plasma",
  "Irradiated RBC",
  "Leukoreduced RBC",
  "Packed Red Blood Cells",
  "Plasma",
  "Platelet Concentrate",
  "Platelet Rich Plasma",
  "Platelets additive solutions",
  "Random Donor Platelets",
  "Sagm Packed RBC",
  "Single Donor Plasma",
  "Single Donor Platelet",
  "Whole Blood",
];

const donationSchema = new Schema(
  {
    donorId: {
      type: Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },

    componentDetails: {
      componentType: {
        type: String,
        required: true,
        enum: componentsEnum,
      },
      componentQuantity: {
        type: Number,
        required: true,
      },
      bloodGroup: {
        type: String,
        required: true,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
      // make extracted field if whole blood is selected and give enum values as what parts are extracted from whole blood
    },
    extractedComponentsFromWholeBlood: {
      // validation for thi field is to be done in controller
      type: [
        {
          component: {
            type: String,
            enum: componentsEnum,
          },
          quantity: {
            type: Number,
          },
          remainingQuantity: {
            type: Number,
            default: function () {
              return this.quantity;
            },
          },
        },
      ],
    },

    recipients: [
      {
        registered: {
          type: Boolean,
        },
        recipientId: {
          type: Schema.Types.ObjectId,
          ref: "Donor",
          required: function () {
            return this.registered;
          },
        },
        fullName: {
          type: String,
        },
        email: {
          type: String,
          validate: {
            validator: function (v) {
              return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
            },
            message: (props) => `${props.value} is not a valid email`,
          },
        },
        phone: {
          type: String,
          validate: {
            validator: function (v) {
              return /^[0-9]{10}$/.test(v);
            },
            message: (props) => `${props.value} is not a valid phone number`,
          },
        },
        componentGiven: {
          // validation for this field is to be done in controller
          type: String,
        },
        componentQuantityGiven: {
          // validation for this field is to be done in controller
          type: Number,
        },
      },
    ],

    donationTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    campId: {
      type: Schema.Types.ObjectId,
      ref: "DonationCamp",
      required: true,
    },
    bloodbankId: {
      type: Schema.Types.ObjectId,
      ref: "BloodBank",
    },
  },
  {
    timestamps: true,
  }
);

donationSchema.pre("save", async function (next) {
  //checking if camp exists
  const camp = await DonationCamp.findById(this.campId);
  if (!camp) {
    throw new Error("Camp ID does not exist");
  }

  //donation creation mail
  const subject = "Donation Acknowledgement";
  const html = `<p>Thank you for donating using Vital~Flow! Whenever the donation is used to save lives you will be notified!</p>`;
  const donor = await Donor.findById(this.donorId);
  if (this.isNew) {
    // find bloodbankid using camp
    this.bloodbankId = camp.bloodbank;
    //send mail to donor
    if (donor.email && donor.emailVerified) {
      await sendMail(donor.email, subject, html);
    }
  }
  next();
});

//sending mail to donor when donation is used
donationSchema.post("save", async function (doc, next) {
  if (doc.recipient && doc.recipient.recipientId) {
    const donor = await Donor.findById(doc.donorId);
    const subject = "Donation Update";
    const html = `<p>Your donation of ${doc.componentDetails.componentQuantity} units of ${doc.componentDetails.componentType} has been used to save a life! Thank you for your contribution.</p>`;
    if (donor.email && donor.emailVerified) {
      await sendMail(donor.email, subject, html);
    }
  }
  next();
});

export const Donation = mongoose.model("Donation", donationSchema);
