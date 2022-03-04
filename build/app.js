"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dbconfig_1 = require("./db/dbconfig");
// ROUTE IMPORTS
const sampleRoute_1 = require("./routes/sampleRoute");
// INIT CONFIG - port numbers and etc...
const app = (0, express_1.default)();
const PORT = 4000; // Type assert to string 
const db = dbconfig_1.connection;
db.on('error', console.error.bind(console, 'MONGODB CONNECTION ERROR'));
app.use(express_1.default.json());
// USING DEFINED ROUTES
app.use('/api/v1/sample', sampleRoute_1.SampleRouter);
app.listen(PORT, () => {
    console.log("CONNECTED ON PORT: ", PORT);
});
