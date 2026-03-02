const { APIKeyModel, APIUsageModel } = require("../model/APISchemas");

const authenticateAPI = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ message: "API Key missing" });
  }

  try {
    const keyDoc = await APIKeyModel.findOne({ key: apiKey });
    if (!keyDoc || !keyDoc.isActive) {
      return res.status(403).json({ message: "Invalid or inactive API Key" });
    }

    // IP Whitelist Check
    const clientIP =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    if (
      keyDoc.ipWhitelist.length > 0 &&
      !keyDoc.ipWhitelist.includes(clientIP)
    ) {
      return res.status(403).json({ message: "IP not authorized" });
    }

    req.apiKey = keyDoc;
    next();
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const rateLimiter = async (req, res, next) => {
  if (!req.apiKey) return next(); // Should be preceded by authenticateAPI

  const oneMinuteAgo = new Date(Date.now() - 60000);

  try {
    const count = await APIUsageModel.countDocuments({
      apiKeyId: req.apiKey._id,
      timestamp: { $gte: oneMinuteAgo },
    });

    if (count >= req.apiKey.rateLimit) {
      return res.status(429).json({ message: "Rate limit exceeded" });
    }
    next();
  } catch (err) {
    next();
  }
};

const logAPIUsage = async (req, res, next) => {
  // Hook into response finish to log status code
  res.on("finish", async () => {
    if (req.apiKey) {
      try {
        await APIUsageModel.create({
          apiKeyId: req.apiKey._id,
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          ip: req.ip || req.headers["x-forwarded-for"],
        });
      } catch (err) {
        console.error("Logging failed", err);
      }
    }
  });

  next();
};

module.exports = { authenticateAPI, rateLimiter, logAPIUsage };
