import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Ticket from "../models/Ticket.js";

const emailPattern = /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/;

function invalidId(id) {
  return !mongoose.isValidObjectId(id);
}

export async function getCustomers(req, res) {
  try {
    const query = String(req.query.q || "").trim();
    const filter = query
      ? { $text: { $search: query } }
      : {};
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: customers });
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customers" });
  }
}

export async function getCustomerById(req, res) {
  if (invalidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid customer ID" });
  }
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    return res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customer" });
  }
}

export async function createCustomer(req, res) {
  const { name, email, phone = "", company = "", status = "Active" } = req.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Customer name is required" });
  }
  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: "A valid customer email is required" });
  }
  if (!["Active", "Inactive"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be Active or Inactive" });
  }

  try {
    const customer = await Customer.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      company: String(company).trim(),
      status,
    });
    return res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "A customer with that email already exists" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Failed to create customer:", error);
    return res.status(500).json({ success: false, message: "Failed to create customer" });
  }
}

export async function updateCustomer(req, res) {
  if (invalidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid customer ID" });
  }

  const updates = {};
  const { name, email, phone, company, status } = req.body ?? {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Customer name cannot be empty" });
    }
    updates.name = name.trim();
  }
  if (email !== undefined) {
    if (typeof email !== "string" || !emailPattern.test(email.trim().toLowerCase())) {
      return res.status(400).json({ success: false, message: "A valid customer email is required" });
    }
    updates.email = email.trim().toLowerCase();
  }
  if (phone !== undefined) updates.phone = String(phone).trim();
  if (company !== undefined) updates.company = String(company).trim();
  if (status !== undefined) {
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be Active or Inactive" });
    }
    updates.status = status;
  }
  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, message: "Provide customer details to update" });
  }

  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    return res.json({ success: true, data: customer });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "A customer with that email already exists" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Failed to update customer:", error);
    return res.status(500).json({ success: false, message: "Failed to update customer" });
  }
}

export async function deleteCustomer(req, res) {
  if (invalidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid customer ID" });
  }

  try {
    const hasTickets = await Ticket.exists({ customer: req.params.id });
    if (hasTickets) {
      return res.status(409).json({
        success: false,
        message: "This customer has tickets and cannot be deleted",
      });
    }
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    return res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return res.status(500).json({ success: false, message: "Failed to delete customer" });
  }
}
