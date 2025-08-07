import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  endpoint: process.env.STORJ_ENDPOINT,
  accessKeyId: process.env.STORJ_ACCESS_KEY,
  secretAccessKey: process.env.STORJ_SECRET_KEY,
  signatureVersion: 'v4',
  region: 'us-east-1',
});

export default s3;
