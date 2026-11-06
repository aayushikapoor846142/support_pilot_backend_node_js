import mongoose from "mongoose";

let connectionPromise;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectionPromise) {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI environment variable is required");
        }

        const attempt = mongoose.connect(mongoUri)
            .then(() => {
                console.log("MongoDB connected");
                return mongoose.connection;
            })
            .finally(() => {
                if (connectionPromise === attempt) {
                    connectionPromise = undefined;
                }
            });

        connectionPromise = attempt;
    }

    return connectionPromise;
}

export default connectDB;