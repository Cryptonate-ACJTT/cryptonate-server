/**
 * This interface is used for supporting types
 * @author Aisen Kim
 */

import mongoose from "mongoose";

interface User extends mongoose.Document {
  id: string;
  username: string;
  password: string;
  email: string;
  role: string;
  wallet: string;
  projects: object;
}

export default User;
