"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
mongoose_1.default
    .connect("mongodb://localhost:27017/cryptonate")
    .catch(e => {
    console.error("Connection Fail", e.message);
});
const connection = mongoose_1.default.connection;
exports.connection = connection;
// module.exports = mongoose.connection
