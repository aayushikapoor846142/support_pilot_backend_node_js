import { Router } from "express";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "../controllers/CustomerController.js";
import { authenticateToken, authorizeRoles } from "../auth.js";

const router = Router();

router.use(authenticateToken, authorizeRoles("admin", "agent"));
router.get("/", getCustomers);
router.post("/", createCustomer);
router.get("/:id", getCustomerById);
router.patch("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
