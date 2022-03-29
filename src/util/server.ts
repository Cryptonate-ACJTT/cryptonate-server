import express, {
    Express,
    urlencoded,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// ROUTE IMPORTS
import {UserRouter} from "../routes/userRoute";
import {ImageRouter} from "../routes/imageRouter";

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
            ],
            credentials: true,
        })
    );

    // ROUTES
    app.use("/api/v1/user", UserRouter);
    app.use("/api/v1/images", ImageRouter);

    // RETURN THE APP TO BE USED FOR TESTING AND app.ts
    return app;
}

export default createServer;
