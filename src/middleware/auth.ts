import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/interface/User";
import ENV from "../util/env";

interface TokenPayload extends JwtPayload {
  exp: number;
  accessTypes: string[];
  name: string;
  userId: string;
  role: string;
}

interface CustomRequest extends Request {
  userId: string;
  role: string;
}

const verify = (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        loggedIn: false,
        user: null,
        errorMessage: "Unauthorized",
      });
    }

    // const verified = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;
    req.userId = verified.userId;

    next();
  } catch (err) {
    console.error("verify error in catch block: ", err);
    return res.status(401).json({
      errorMessage: "Unauthorized",
    });
  }
  return 0;
};

const signToken = (user: User) => {
  return jwt.sign(
    {
      userId: user.id,
    },
    ENV.JWT_SECRET
  );
};

export { verify, signToken };
