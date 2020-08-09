const { Storage } = require("@google-cloud/storage");
const path = require("path");

const secretPath = "/secrets/cloudsql/cloud-storage.json";
const gcStorage = "testing";
// const gcStorage = new Storage({
//   keyFilename: secretPath,
//   projectId: process.env.PROJECT_ID,
// });

const deleteFileGcStorage = async (filename) => {
  // try {
  //   await gcStorage.bucket(process.env.BUCKETNAME).file(filename).delete();
  // } catch (error) {
  //   throw error;
  // }
};

module.exports = {
  gcStorage,
  deleteFileGcStorage,
};
