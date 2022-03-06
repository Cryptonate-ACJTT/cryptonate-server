import { Router } from "express";
import * as UserController from "../controller/UserController";

/**
 * This route contains...
 * - user auth routes
 * - user CRUD routes
 * - user: Donor, Organization, Admin
 *
 * @author Aisen Kim ^-^
 */

const router = Router();

router.post("/", UserController.addUser);

export { router as UserRouter };
