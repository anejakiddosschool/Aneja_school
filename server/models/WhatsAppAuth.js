const mongoose = require("mongoose");

const WhatsAppAuthSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Auth key ka naam (eg. 'creds')
  data: { type: String, required: true } // JSON format me auth ka data
});

module.exports = mongoose.model("WhatsAppAuth", WhatsAppAuthSchema);
