const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploaderName: { type: String },
    uploaderContact: { type: String },
    note: { type: String },
    storageKey: { type: String, required: true },
    storageUrl: { type: String },
    status: {
      type: String,
      enum: ["available", "deleted"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Upload", uploadSchema);

