const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    detections: [
      {
        label: String,
        confidence: Number,
        box: [Number],
      },
    ],
    count: {
      type: Number,
      default: 0,
    },
    hasAccident: {
      type: Boolean,
      default: false,
    },
    sosTriggered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Detection", detectionSchema);
