import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  endpoint: "https://storage.yandexcloud.net",
  region: "ru-central1",
  credentials: {
    accessKeyId: process.env.YC_ACCESS_KEY_ID,
    secretAccessKey: process.env.YC_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileName, fileType, folder } = req.body;
    if (!fileName || !fileType) return res.status(400).json({ error: 'Missing fileName or fileType' });

    const key = `${folder}/${Date.now()}_${fileName}`;
    const command = new PutObjectCommand({
      Bucket: 'gopo-music',
      Key: key,
      ContentType: fileType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
    res.status(200).json({ uploadUrl, key });
  } catch (error) {
    console.error('S3 presign error:', error);
    res.status(500).json({ error: error.message });
  }
}
