import { model, Schema } from "mongoose";
import User from "./interface/User";

const AdminSchema: Schema = new Schema<User>(
  {
    username: { type: String, require: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const adminModel = model("Admin", AdminSchema);
export { adminModel };
