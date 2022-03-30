"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// ROUTE IMPORTS
const userRoute_1 = require("../routes/userRoute");
const imageRouter_1 = require("../routes/imageRouter");
const projectRoute_1 = require("../routes/projectRoute");
function createServer() {
    // INIT CONFIG - port numbers and etc...
    const app = (0, express_1.default)();
    // INIT SETUP
    app.use(express_1.default.json());
    app.use((0, express_1.urlencoded)({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, cors_1.default)({
        origin: [
            "http://localhost:3000",
            "http://aisencode.com:7000",
            "http://aisencode.com:3000",
        ],
        credentials: true,
    }));
    // ROUTES
    app.use("/api/v1/user", userRoute_1.UserRouter);
    app.use("/api/v1/images", imageRouter_1.ImageRouter);
    app.use("/api/v1/project", projectRoute_1.ProjectRouter);
    // RETURN THE APP TO BE USED FOR TESTING AND app.ts
    return app;
}
exports.default = createServer;
