import {model, Schema, Document, Model} from "mongoose";

interface Project extends Document {
    orgName: string
    projectName: string
    projectSubTitle: string
    category: string
    summary: string
    solution: string
    image: string
    goalAmount: number
    totalSaved: number
	projectOpen: boolean

}

const ProjectSchema: Schema = new Schema<Project>(
    {
        orgName: {type: String, requried: true},
        projectName: {type: String, required: true},
        projectSubTitle: {type: String, required: true},
        category: {type: String, required: true},
        summary: {type: String, required: true},
        solution: {type: String, required: true},
        image: {type: String, required: true},
        goalAmount: {type: Number, required: true},               // goal coin value
        totalSaved: {type: Number, default: 0.0}, // current progress coin saved
		projectOpen: {type: Boolean, default: true}
    },
    {
        timestamps: true,
    }
);

const projectModel: Model<Project> = model("Project", ProjectSchema);
export {projectModel, Project};
