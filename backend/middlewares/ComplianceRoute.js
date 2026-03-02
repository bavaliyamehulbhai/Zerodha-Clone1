const router = require("express").Router();
const {
  getAuditLogs,
  exportAuditLogs,
} = require("../controllers/ComplianceController");
const { userVerification } = require("../middlewares/AuthMiddleware");

// Admin only routes
router.get("/logs", userVerification, getAuditLogs);
router.get("/export", userVerification, exportAuditLogs);

module.exports = router;
