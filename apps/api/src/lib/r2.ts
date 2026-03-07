import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "./env";

const client = new S3Client({
  region: "auto",
  endpoint: env.r2Endpoint,
  credentials: {
    accessKeyId: env.r2AccessKey,
    secretAccessKey: env.r2SecretKey,
  },
});

export async function uploadToR2(
  fileKey: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: fileKey,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteFromR2(fileKey: string): Promise<void> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.r2Bucket,
      Key: fileKey,
    }),
  );
}
