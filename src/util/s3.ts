import S3 from "aws-sdk/clients/s3";
import fs from "fs";

const bucketName = process.env.AWS_BUCKET_NAME as string;
const region = process.env.AWS_BUCKET_REGION as string;
const accessKeyId = process.env.AWS_ACCESS_KEY as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;

const s3 = new S3({ region, accessKeyId, secretAccessKey });

// Uploads file to S3
const uploadFile = (file: Express.Multer.File) => {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
};

// Downloads file from s3
const getFile = (fileKey: string) => {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  };
  return s3.getObject(downloadParams).createReadStream();
};

export { uploadFile, getFile };
