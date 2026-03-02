const { model } = require("mongoose");
const { SettingsSchema } = require("../schemas/SettingsSchema");

const SettingsModel = model("settings", SettingsSchema);

module.exports = { SettingsModel };