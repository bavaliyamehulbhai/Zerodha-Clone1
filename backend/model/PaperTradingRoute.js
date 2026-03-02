const router = require("express").Router();
const {
  getPaperProfile,
  placePaperOrder,
  resetPortfolio,
  getLeaderboard,
} = require("./PaperTradingController");
const { userVerification } = require("../middlewares/AuthMiddleware");

router.get("/profile", userVerification, getPaperProfile);
router.post("/order", userVerification, placePaperOrder);
router.post("/reset", userVerification, resetPortfolio);
router.get("/leaderboard", userVerification, getLeaderboard);

module.exports = router;
