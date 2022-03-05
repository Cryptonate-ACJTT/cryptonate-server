import express, { Express, urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// ROUTE IMPORTS
import { SampleRouter } from "../routes/sampleRoute";

function createServer() {
  // INIT CONFIG - port numbers and etc...
  const app: Express = express();

  // INIT SETUP
  app.use(express.json());
  app.use(urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: true,
    })
  );

  // ROUTES
  app.use("/api/v1/sample", SampleRouter);

  // RETURN THE APP TO BE USED FOR TESTING AND app.ts
  return app;
}

export default createServer;
