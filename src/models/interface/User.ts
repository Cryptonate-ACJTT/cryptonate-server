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
  wallet: {
	id: string;
	accounts: Array<string>;
  };
  projects: object;
}

export default User;
