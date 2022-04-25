import {model, Schema} from "mongoose";
import {ProjectSchema} from "./ProjectModel";
import {WalletSchema} from "./WalletModel";
import User from "./interface/User";

const OrganizationSchema: Schema = new Schema<User>(
    {
        username: {type: String, require: true},
        password: {type: String, required: true},
        email: {type: String, required: true},
        role: {type: String, required: true},
        wallet: {type: WalletSchema, required: true},
        projects: {type: [ProjectSchema], default: []},
        approved: {type: Boolean, default: false}
    },
    {
        timestamps: true,
    }
);

const organizationModel = model("Organization", OrganizationSchema);
export {organizationModel};
