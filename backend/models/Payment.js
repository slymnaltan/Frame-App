const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    conversationId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    token: { type: String },
    amount: { type: Number, required: true },
    rentalPlan: { type: String, required: true },
    storagePlan: { type: String, required: true },
    rentalDays: { type: Number, required: true },
    storageDays: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
    },
    paymentDetails: { type: Object },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
