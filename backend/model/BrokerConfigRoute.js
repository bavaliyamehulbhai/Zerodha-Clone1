const router = require("express").Router();
const {
  getConfigs,
  updateConfig,
  resetConfigs,
} = require("./BrokerConfigController");
const { userVerification } = require("../middlewares/AuthMiddleware");

// Admin only routes
router.get("/configs", userVerification, getConfigs);
router.post("/configs", userVerification, updateConfig);
router.post("/configs/reset", userVerification, resetConfigs);

module.exports = router;
