const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ErrandSchema = new Schema({});

module.exports = mongoose.model("Errand", ErrandSchema);
