import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

let _s3: S3Client | null = null

function getS3() {
  if (!_s3) {
    _s3 = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT || undefined,
      region: process.env.STORAGE_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: false,
    })
  }
  return _s3
}

function getBucket() {
  return process.env.STORAGE_BUCKET_NAME!
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  mimeType: string
): Promise<void> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: mimeType,
    })
  )
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key })
  return getSignedUrl(getS3(), command, { expiresIn: expiresInSeconds })
}

export function buildFilePath(
  hireId: string,
  docType: string,
  fileName: string
): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  return `hires/${hireId}/${docType}/${sanitized}`
}
