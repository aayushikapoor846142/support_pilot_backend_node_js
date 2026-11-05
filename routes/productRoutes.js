import { Router } from "express";
import {
    createProduct,
    deleteProduct,
    getProductById,
    getProducts,
    updateProduct,
} from "../controllers/ProductController.js";
import { authenticateToken, authorizeRoles } from "../auth.js";

const router = Router();

router.use("/products", authenticateToken);
router.get("/products", getProducts);
router.post("/products", authorizeRoles("admin", "agent"), createProduct);
router.get("/products/:id", getProductById);
router.put("/products/:id", authorizeRoles("admin", "agent"), updateProduct);
router.delete("/products/:id", authorizeRoles("admin", "agent"), deleteProduct);

export default router;