import mongoose from "mongoose";

const notificationConsentSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  ordertype: { type: String, default: null },
  phone: { type: String, default: null },
  channel: { type: String, enum: ["whatsapp", "push"], required: true },
  consent: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

const NotificationConsent =
  mongoose.models.NotificationConsent ||
  mongoose.model("NotificationConsent", notificationConsentSchema);

export default NotificationConsent;

