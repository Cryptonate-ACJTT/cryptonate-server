import { Request, Response } from "express";
import { UserModel, User } from "../models/SampleUser";

export async function sampleGet(req: Request, res: Response) {
  const { username } = req.params;
  if (!username)
    return res.status(404).json({ status: "ERROR", msg: "username not found" });
  const user = await UserModel.findOne({ username: username });
  console.log(user);
  if (!user)
    return res
      .status(404)
      .json({ status: "ERROR", msg: `User not found by the id: ${username}` });
  res.status(200).json({ user });
}

export async function samplePost(req: Request, res: Response) {
  const requestUser: User = req.body;
  const user = new UserModel({
    username: requestUser.username,
    password: requestUser.password,
    email: requestUser.email,
  });
  await user.save();
  res.json({ status: "OK", id: user._id });
}
