const router = require("express").Router();
const {
  createAPIKey,
  registerPartner,
  getAPIKeys,
  updateKeySettings,
  getUsageAnalytics,
} = require("../controllers/APIController");
const { userVerification } = require("../middlewares/AuthMiddleware");

router.post("/keys/create", userVerification, createAPIKey);
router.get("/keys", userVerification, getAPIKeys);
router.put("/keys/update", userVerification, updateKeySettings);
router.post("/partner/register", userVerification, registerPartner);
router.get("/analytics", userVerification, getUsageAnalytics);

module.exports = router;
