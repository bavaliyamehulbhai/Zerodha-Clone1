const {
  newOrder,
  getOrders,
  cancelOrder,
  getHoldings,
  getPositions,
  modifyOrder,
} = require("./OrdersController");
const { userVerification } = require("../middlewares/AuthMiddleware");
const router = require("express").Router();

router.post("/newOrder", userVerification, newOrder);
router.get("/allOrders", userVerification, getOrders);
router.get("/holdings", userVerification, getHoldings);
router.get("/allHoldings", userVerification, getHoldings); // Secure alias
router.get("/positions", userVerification, getPositions);
router.get("/allPositions", userVerification, getPositions); // Secure alias
router.put("/modifyOrder/:id", userVerification, modifyOrder);
router.delete("/cancelOrder/:id", userVerification, cancelOrder);

module.exports = router;
