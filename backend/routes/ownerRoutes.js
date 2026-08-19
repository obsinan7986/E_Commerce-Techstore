import express from "express";
import { protect }     from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  ownerGetAllUsers,
  ownerCreateUser,
  ownerChangeRole,
  ownerSuspendUser,
  ownerActivateUser,
  ownerGetPendingKYC,
  ownerApproveKYC,
  ownerRejectKYC,
  ownerGetUser,
} from "../controllers/ownerController.js";

const router   = express.Router();
const ownerOnly = [protect, requireRole("owner")];

// User management
router.get(   "/users",              ...ownerOnly, ownerGetAllUsers);
router.post(  "/users",              ...ownerOnly, ownerCreateUser);
router.get(   "/users/:id",          ...ownerOnly, ownerGetUser);
router.put(   "/users/:id/role",     ...ownerOnly, ownerChangeRole);
router.patch( "/users/:id/suspend",  ...ownerOnly, ownerSuspendUser);
router.patch( "/users/:id/activate", ...ownerOnly, ownerActivateUser);

// KYC management
router.get(   "/kyc",               ...ownerOnly, ownerGetPendingKYC);
router.patch( "/kyc/:id/approve",   ...ownerOnly, ownerApproveKYC);
router.patch( "/kyc/:id/reject",    ...ownerOnly, ownerRejectKYC);

export default router;
