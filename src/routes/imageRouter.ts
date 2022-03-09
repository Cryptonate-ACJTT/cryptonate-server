import { Router } from "express";
import * as ImageController from "../controller/ImageController";
import multer from "multer";
/**
 * This route contains...
 * functionality for saving image to s3
 *
 * @author Aisen Kim ^-^
 */

// multer image route
const upload = multer({ dest: "uploads" });

const router = Router();

router.get("/:key", ImageController.getSingleImage);
router.post("/", upload.single("image"), ImageController.uploadSingleImage);

export { router as ImageRouter };
