import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/interface/User";
import ENV from "../util/env";
import TokenPayload from "../models/interface/TokenPayload";

/**
 * @brief If verified returns true, else false (or returns error message)
 */
const verify = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    console.log(req.cookies);
    if (!token) {
      return res.status(401).json({
        loggedIn: false,
        user: null,
        errorMessage: "Unauthorized",
      });
      // ************************
      // console.log("No token is provided");
      // return false;
    }

    // const verified = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;
    req.username = verified.username;

    next();
    // ************************
    // return true;
  } catch (err) {
    console.error("verify error in catch block: ", err);
    return res.status(401).json({
      errorMessage: "Unauthorized",
    });
    // ************************
    // return false;
  }
};

const signToken = (user: User) => {
  return jwt.sign(
    {
      username: user.username,
    },
    ENV.JWT_SECRET
  );
};

export { verify, signToken };
