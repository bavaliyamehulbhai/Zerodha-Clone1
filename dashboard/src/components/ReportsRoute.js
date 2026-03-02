const router = require("express").Router();
const {
  downloadContractNote,
  getTaxReport,
} = require("../controllers/ReportsController");
const { userVerification } = require("../middlewares/AuthMiddleware");

router.get("/contract-note", userVerification, downloadContractNote);
router.get("/tax-pnl", userVerification, getTaxReport);

module.exports = router;
