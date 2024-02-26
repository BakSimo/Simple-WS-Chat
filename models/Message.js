const { Schema, model } = require("mongoose");

const Message = new Schema({
  to: { type: String, required: true },
  sender: { type: String, required: true },
  message: { type: String, required: true },
});

module.exports = model("Message", Message);