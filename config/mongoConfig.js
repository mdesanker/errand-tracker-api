const mongoose = require("mongoose");

const mongoDB = process.env.MONGODB_URI || process.env.DEV_DB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected...");
  } catch (err) {
    console.error(err.message);
  }
};

module.exports = connectDB;
