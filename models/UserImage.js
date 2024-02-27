const { Schema, model } = require("mongoose");

const UserImage = new Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  imageBase64: { type: String, required: true },
});

module.exports = model("Image", UserImage);
