import {model, Schema} from "mongoose";

/**
 * Information Form for Authentication
 */

const ProjectFormSchema: Schema = new Schema(
    {
        name: {type: String, required: true},
        EIN: {type: String, required: true},
        category: {type: String, required: true},
        email: {type: String, required: true},
        phone: {type: String, required: true},
        location: {type: String, required: true},
        website: {type: String, required: true},

        orgId: {type: String, required: true},
        approved: {type: Boolean, required: true, default: false},
        sns: [{type: String}],
        orgImg: {type: String},
    },
    {
        timestamps: true,
    }
);

const projectFormModel = model("ProjectForm", ProjectFormSchema);
export {projectFormModel};
