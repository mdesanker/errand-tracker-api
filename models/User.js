const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  date: { type: Date, default: Date.now },
  friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("User", UserSchema);
