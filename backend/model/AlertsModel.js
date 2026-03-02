const { model } = require("mongoose");
const { AlertsSchema } = require("../schemas/AlertsSchema");

const AlertsModel = model("alert", AlertsSchema);

module.exports = { AlertsModel };