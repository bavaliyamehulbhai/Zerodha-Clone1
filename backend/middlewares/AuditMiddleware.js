const { ComplianceLogModel } = require("../model/ComplianceSchema");

// Middleware for automatic API logging
const logAudit = (actionName) => async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    res.send = originalSend;
    res.send.apply(res, arguments);

    // Skip logging for GET requests unless critical
    if (req.method === "GET" && !actionName) return;

    const logEntry = {
      actorId: req.user ? req.user._id : "ANONYMOUS",
      actorType: req.user
        ? req.user.role === "admin"
          ? "ADMIN"
          : "USER"
        : "SYSTEM",
      action: actionName || `${req.method} ${req.baseUrl}${req.path}`,
      details: {
        params: req.params,
        query: req.query,
        body: { ...req.body },
        statusCode: res.statusCode,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.headers["user-agent"],
      status: res.statusCode >= 400 ? "FAILURE" : "SUCCESS",
    };

    // Sanitize sensitive fields
    if (logEntry.details.body.password) logEntry.details.body.password = "***";
    if (logEntry.details.body.token) logEntry.details.body.token = "***";

    ComplianceLogModel.create(logEntry).catch((err) =>
      console.error("Audit Log Error:", err),
    );
  };

  next();
};

// Helper for manual business logic logging (e.g., inside controllers)
const logComplianceEvent = async (
  actorId,
  actorType,
  action,
  targetId,
  targetType,
  details,
  req = null,
) => {
  try {
    await ComplianceLogModel.create({
      actorId,
      actorType,
      action,
      targetId,
      targetType,
      details,
      ipAddress: req ? req.ip || req.headers["x-forwarded-for"] : "SYSTEM",
      userAgent: req ? req.headers["user-agent"] : "SYSTEM",
      status: "SUCCESS",
    });
  } catch (e) {
    console.error("Manual Compliance Log Error", e);
  }
};

module.exports = { logAudit, logComplianceEvent };
