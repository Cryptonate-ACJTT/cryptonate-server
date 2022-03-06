import { Request, Response } from "express";
import { donorModel } from "../models/Donor";
import { organizationModel } from "../models/Organization";
import * as auth from "../middleware/auth";
import bcrypt from "bcryptjs";
import User from "../models/User";
import ROLE from "../models/Role";

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

export { addUser };
