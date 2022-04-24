"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const dbconfig_1 = require("./db/dbconfig");
const crypto_1 = require("./middleware/crypto");
const server_1 = __importDefault(require("./util/server"));
const app = (0, server_1.default)();
const PORT = parseInt(process.env.PORT) || 4000; // Type assert to string
// KEYDAEMON INIG
crypto_1.KeyDaemonClient.getInstance();
// CRYPTO INIT
crypto_1.CryptoClient.getInstance();
// INDEXER INIT
crypto_1.IndexClient.getInstance();
// DB SETUP
dbconfig_1.connection.on("error", console.error.bind(console, "MONGODB CONNECTION ERROR"));
app.listen(PORT, () => {
    console.log("  ______                             __                           __       \n" +
        "  / ____/   _____   __  __    ____   / /_  ____    ____   ____ _  / /_  ___ \n" +
        " / /       / ___/  / / / /   / __ \\ / __/ / __ \\  / __ \\ / __ `/ / __/ / _ \\\n" +
        "/ /___    / /     / /_/ /   / /_/ // /_  / /_/ / / / / // /_/ / / /_  /  __/\n" +
        "\\____/   /_/      \\__, /   / .___/ \\__/  \\____/ /_/ /_/ \\__,_/  \\__/  \\___/ \n" +
        "                 /____/   /_/                                               ");
    console.log("CONNECTED ON PORT: ", PORT);
});
