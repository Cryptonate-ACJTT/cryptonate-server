import { model, Schema } from "mongoose";

const FormSchema: Schema = new Schema(
  {
    orgId: { type: String, required: true },
    approved: { type: Boolean, required: true, default: false },
    name: { type: String, required: true },
    EIN: { type: String, required: true },
    website: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    phone: { type: String, required: true },
    sns: [{ type: String }],
    orgImg: { type: String },
  },
  {
    timestamps: true,
  }
);

const organizationModel = model("Form", FormSchema);
export { organizationModel };
