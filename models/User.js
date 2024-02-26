const { Schema, model } = require("mongoose");

const User = new Schema({
  image: { type: Schema.Types.ObjectId, ref: "UserImage" },
  email: { type: String, uniquq: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isActivated: { type: Boolean, default: false },
  activationLink: { type: String },
});

module.exports = model("User", User);
