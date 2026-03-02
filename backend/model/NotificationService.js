const nodemailer = require("nodemailer");
const { NotificationModel } = require("../model/NotificationSchema");
const { UserModel } = require("../model/UserModel");
const MarketDataService = require("../model/MarketDataService"); // Used as Event Bus for WS

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class NotificationService {
  async send(payload) {
    const { userId, title, message, type, channels } = payload;

    // 1. Save to DB (In-App History)
    if (channels.includes("IN_APP")) {
      await NotificationModel.create({
        userId,
        title,
        message,
        type,
        channels,
      });
    }

    // Fetch User details if specific user
    let user = null;
    if (userId !== "ALL") {
      user = await UserModel.findById(userId);
    }

    // 2. Email Channel
    if (channels.includes("EMAIL") && user && user.email) {
      this.sendEmail(user.email, title, message);
    }

    // 3. SMS Channel (Mock)
    if (channels.includes("SMS") && user && user.mobile) {
      console.log(`[SMS] To ${user.mobile}: ${message}`);
    }

    // 4. WebSocket Channel
    if (channels.includes("WEBSOCKET")) {
      // Emit event that the WebSocket server listens to
      MarketDataService.emit("notification", { userId, data: { title, message, type } });
    }
  }

  async sendEmail(to, subject, text) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
      });
    } catch (err) {
      console.error("[Notification] Email failed:", err.message);
    }
  }
}

module.exports = new NotificationService();