/**
 * SiteSettings — singleton document for global feature flags.
 * Fetched once on load; updated via admin API.
 */
import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    messageCenterEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
export default SiteSettings;
