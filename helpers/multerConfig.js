const multer = require('multer');
const multerGoogleStorage = require('multer-google-storage');
const fs = require('fs');
// const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'assets/documents/siser');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const cloudStorage = multerGoogleStorage.storageEngine({
    keyFilename: '/secrets/cloudsql/cloud-storage.json',
    projectId: process.env.PROJECT_ID,
    bucket: process.env.BUCKETNAME,
    filename: (req, file, cb) => {
      cb(null, `${new Date().toISOString()}_${file.originalname}`);
    }
  });

const fileFilter = (req, file, cb) => {
  const fileTypePosition = file.originalname.toLowerCase().indexOf('xls');
  const fileType = file.originalname.substring(fileTypePosition, file.originalname.length);
  if (fileType.toLowerCase() !== 'xlsx') {
    cb(null, false);
  } else {
    cb(null, true);
  }
}

const deleteFile = (path) => {
  fs.unlink(path, err => {
    if (err) throw (err);
  })
}

module.exports = {
  storage,
  fileFilter,
  deleteFile,
  cloudStorage
}

