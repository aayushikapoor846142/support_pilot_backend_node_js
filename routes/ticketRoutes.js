import { Router } from "express";
import {
  createTicket,
  deleteTicket,
  getTicketById,
  getTickets,
  updateTicket,
} from "../controllers/TicketController.js";
import { authenticateToken } from "../auth.js";

const router = Router();

router.use(authenticateToken);
router.get("/", getTickets);
router.post("/", createTicket);
router.get("/:id", getTicketById);
router.patch("/:id", updateTicket);
router.delete("/:id", deleteTicket);

export default router;
