import {model, Schema, Model, Document} from "mongoose";

/**
 * Information Form for Authentication
 */

interface AuthForm extends Document{
    orgId: string
    name: string
    EIN: string
    category: string
    email: string
    phone: string
    location: string
    website: string
    approved:boolean
}

const AuthFormSchema: Schema = new Schema<AuthForm>(
    {
        orgId: {type: String, required: true}, // organization username
        name: {type: String, required: true},
        EIN: {type: String, required: true},
        category: {type: String, required: true},
        email: {type: String, required: true},
        phone: {type: String, required: true},
        location: {type: String, required: true},
        website: {type: String, required: true},
        approved: {type: Boolean, default: false}
    },
    {
        timestamps: true,
    }
);

const authFormModel: Model<AuthForm> = model("AuthForm", AuthFormSchema);
export {authFormModel, AuthForm};
