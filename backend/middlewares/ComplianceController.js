const { ComplianceLogModel } = require("../model/ComplianceSchema");

module.exports.getAuditLogs = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      actorId,
      action,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (actorId) query.actorId = actorId;
    if (action) query.action = { $regex: action, $options: "i" };

    const logs = await ComplianceLogModel.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ComplianceLogModel.countDocuments(query);

    res.json({ success: true, logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const logs = await ComplianceLogModel.find(query)
      .sort({ timestamp: -1 })
      .lean();

    // Simple CSV generation
    const headers = [
      "Timestamp",
      "ActorID",
      "Type",
      "Action",
      "TargetID",
      "Status",
      "IP",
    ];
    const rows = logs.map((log) =>
      [
        log.timestamp.toISOString(),
        log.actorId,
        log.actorType,
        log.action,
        log.targetId || "N/A",
        log.status,
        log.ipAddress || "N/A",
      ].join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment(`audit_logs_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
