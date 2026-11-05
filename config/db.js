import mongoose from "mongoose";

const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/supportpilot";

async function connectDB() {
    const mongoUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
}

export default connectDB;