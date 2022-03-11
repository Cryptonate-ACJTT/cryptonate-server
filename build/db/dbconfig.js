"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * --------------
 * |INSTRUCTIONS|
 * --------------
 * For development inside docker machine - Uncomment 1 and comment out code below 2
 * For development using local mongo - Uncomment 2 and comment out code below 1
 */
// ------------------------ CHOICE ----------------------------
// 1. FOR DOCKER DEVELOPMENT
// mongoose.connect("mongodb://mongodb:27017/cryptonate").catch((e) => {
//   console.error("Connection Fail", e.message);
// });
// 2. FOR LOCAL DEVELOPMENT WITHOUT USING DOCKER
mongoose_1.default.connect("mongodb://127.0.0.1:27017/cryptonate").catch((e) => {
    console.error("Connection Fail", e.message);
});
// ------------------------ CHOICE END ----------------------------
const connection = mongoose_1.default.connection;
exports.connection = connection;
