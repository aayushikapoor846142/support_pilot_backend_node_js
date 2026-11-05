import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, default: "" },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
  status: { type: String, enum: ["Open", "In review", "Pending", "Resolved", "Closed"], default: "Open" },
  assignedTo: { type: String, trim: true, default: "" },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

ticketSchema.index({ title: "text", description: "text" });
export default mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
