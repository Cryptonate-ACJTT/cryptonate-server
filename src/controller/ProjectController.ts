import { Request, Response } from "express";
import { uploadFile, getFile } from "../util/s3";
import fs from "fs";
import { promisify } from "util";

const unlinkFile = promisify(fs.unlink);

const getSingleImage = (req: Request, res: Response) => {
  const key = req.params.key;
  const readStream = getFile(key);

  readStream.pipe(res);
};

const uploadSingleImage = async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  const result = await uploadFile(file);
  await unlinkFile(file.path); // DELETE THE FILE ONECE UPLAODED TO S3
  console.log(`Result ${result}`);
  const description = req.body.description;
  res.send({ imagePath: `/images/${result.Key}` });
};

const createProject = async (req: Request, res: Response) => {
  const {orgName, projectTitle, projectSubTitle, category, solution, summary, image, goalAmount} = req.body;
  
}

export { uploadSingleImage, getSingleImage };
