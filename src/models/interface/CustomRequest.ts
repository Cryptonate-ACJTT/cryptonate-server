import { Request } from "express";

interface CustomRequest extends Request {
  username: string;
  role: string;
}

export default CustomRequest;
