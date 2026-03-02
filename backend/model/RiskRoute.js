const router = require("express").Router();
const { getRiskProfile } = require("./RiskController");
const { userVerification } = require("../middlewares/AuthMiddleware");

router.get("/profile", userVerification, getRiskProfile);

module.exports = router;
