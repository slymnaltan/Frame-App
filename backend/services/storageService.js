const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const { Readable } = require("stream");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { createClient } = require("@supabase/supabase-js");

const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
const region = process.env.AWS_REGION || process.env.S3_REGION;
const localRoot =
  process.env.LOCAL_STORAGE_ROOT ||
  path.join(__dirname, "..", "storage", "uploads");

const isS3Ready =
  Boolean(bucket) &&
  Boolean(region) &&
  Boolean(process.env.AWS_ACCESS_KEY_ID) &&
  Boolean(process.env.AWS_SECRET_ACCESS_KEY);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET;

const isSupabaseReady =
  Boolean(supabaseUrl) && Boolean(supabaseKey) && Boolean(supabaseBucket);

const s3Client = isS3Ready
  ? new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

const supabaseClient = isSupabaseReady
  ? createClient(supabaseUrl, supabaseKey)
  : null;

async function ensureLocalDir(filePath) {
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
}

async function uploadFile({ buffer, mimetype, key }) {
  if (!key) {
    throw new Error("Storage key is required");
  }

  if (supabaseClient) {
    const { error: uploadError } = await supabaseClient.storage
      .from(supabaseBucket)
      .upload(key, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: mimetype,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabaseClient.storage.from(supabaseBucket).getPublicUrl(key);

    return {
      key,
      url: publicUrl,
      driver: "supabase",
    };
  }

  if (s3Client) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await s3Client.send(command);

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return { key, url, driver: "s3" };
  }

  const absolutePath = path.join(localRoot, key);
  await ensureLocalDir(absolutePath);
  await fsPromises.writeFile(absolutePath, buffer);

  return {
    key,
    url: `/storage/${key}`,
    driver: "local",
    absolutePath,
  };
}

async function getFileStream(key) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.storage
      .from(supabaseBucket)
      .download(key);

    if (error) {
      throw error;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return {
      stream: Readable.from(buffer),
    };
  }

  if (s3Client) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await s3Client.send(command);
    return {
      stream: response.Body,
      contentType: response.ContentType,
      length: response.ContentLength,
    };
  }

  const absolutePath = path.join(localRoot, key);
  return {
    stream: fs.createReadStream(absolutePath),
  };
}

async function listFiles(prefix) {
  if (!prefix) {
    throw new Error("Prefix is required to list files");
  }

  if (supabaseClient) {
    const { data, error } = await supabaseClient.storage
      .from(supabaseBucket)
      .list(prefix, {
        limit: 1000,
        sortBy: { column: "created_at", order: "asc" },
      });

    if (error) {
      throw error;
    }

    return (data || []).map(obj => ({
      key: `${prefix}/${obj.name}`,
      name: obj.name,
      size: obj.metadata?.size,
    }));
  }

  throw new Error("List files is only supported with Supabase storage in this setup");
}

module.exports = {
  uploadFile,
  getFileStream,
  isS3Ready,
  isSupabaseReady,
  listFiles,
};

