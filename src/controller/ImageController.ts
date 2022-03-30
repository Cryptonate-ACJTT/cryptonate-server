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
  console.log(req);
  const result = await uploadFile(file);
  await unlinkFile(file.path); // DELETE THE FILE ONECE UPLAODED TO S3
  console.log("Result is: ")
  console.log(result);
  const description = req.body.description;
  console.log(`Description is: ${description}`)
  res.send({ imagePath: `/images/${result.Key}` });
};

export { uploadSingleImage, getSingleImage };
