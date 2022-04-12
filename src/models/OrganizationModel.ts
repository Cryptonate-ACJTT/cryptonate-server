import {model, Schema} from "mongoose";
import User from "./interface/User";
import {ProjectSchema} from "./ProjectModel";

const OrganizationSchema: Schema = new Schema<User>(
    {
        username: {type: String, require: true},
        password: {type: String, required: true},
        email: {type: String, required: true},
        role: {type: String, required: true},
        projects: {type: [ProjectSchema], default: []}
    },
    {
        timestamps: true,
    }
);

const organizationModel = model("Organization", OrganizationSchema);
export {organizationModel};
