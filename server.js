
import "dotenv/config";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import swaggerSpec from "./swagger.js";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { login, register, authenticateToken, authorizeRoles } from "./auth.js";
import { pathToFileURL } from "node:url";

export const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SupportPilot API is running",
  });
});

app.post("/api/login", login);
app.post("/api/signin", login);
app.post("/api/register", register);
app.post("/api/signup", register);

app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({ userId: req.auth.sub, role: req.auth.role });
});

app.get("/api/admin-only", authenticateToken, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "Admin access granted" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/welcome", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to SupportPilot API",
  });
});

app.use(errorHandler);

export async function startServer() {
  await connectDB();

  return app.listen(PORT, () => {
    console.log(`SupportPilot backend running at http://localhost:${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer().catch((error) => {
    console.error("Startup failed:", error.message);
    process.exit(1);
  });
}
