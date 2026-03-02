const { Schema } = require("mongoose");

const SettingsSchema = new Schema({
  allowRegistration: {
    type: Boolean,
    default: true,
  },
});

module.exports = { SettingsSchema };