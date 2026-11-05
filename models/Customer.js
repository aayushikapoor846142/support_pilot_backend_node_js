import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  phone: { type: String, trim: true, default: "" },
  company: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

customerSchema.index({ name: "text", email: "text", company: "text" });
export default mongoose.models.Customer || mongoose.model("Customer", customerSchema);
