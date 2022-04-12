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
router.post("/orgForm", verify, UserController.getOrgAuthenticationForm);
router.post("/submitOrgForm", verify, UserController.submitOrgAuthenticationForm);
router.post("/updateOrgForm", verify, UserController.editOrgAuthenticationForm);
router.post("/updateUser", verify, UserController.updateUser);

export {router as UserRouter};
