import { Router } from "express";
import Ticket from "../models/Ticket.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/summary", asyncHandler(async (req, res) => {
  const [
    totalTickets, totalCustomers, totalProducts,
    statusGroups, priorityGroups, recentTickets, resolvedTickets,
  ] = await Promise.all([
    Ticket.countDocuments(),
    Customer.countDocuments(),
    Product.countDocuments(),
    Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Ticket.find().sort({ createdAt: -1 }).limit(5).populate("customer", "name").populate("product", "name"),
    Ticket.find({ resolvedAt: { $ne: null } }, { createdAt: 1, resolvedAt: 1 }),
  ]);
  const avgResolutionHours = resolvedTickets.length
    ? Number((resolvedTickets.reduce((sum, t) => sum + Math.max(0, t.resolvedAt - t.createdAt), 0) / resolvedTickets.length / 3600000).toFixed(2))
    : null;
  res.json({
    success: true,
    data: {
      totals: { tickets: totalTickets, customers: totalCustomers, products: totalProducts },
      byStatus: statusGroups.map((x) => ({ label: x._id, value: x.count })),
      byPriority: priorityGroups.map((x) => ({ label: x._id, value: x.count })),
      avgResolutionHours,
      recentTickets,
    },
  });
}));

export default router;
