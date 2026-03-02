const router = require("express").Router();
const {
  freezeAccount,
  getAlerts,
  getAuditLogs,
} = require("../controllers/SurveillanceController");
const { userVerification } = require("../middlewares/AuthMiddleware");

// Admin only routes (Assuming middleware checks role)
router.post("/freeze", userVerification, freezeAccount);
router.get("/alerts", userVerification, getAlerts);
router.get("/audit-logs", userVerification, getAuditLogs);

module.exports = router;
