import express from "express";
import { protect }     from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import {
  getFinanceDashboard,
  getFinancePayments,
  getFinanceOrderDetail,
  financeVerifyPayment,
  markRefund,
  getFinanceStats,
  getFinancePayouts,
  approveFinancePayout,
  getFinanceReport,
} from "../controllers/financeController.js";

const router     = express.Router();
const financeOnly = [protect, requireRole("finance", "owner")];

router.get(   "/dashboard",                       ...financeOnly, getFinanceDashboard);
router.get(   "/report",                          ...financeOnly, getFinanceReport);
router.get(   "/payments",                        ...financeOnly, getFinancePayments);
router.get(   "/stats",                           ...financeOnly, getFinanceStats);
router.get(   "/payouts",                         ...financeOnly, getFinancePayouts);
router.patch( "/payouts/:id/approve",             ...financeOnly, validateObjectId("id"), approveFinancePayout);
router.put(   "/payouts/:id/status",              ...financeOnly, validateObjectId("id"), approveFinancePayout);
router.get(   "/payments/:orderId",               ...financeOnly, validateObjectId("orderId"), getFinanceOrderDetail);
router.put(   "/payments/:orderId/verify",        ...financeOnly, validateObjectId("orderId"), financeVerifyPayment);
router.patch( "/payments/:orderId/refund",        ...financeOnly, validateObjectId("orderId"), markRefund);

export default router;
