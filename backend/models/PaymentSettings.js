import mongoose from "mongoose";

/**
 * Singleton-style settings doc (one row in the collection).
 * Supports multiple bank accounts + one QR code image.
 */

const bankAccountSchema = new mongoose.Schema(
  {
    bankName:      { type: String, default: "" },
    accountName:   { type: String, default: "" },
    accountNumber: { type: String, default: "" },
  },
  { _id: false }
);

const paymentSettingsSchema = new mongoose.Schema(
  {
    bankQrCode:   { type: String, default: "" },   // /uploads/xxx.jpg
    instructions: { type: String, default: "Transfer the exact order amount to one of the accounts below, then take a screenshot and upload it on the Order Details page." },

    // Multiple bank accounts shown to customers
    bankAccounts: {
      type: [bankAccountSchema],
      default: [
        { bankName: "Commercial Bank of Ethiopia (CBE)", accountName: "TechStore PLC", accountNumber: "1000597550938" },
        { bankName: "Awash Bank",                        accountName: "TechStore PLC", accountNumber: "013201119088300" },
      ],
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const PaymentSettings = mongoose.model("PaymentSettings", paymentSettingsSchema);
export default PaymentSettings;
