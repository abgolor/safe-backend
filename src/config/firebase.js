// src/config/firebase.js
const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(
  __dirname,
  "../../safe-service-account.json"
));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const database = admin.database();
const auth = admin.auth();

module.exports = {
  admin,
  database,
  auth,
};
