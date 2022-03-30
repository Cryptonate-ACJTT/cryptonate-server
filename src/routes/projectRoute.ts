import {Router} from "express";
import * as ProjectController from "../controller/ProjectController"
import multer from "multer";


const upload = multer({ dest: "uploads" });
const router = Router();

router.post("/", ProjectController.getProject);
router.post("/create", upload.single("image"), ProjectController.createProject);

export {router as ProjectRouter};

//