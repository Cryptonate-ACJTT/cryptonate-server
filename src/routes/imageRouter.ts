import {Router} from "express";
import * as ImageController from "../controller/ImageController";
import multer from "multer";
import {verify} from "../middleware/auth";

/**
 * This route contains...
 * functionality for saving image to s3
 *
 * @author Aisen Kim ^-^
 */

// multer image route
const upload = multer({dest: "uploads"});

const router = Router();

router.get("/:key", ImageController.getSingleImage);
router.post("/", verify, upload.single("image"), ImageController.uploadSingleImage);

export {router as ImageRouter};
