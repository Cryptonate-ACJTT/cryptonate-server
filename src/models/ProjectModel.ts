import { model, Schema } from "mongoose";

const ProjectSchema: Schema = new Schema(
  {
    orgName: {type: String, requried: true},
    projectTitle: { type: String, required: true },
    projectSubTitle: { type: String, required: true },
    category: { type: String, required: true },
    solution: { type: String, required: true },
    summary: { type: String, required: true },
    image: {type: String, required: true},
    goalAmount: {type:Number, requried: true},               // goal coin value 
    totalSaved: {type: Number, required: true, default: 0.0} // current progress coin saved 
  },
  {
    timestamps: true,
  }
);

const projectModel = model("Project", ProjectSchema);
export { projectModel};
