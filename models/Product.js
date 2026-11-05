
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0.01,
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
