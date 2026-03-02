const { model, Schema } = require("mongoose");

const ChatSchema = new Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true }, // Can be a userId or "SUPPORT"
  message: { type: String },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  senderName: String, // Optional: snapshot of username
  attachment: {
    url: String,
    filename: String,
    mimetype: String,
    size: Number,
  },
});

module.exports = { ChatModel: model("chat", ChatSchema) };
