import {model, Schema} from "mongoose";

/**
 * Information Form for Authentication
 */

const AuthFormSchema: Schema = new Schema(
    {
        orgId: {type: String, required: true}, // organization username
        name: {type: String, required: true},
        EIN: {type: String, required: true},
        category: {type: String, required: true},
        email: {type: String, required: true},
        phone: {type: String, required: true},
        location: {type: String, required: true},
        website: {type: String, required: true},
        approved: {type: Boolean, required: true}
    },
    {
        timestamps: true,
    }
);

const authFormModel = model("AuthForm", AuthFormSchema);
export {authFormModel};
