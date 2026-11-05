import mongoose from "mongoose";
import Product from "../models/Product.js";
import Ticket from "../models/Ticket.js";

export async function getProducts(req, res) {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
}

export async function createProduct(req, res) {
    try {
        const { name, price } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product name cannot be empty",
            });
        }

        if (
            price === "" ||
            price === null ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Price must be a positive number",
            });
        }

        const product = await Product.create({
            name: name.trim(),
            price: Number(price),
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    } catch (error) {
        if (error?.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create product",
        });
    }
}

export async function getProductById(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
        });
    }
}

export async function updateProduct(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const { name, price } = req.body;
        const updates = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Product name cannot be empty",
                });
            }

            updates.name = name.trim();
        }

        if (price !== undefined) {
            if (
                price === "" ||
                price === null ||
                !Number.isFinite(Number(price)) ||
                Number(price) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Price must be a positive number",
                });
            }

            updates.price = Number(price);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide a name or price to update",
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update product",
        });
    }
}

export async function deleteProduct(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const hasTickets = await Ticket.exists({ product: req.params.id });
        if (hasTickets) {
            return res.status(409).json({
                success: false,
                message: "This product is used by tickets and cannot be deleted",
            });
        }

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: product,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete product",
        });
    }
}
