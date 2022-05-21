import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const env = import.meta.env;

export const s3 = new AWS.S3({
    accessKeyId: env.VITE_FRENTLY_MINIO_ACCESS_KEY,
    secretAccessKey: env.VITE_FRENTLY_MINIO_SECRET_KEY,
    endpoint: env.VITE_FRENTLY_MINIO_URL,
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: 'v4',
});

export const uploadImageToS3 = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();

    const DataArray = new Int8Array(arrayBuffer);

    return s3
        .upload({
            Bucket: 'public',
            Key: `${uuidv4()}-${file.name}`,
            Body: DataArray,
        })
        .promise();
};
