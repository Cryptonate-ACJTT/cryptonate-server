import express, {
    Express,
    urlencoded,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// ROUTE IMPORTS
import {UserRouter} from "../routes/userRoute";
import {ImageRouter} from "../routes/imageRouter";
import {ProjectRouter} from "../routes/projectRoute";
import { CryptoRouter } from "../routes/cryptoRoute";

function createServer() {
    // INIT CONFIG - port numbers and etc...
    const app: Express = express();

    // INIT SETUP
    app.use(express.json());
    app.use(urlencoded({extended: true}));
    app.use(cookieParser());
    app.use(
        cors({
            origin: [
                "http://localhost:3000",
                "http://aisencode.com:7000",
                "http://aisencode.com:3000",
		"http://20.231.205.70",
		"http://20.231.205.70:3000",
		"http://20.231.205.70:4001",
		"http://20.231.205.70:4002",
		"https://cryptonate.eastus.cloudapp.azure.com",
		"https://cryptonate.eastus.cloudapp.azure.com:3000",
		"http://cryptonate.eastus.cloudapp.azure.com:4001",
		"http://cryptonate.eastus.cloudapp.azure.com:4002",
		"http://cryptonate.eastus.cloudapp.azure.com:8980",
            ],
            credentials: true,
        })
    );

    // ROUTES
    app.use("/api/v1/user", UserRouter);
    app.use("/api/v1/images", ImageRouter);
    app.use("/api/v1/project", ProjectRouter);
	app.use("/api/v1/crypto", CryptoRouter)

    // RETURN THE APP TO BE USED FOR TESTING AND app.ts
    return app;
}

export default createServer;
