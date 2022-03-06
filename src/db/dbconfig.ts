import mongoose from "mongoose";

mongoose.connect("mongodb://mongodb:27017/cryptonate").catch((e) => {
  console.error("Connection Fail", e.message);
});

const connection = mongoose.connection;
export { connection };
// module.exports = mongoose.connection
