import {model, Schema} from "mongoose";
import User from "./interface/User";
import {ProjectSchema} from "./ProjectModel"
import { WalletSchema } from "./WalletModel";

const DonorSchema: Schema = new Schema<User>(
    {
        username: {type: String, require: true},
        password: {type: String, required: true},
        email: {type: String, required: true},
        role: {type: String, required: true},
		wallet: {type: WalletSchema, required: true},
        projects: {type: [ProjectSchema], default: []}
    },
    {
        timestamps: true,
    }
);

const donorModel = model("Donor", DonorSchema);
export {donorModel};
