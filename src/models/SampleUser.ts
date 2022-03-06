import { model, Schema } from "mongoose";

interface User {
  username: string;
  password: string;
  email: string;
}

const UserSchema: Schema = new Schema<User>(
  {
    username: { type: String, require: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const UserModel = model("User", UserSchema);
export { UserModel, User };
