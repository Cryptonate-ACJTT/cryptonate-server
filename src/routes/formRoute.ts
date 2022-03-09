import { Router } from "express";
import * as FormController from "../controller/FormController";

/**
 * This route contains...
 * - user auth routes
 * - user CRUD routes
 * - user: Donor, Organization, Admin
 *
 * @author Aisen Kim ^-^
 */

const router = Router();

router.post("/", FormController.submitForm);

export { router as FormRouter };
