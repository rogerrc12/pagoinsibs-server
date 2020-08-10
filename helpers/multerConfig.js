const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "assets/documents/siser");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
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
