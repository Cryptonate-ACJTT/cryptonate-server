import { Request, Response } from "express";
import { donorModel } from "../models/DonorModel";
import { organizationModel } from "../models/OrganizationModel";
import * as auth from "../middleware/auth";
import bcrypt from "bcryptjs";
import User from "../models/interface/User";
import ROLE from "../models/Role";
import { adminModel } from "../models/AdminModel";

/**
 * User Registration and assign JWT token
 * @param req - Should contain all info including if it's an organization or not
 * @param res
 * @return 200: return user 404: error
 */
async function addUser(req: Request, res: Response) {
  const { username, password, email, role } = req.body;

  if (!username || !password || !email || !role)
    return res.status(404).json({ status: "ERROR", msg: "Parameter missing" });

  // Check if it's a valid role type
  if (!Object.values(ROLE).includes(role) || role === ROLE.ADMIN) {
    return res.status(404).json({
      status: "ERROR",
      msg: "Undefined Role! If trying to register as admin, Don't",
    });
  }

  // CHECK IF USER ALREADY EXISTS BY THE email
  const existingUser =
    role === ROLE.DONOR
      ? await donorModel.findOne({ email })
      : await organizationModel.findOne({ email });

  if (existingUser)
    return res.status(400).json({
      status: "ERROR",
      msg: `User already exists by the email: ${email}`,
    });

  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const passwordHash = await bcrypt.hash(password, salt);

  let user: User;

  role === ROLE.DONOR
    ? (user = new donorModel({
        username,
        password: passwordHash,
        email,
        role,
      }))
    : (user = new organizationModel({
        username,
        password: passwordHash,
        email,
        role,
      }));

  if (!user)
    return res.status(404).json({ status: "ERROR", msg: "Parameter missing" });

  await user.save();

  // LOGIN THE USER
  const token = auth.signToken(user);

  // RETURN USER WITH PARTIAL DATA
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json({
      status: "OK",
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
}

/**
 * Expect user to provide username, password, role(admin, donor, organization)
 * @param req.body - {username, password, role}
 * @param req
 * @param res
 *
 * @return login user otherwise error response
 */
async function login(req: Request, res: Response) {
  let user: User | null;
  const { username, password, role } = req.body;

  // CHECK IF USER IN THE DATABASE
  try {
    if (role === ROLE.ADMIN) user = await adminModel.findOne({ username });
    else if (role === ROLE.DONOR) user = await donorModel.findOne({ username });
    else user = await organizationModel.findOne({ username });
  } catch (err) {
    console.log(`Error occured finding user: ${username}`);
    return res.status(404).json({
      status: "ERROR",
      msg: "Login failed. Check username or password",
    });
  }

  // COMPARE THE PASSWORD
  try {
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = auth.signToken(user);
      return res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .status(200)
        .json({
          status: "OK",
          user: {
            username: user.username,
            email: user.email,
            role: user.role,
          },
          msg: "User login success",
        });
    }
  } catch (err) {
    console.log(`Error occurred during bcrypt password comparison`);
  }

  // AT THIS POINT, RETURN ERROR
  return res.status(404).json({
    status: "ERROR",
    msg: "Login failed. Check username or password",
  });
}

function logout(req: Request, res: Response) {
  try {
    res
      .cookie("token", "", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        status: "OK"
      })
      .send();
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ status: "ERROR", msg: "Error while logging out" });
  }
}

async function getLoggedIn(req: Request, res: Response) {
  const userRole = req.body.role;
  console.log("username: ", req.body.username);
  console.log("role: ", req.body.role);
  const isVerified = auth.verify(req, res);
  if (!isVerified) {
    return res.status(401).json({
      loggedIn: false,
      user: null,
      status: "ERROR",
      msg: "User is not verified",
    });
  }
  try {
    const loggedInUser =
      userRole === ROLE.DONOR
        ? await donorModel.findOne({ username: req.body.username })
        : await organizationModel.findOne({ username: req.body.username });
    return res.status(200).json({
      loggedIn: true,
      user: {
        username: loggedInUser.username,
        email: loggedInUser.email,
        role: loggedInUser.role,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      loggedIn: false,
      user: null,
      status: "ERROR",
      msg: "Error getting user",
    });
  }
}

export { addUser, login, logout, getLoggedIn };
