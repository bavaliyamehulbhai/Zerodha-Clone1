const router = require("express").Router();
const { getMarketStatus, updateSettings } = require("./MarketDataController");
const { userVerification } = require("../middlewares/AuthMiddleware");

// Admin only routes
router.get("/status", userVerification, getMarketStatus);
router.post("/settings", userVerification, updateSettings);

module.exports = router;
