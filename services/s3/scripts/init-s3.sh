#!/usr/bin/env bash

wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc

mc alias set s3 "$FRENTLY_MINIO_URL" "$FRENTLY_MINIO_ACCESS_KEY" "$FRENTLY_MINIO_SECRET_KEY" --api S3v4

mc mb s3/public

mc policy set public s3/public

