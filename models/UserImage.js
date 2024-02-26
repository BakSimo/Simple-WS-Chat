const { Schema, model } = require("mongoose");

const UserImage = new Schema({
  filename: String,
  contentType: String,
  imageBase64: String,
});

module.exports = model("UserImage", UserImage);
