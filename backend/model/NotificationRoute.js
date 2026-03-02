const router = require("express").Router();
const { triggerNotification, getUserNotifications, deleteNotification, deleteAllNotifications } = require("./NotificationController");
const { userVerification } = require("../middlewares/AuthMiddleware");

router.post("/notify", userVerification, triggerNotification); // Admin/Internal use
router.get("/notifications", userVerification, getUserNotifications);
router.delete("/notifications/:id", userVerification, deleteNotification);
router.delete("/notifications", userVerification, deleteAllNotifications);

module.exports = router;