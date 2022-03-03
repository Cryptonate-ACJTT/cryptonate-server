import express, { Application, Request, Response } from "express";

const app: Application = express();
const PORT: number = 4000;

app.get("/", (req: Request, res: Response) => {
  res.send("CRYPTONATE SETUP COMPLETE");
});

app.listen(PORT, () => {
  console.log("CONNECTED ON PORT: ", PORT);
});
