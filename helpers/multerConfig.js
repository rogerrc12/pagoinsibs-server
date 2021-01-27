const multer = require("multer");
const fs = require("fs");
const path = require("path");
const aws = require("aws-sdk");
const shortid = require("shortid");
const multerS3 = require("multer-s3");

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_KEY_ID,
  region: "us-east-2",
});

const s3 = new aws.S3();

const fileStorage = multerS3({
  s3,
  bucket: "pagoinsibs",
  acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
  key: (req, file, cb) => cb(null, file.originalname.split(".")[0] + "_" + new Date().toISOString() + ".xlsx"),
});

const imageStorage = multerS3({
  s3,
  bucket: "pagoinsibs",
  acl: "public-read",
  contentDisposition: "inline",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
  key: (req, file, cb) => cb(null, shortid.generate() + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const fileTypePosition = file.originalname.toLowerCase().indexOf("xls");
  const fileType = file.originalname.substring(fileTypePosition, file.originalname.length);
  if (fileType.toLowerCase() !== "xlsx") {
    cb(null, false);
  } else {
    cb(null, true);
  }
};

const deleteFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};

module.exports = {
  fileStorage,
  imageStorage,
  fileFilter,
  deleteFile,
};
