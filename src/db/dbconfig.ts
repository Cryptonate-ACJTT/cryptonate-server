import mongoose from "mongoose";

// FOR DOCKER
mongoose.connect("mongodb://mongodb:27017/cryptonate").catch((e) => {
  console.error("Connection Fail", e.message);
});

// FOR LOCAL DEVELOPMENT WITHOUT USING DOCKER
// mongoose.connect("mongodb://mongodb:27017/cryptonate").catch((e) => {
//   console.error("Connection Fail", e.message);
// });

const connection = mongoose.connection;
export { connection };
