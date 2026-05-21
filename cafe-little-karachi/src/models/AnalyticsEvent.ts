import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  distinctId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, index: true }, // e.g., 'pageview', 'add_to_cart', 'remove_from_cart', 'checkout_start', 'checkout_success', 'variation_select', 'tab_navigation', 'scroll'
  path: { type: String, required: true },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
});

const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;
