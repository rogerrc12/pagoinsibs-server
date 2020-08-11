const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname.split(".")[0] + "_" + new Date().toISOString() + ".xlsx");
  },
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
  storage,
  fileFilter,
  deleteFile,
};
