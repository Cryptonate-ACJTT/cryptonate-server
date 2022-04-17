import {model, Schema} from "mongoose";
import User from "./interface/User";
import {ProjectSchema} from "./ProjectModel"

const DonorSchema: Schema = new Schema<User>(
    {
        username: {type: String, require: true},
        password: {type: String, required: true},
        email: {type: String, required: true},
        role: {type: String, required: true},
		wallet: {type: Object, required: false},
        projects: {type: [ProjectSchema], default: []}
    },
    {
        timestamps: true,
    }
);

const donorModel = model("Donor", DonorSchema);
export {donorModel};
