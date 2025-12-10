import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  ordertype: { type: String, default: null },
  phone: { type: String, default: null },
  rating: { type: Number, required: true },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);

export default Feedback;

