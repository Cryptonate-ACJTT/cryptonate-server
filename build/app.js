"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const util_1 = require("util");
const dbconfig_1 = require("./db/dbconfig");
const crypto_1 = require("./middleware/crypto");
const server_1 = __importDefault(require("./util/server"));
const app = (0, server_1.default)();
const PORT = parseInt(process.env.PORT) || 4000; // Type assert to string
// KEYDAEMON INIG
crypto_1.KeyDaemonClient.getInstance();
// CRYPTO INIT
crypto_1.CryptoClient.getInstance();
// make sure python files are compiled!
let projectPath = "src/contracts/pyTEAL/project.py";
let clearPath = "src/contracts/pyTEAL/default_clear_state.py";
let srcfp = "src/contracts/TEAL/";
let buildfp = "build/contracts/TEAL/";
(() => __awaiter(void 0, void 0, void 0, function* () {
    const exec = (0, util_1.promisify)(require("child_process").exec);
    try {
        yield exec(`python3 ${projectPath} > ${srcfp}project.teal; python3 ${clearPath} > ${srcfp}clear_state.teal; cp ${srcfp}project.teal ${srcfp}clear_state.teal ${buildfp}`);
    }
    catch (err) {
        console.error(err);
    }
}))();
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
