import AWS from 'aws-sdk';
const env = import.meta.env;
console.log();

export const s3 = new AWS.S3({
    accessKeyId: env.VITE_FRENTLY_MINIO_ACCESS_KEY,
    secretAccessKey: env.VITE_FRENTLY_MINIO_SECRET_KEY,
    endpoint: env.VITE_FRENTLY_MINIO_URL,
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: 'v4',
});
