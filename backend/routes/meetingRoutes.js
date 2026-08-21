import express from "express";
import { protect }     from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import {
  getMeetings,
  getSchedule,
  getMeetingById,
  createMeeting,
  updateMeeting,
  cancelMeeting,
  deleteMeeting,
  getStaffUsers,
} from "../controllers/meetingController.js";

const router = express.Router();
router.use(protect);

// Staff roles that can view meetings
const staffAccess  = requireRole("owner", "admin", "finance", "seller");
const ownerOnly    = requireRole("owner");

router.get(   "/staff-users",      ownerOnly,   getStaffUsers);
router.get(   "/schedule",         staffAccess, getSchedule);
router.get(   "/",                 staffAccess, getMeetings);
router.get(   "/:id",              staffAccess, validateObjectId(), getMeetingById);
router.post(  "/",                 ownerOnly,   createMeeting);
router.put(   "/:id",              ownerOnly,   validateObjectId(), updateMeeting);
router.patch( "/:id/cancel",       ownerOnly,   validateObjectId(), cancelMeeting);
router.delete("/:id",              ownerOnly,   validateObjectId(), deleteMeeting);

export default router;
