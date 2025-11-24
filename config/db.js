const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

async function connectDB() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error("DATABASE_URL missing in .env");
    process.exit(1);
  }
  mongoose
    .connect(uri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}

module.exports = connectDB;