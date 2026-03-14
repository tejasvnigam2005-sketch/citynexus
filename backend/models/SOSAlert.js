const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    locationText: {
      type: String,
      default: "Unknown",
    },
    status: {
      type: String,
      enum: ["activated", "dispatched", "cancelled", "resolved"],
      default: "activated",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
