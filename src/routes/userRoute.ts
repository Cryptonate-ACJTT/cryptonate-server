import {Router} from "express";
import * as UserController from "../controller/UserController";
import {verify} from "../middleware/auth";

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
router.post("/login", UserController.login);
router.post("/logout", UserController.logout);
router.post("/loggedIn", verify, UserController.getLoggedIn);
router.post("/orgForm", UserController.submitOrgAuthenticationForm);
router.post("/updateOrgForm", UserController.editOrgAuthenticationForm);

export {router as UserRouter};
