import { Router } from "express";
import * as ProjectController from "../controller/ProjectController";
import multer from "multer";
import {verify} from "../middleware/auth";

const upload = multer({ dest: "uploads" });
const router = Router();

router.post("/", ProjectController.getProject);
router.post("/create", verify, upload.single("image"), ProjectController.createProject);
router.get("/frontpage", ProjectController.getFrontPageStats);
router.get("/explore", ProjectController.getAllProjects);
router.get("/explore/search", ProjectController.getProjectsBySearch);
router.post("/delete", verify, ProjectController.deleteProject);

export { router as ProjectRouter };

//
