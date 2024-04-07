import mongoose, { Schema } from "mongoose";
import { DonationCamp } from "./donationCamp.model.js";
import { Donor } from "./donor.model.js";
import { sendMail } from "../utils/mailService.js";

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
        enum: [
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
        ],
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
    },

    recipient: {
      registered: {
        type: Boolean,
      },
      recipientId: {
        type: Schema.Types.ObjectId,
        ref: "Donor",
        required: function () {
          return this.recipient.registered;
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
        type: String,
      },
    },

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
    const html = `<p>Your donation has been used to save a life! Thank you for your contribution.</p>`;
    if (donor.email && donor.emailVerified) {
      await sendMail(donor.email, subject, html);
    }
  }
  next();
});

export const Donation = mongoose.model("Donation", donationSchema);
