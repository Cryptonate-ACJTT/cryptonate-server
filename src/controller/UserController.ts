import { Request, Response } from "express";
import { donorModel } from "../models/Donor";
import { organizationModel } from "../models/Organization";
import * as auth from "../middleware/auth";
import bcrypt from "bcryptjs";
import User from "../models/User";
import ROLE from "../models/Role";
import { adminModel } from "../models/Admin";

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
  await res
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
      msg: "Login faile. Check username or password",
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
          msg: "User login Sucess",
        });
    }
  } catch (err) {
    console.log(`Error occured during bcrypt password comparisson`);
  }

  // AT THIS POINT, RETURN ERROR
  return res.status(404).json({
    status: "ERROR",
    msg: "Login faile. Check username or password",
  });
}

export { addUser, login };
