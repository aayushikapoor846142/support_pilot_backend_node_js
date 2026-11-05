import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

const priorities = ["Low", "Medium", "High", "Urgent"];
const statuses = ["Open", "In review", "Pending", "Resolved", "Closed"];
const ticketView = [
  { path: "customer", select: "name email company" },
  { path: "product", select: "name" },
];

function invalidId(id) {
  return !mongoose.isValidObjectId(id);
}

function isStaff(req) {
  return ["admin", "agent"].includes(req.auth?.role);
}

async function getCustomerForUser(req) {
  const user = await User.findById(req.auth.sub).select("name email");
  if (!user) return null;
  return Customer.findOneAndUpdate(
    { email: user.email },
    { $setOnInsert: { name: user.name, email: user.email } },
    { new: true, upsert: true, runValidators: true }
  );
}

export async function getTickets(req, res) {
  try {
    const filter = {};
    if (!isStaff(req)) {
      const customer = await getCustomerForUser(req);
      if (!customer) return res.status(401).json({ success: false, message: "User account not found" });
      filter.customer = customer._id;
    }
    if (req.query.status) {
      if (!statuses.includes(req.query.status)) {
        return res.status(400).json({ success: false, message: "Invalid ticket status" });
      }
      filter.status = req.query.status;
    }
    const query = String(req.query.q || "").trim();
    if (query) filter.$text = { $search: query };
    const tickets = await Ticket.find(filter).populate(ticketView).sort({ updatedAt: -1 });
    return res.json({ success: true, data: tickets });
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch tickets" });
  }
}

export async function getTicketById(req, res) {
  if (invalidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ticket ID" });
  }
  try {
    const ticket = await Ticket.findById(req.params.id).populate(ticketView);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    if (!isStaff(req)) {
      const customer = await getCustomerForUser(req);
      if (!customer || String(ticket.customer?._id) !== String(customer._id)) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }
    }
    return res.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch ticket" });
  }
}

export async function createTicket(req, res) {
  const { title, description = "", product = null, priority = "Medium" } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ success: false, message: "Ticket title is required" });
  }
  if (!priorities.includes(priority)) {
    return res.status(400).json({ success: false, message: "Invalid ticket priority" });
  }
  if (product && !mongoose.isValidObjectId(product)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }
  if (product && !(await Product.exists({ _id: product }))) {
    return res.status(400).json({ success: false, message: "Selected product was not found" });
  }

  let customerId;
  if (isStaff(req)) {
    customerId = req.body.customer;
    if (!mongoose.isValidObjectId(customerId) || !(await Customer.exists({ _id: customerId }))) {
      return res.status(400).json({ success: false, message: "Select a valid customer" });
    }
  } else {
    const customer = await getCustomerForUser(req);
    if (!customer) return res.status(401).json({ success: false, message: "User account not found" });
    customerId = customer._id;
  }

  try {
    const ticket = await Ticket.create({
      title: title.trim(),
      description: String(description).trim(),
      customer: customerId,
      product,
      priority,
      ...(isStaff(req) && req.body.assignedTo !== undefined
        ? { assignedTo: String(req.body.assignedTo).trim() }
        : {}),
    });
    await ticket.populate(ticketView);
    return res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Failed to create ticket:", error);
    return res.status(500).json({ success: false, message: "Failed to create ticket" });
  }
}

export async function updateTicket(req, res) {
  if (!isStaff(req)) {
    return res.status(403).json({ success: false, message: "Only support staff can update tickets" });
  }
  if (invalidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ticket ID" });
  }

  const updates = {};
  const { title, description, customer, product, priority, status, assignedTo } = req.body ?? {};
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "Ticket title cannot be empty" });
    }
    updates.title = title.trim();
  }
  if (description !== undefined) updates.description = String(description).trim();
  if (customer !== undefined) {
    if (!mongoose.isValidObjectId(customer) || !(await Customer.exists({ _id: customer }))) {
      return res.status(400).json({ success: false, message: "Select a valid customer" });
    }
    updates.customer = customer;
  }
  if (product !== undefined) {
    if (product !== null && (!mongoose.isValidObjectId(product) || !(await Product.exists({ _id: product })))) {
      return res.status(400).json({ success: false, message: "Select a valid product" });
    }
    updates.product = product || null;
  }
  if (priority !== undefined) {
    if (!priorities.includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid ticket priority" });
    }
    updates.priority = priority;
  }
  if (status !== undefined) {
    if (!statuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid ticket status" });
    }
    updates.status = status;
    if (status === "Resolved" && !req.body.resolvedAt) updates.resolvedAt = new Date();
    if (status !== "Resolved") updates.resolvedAt = null;
  }
  if (assignedTo !== undefined) updates.assignedTo = String(assignedTo).trim();
  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, message: "Provide ticket details to update" });
  }

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate(ticketView);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    return res.json({ success: true, data: ticket });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Failed to update ticket:", error);
    return res.status(500).json({ success: false, message: "Failed to update ticket" });
  }
}

export async function deleteTicket(req, res) {
  if (!isStaff(req)) {
    return res.status(403).json({ success: false, message: "Only support staff can delete tickets" });
  }
  if (invalidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ticket ID" });
  }
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    return res.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Failed to delete ticket:", error);
    return res.status(500).json({ success: false, message: "Failed to delete ticket" });
  }
}
