"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbconfig_1 = require("./db/dbconfig");
const server_1 = __importDefault(require("./util/server"));
const app = (0, server_1.default)();
const PORT = 4000; // Type assert to string
// DB SETUP
const db = dbconfig_1.connection;
db.on("error", console.error.bind(console, "MONGODB CONNECTION ERROR"));
app.listen(PORT, () => {
    console.log("CONNECTED ON PORT: ", PORT);
});
