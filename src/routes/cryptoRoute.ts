import { Router } from "express";
import * as CryptoController from "../controller/CryptoController";
import { verify } from "../middleware/auth";

const router = Router();

router.post("/newWallet", verify, CryptoController.createNewWallet);

export {router as CryptoRouter};