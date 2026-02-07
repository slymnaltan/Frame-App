const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
    eventDate: { type: Date },
    venue: { type: String },
    qrCodeId: { type: String, required: true, unique: true },
    uploadSlug: { type: String, required: true, unique: true },
    qrCodeImage: { type: String, required: true },
    uploadUrl: { type: String, required: true },
    storagePrefix: { type: String, required: true },
    pricingPlan: { type: String, default: "standard" },
    rentalStart: { type: Date },
    rentalEnd: { type: Date },
    storageExpiresAt: { type: Date },
    retentionDays: { type: Number, default: 30 },
    isFilesDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);

