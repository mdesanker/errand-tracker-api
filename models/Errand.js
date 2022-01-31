const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ErrandSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date },
  priority: {
    type: String,
    enum: ["None", "Low", "Medium", "High"],
    default: "None",
  },
  project: { type: Schema.Types.ObjectId, ref: "Project", default: null },
  isComplete: { type: Boolean, default: false },
});

module.exports = mongoose.model("Errand", ErrandSchema);
