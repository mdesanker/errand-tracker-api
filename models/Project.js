const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({});

module.exports = mongoose.model("Project", ProjectSchema);
