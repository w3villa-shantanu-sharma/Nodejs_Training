// utils/storjClient.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.STORJ_ENDPOINT, // e.g. https://gateway.storjshare.io
  accessKeyId: process.env.STORJ_ACCESS_KEY,
  secretAccessKey: process.env.STORJ_SECRET_KEY,
  signatureVersion: 'v4',
  region: 'us-east-1',
});

module.exports = s3;
