import express from "express";
import { protect }     from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
} from "../controllers/announcementController.js";

const router = express.Router();
router.use(protect);

const staffAccess = requireRole("owner", "admin", "finance", "seller");
const ownerOnly   = requireRole("owner");

router.get(   "/",          staffAccess, getAnnouncements);
router.get(   "/:id",       staffAccess, validateObjectId(), getAnnouncementById);
router.post(  "/",          ownerOnly,   createAnnouncement);
router.put(   "/:id",       ownerOnly,   validateObjectId(), updateAnnouncement);
router.delete("/:id",       ownerOnly,   validateObjectId(), deleteAnnouncement);
router.patch( "/:id/read",  staffAccess, validateObjectId(), markAnnouncementRead);

export default router;
