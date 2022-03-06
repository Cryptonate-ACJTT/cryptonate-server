import { Router } from "express";
import * as SampleController from "../controller/sampleController";

const router = Router();

router.get("/:username", SampleController.sampleGet);

router.post("/", SampleController.samplePost);

export { router as SampleRouter };
