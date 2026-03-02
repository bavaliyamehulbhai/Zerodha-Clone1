const { Schema } = require("mongoose");

const AlertsSchema = new Schema({
  title: String,
  message: String,
  type: { type: String, default: "info" }, // info, warning, error
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = { AlertsSchema };