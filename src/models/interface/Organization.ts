/**
 * This interface is used for supporting types
 * @author Aisen Kim
 */

import mongoose from "mongoose";
import { Project } from "../ProjectModel";

interface User extends mongoose.Document {
  id: string;
  username: string;
  password: string;
  email: string;
  role: string;
  approved: boolean;
  wallet: {
	id: string;
	accounts: Array<string>;
  };
  projects: Array<Project>
}

export default User;
