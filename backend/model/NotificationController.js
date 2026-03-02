const NotificationService = require("./NotificationService");
const { NotificationModel } = require("./NotificationSchema");

module.exports.triggerNotification = async (req, res) => {
  try {
    // Expected payload: { userId, title, message, type, channels }
    await NotificationService.send(req.body);
    res.json({ success: true, message: "Notification queued" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      $or: [{ userId: req.user._id }, { userId: "ALL" }],
    })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.markRead = async (req, res) => {
  // Implementation for marking read
};

module.exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    // Only allow deleting if it belongs to the user or is a broadcast (optional policy)
    const notification = await NotificationModel.findOne({ _id: id });
    if (!notification) return res.status(404).json({ success: false, message: "Not found" });
    
    await NotificationModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.deleteAllNotifications = async (req, res) => {
  try {
    await NotificationModel.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
