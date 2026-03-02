const {
  newOrder,
  getOrders,
  deleteOrder,
  getPositions,
  liquidateUser,
} = require("../controllers/OrdersController");
const { userVerification } = require("../middlewares/AuthMiddleware");
const { checkMargin } = require("../controllers/RMSController");
const router = require("express").Router();

router.post("/newOrder", userVerification, checkMargin, newOrder);
router.get("/allOrders", userVerification, getOrders);
router.get("/allPositions", userVerification, getPositions);
router.delete("/deleteOrder/:id", userVerification, deleteOrder);
router.post("/liquidate", userVerification, liquidateUser);

module.exports = router;
