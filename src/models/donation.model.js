import mongoose, { Schema } from "mongoose";

const donationSchema = new Schema(
  {
    donorId: {
      type: Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },

    type: {
      type: String,
      enum: ["Donate", "Recieve"],
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
          return this.type === "Recieve";
        },
      },
      name: {
        type: String,
        required: function () {
          return this.type === "Recieve";
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
        required: function () {
          return this.type === "Recieve";
        },
      },
      componentGiven: {
        type: String,
        required: function () {
          return this.type === "Recieve";
        },
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
    },
  },
  {
    timestamps: true,
  }
);

export const Donation = mongoose.model("Donation", donationSchema);
