import { Request, Response } from "express";
import { uploadFile, getFile } from "../util/s3";
import fs from "fs";
import { promisify } from "util";
import {authFormModel} from "../models/AuthFormModel";

/**
 * Contains everything related to Explore page and Project page
 */

const unlinkFile = promisify(fs.unlink);

const getSingleImage = (req: Request, res: Response) => {
  const key = req.params.key;
  const readStream = getFile(key);

  readStream.pipe(res);
};

const uploadSingleImage = async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  const result = await uploadFile(file);
  await unlinkFile(file.path); // DELETE THE FILE ONCE UPLOADED TO S3
  console.log(`Result ${result}`);
  const description = req.body.description;
  res.send({ imagePath: `/images/${result.Key}` });
};

const createProject = async (req: Request, res: Response) => {
  const {orgName, projectTitle, projectSubTitle, category, solution, summary, image, goalAmount} = req.body;
  
}


/**
 * @brief - Request for adding a project to explore page
 */
async function submitForm(req: Request, res: Response) {
  const {
    orgId,
    approved,
    name,
    EIN,
    website,
    category,
    location,
    phone,
    sns,
    orgImg,
  } = req.body;

  // CHECK IF ALL FIELDS ARE VALID
  if (
      !orgId ||
      !approved ||
      !name ||
      !EIN ||
      !website ||
      !category ||
      !location ||
      !phone
  ) {
    return res
        .status(404)
        .json({status: "ERROR", msg: `Field missing from the form`});
  }

  let newOrg;
  try {
    // CHECK IF THE FORM EXIST FOR THE REQUESTED ORGANIZATION
    const formExists = await authFormModel.find({orgId});
    if (formExists) {
      return res.status(409).json({
        status: "ERROR",
        msg: "The form already exists for this organization!",
      });
    }
    newOrg = new authFormModel(...req.body);
    await newOrg.save();
  } catch (err) {
    return res
        .status(500)
        .json({status: "ERROR", msg: `Error saving the form to the database`});
  }

  res.status(201).json({status: "SUCCESS", msg: "Form successfully saved!"});
}

export { uploadSingleImage, getSingleImage, submitForm};
