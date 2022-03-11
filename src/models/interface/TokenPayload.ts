import { JwtPayload } from "jsonwebtoken";

interface TokenPayload extends JwtPayload {
  exp: number;
  accessTypes: string[];
  name: string;
  username: string;
  role: string;
}

export default TokenPayload;
