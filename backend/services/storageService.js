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

async function deleteFolder(prefix) {
  // 1. Safety Check: Boş veya kök dizin kontrolü
  if (!prefix || prefix.trim() === "" || prefix === "/" || !prefix.includes("/")) {
    throw new Error(`DANGER: Unsafe delete operation prevented for prefix: '${prefix}'. Path must contain at least one subdirectory.`);
  }

  console.log(`[Storage] Deleting folder: ${prefix}`);

  if (supabaseClient) {
    // 2. Dosyaları listele
    const files = await listFiles(prefix);

    if (!files || files.length === 0) {
      console.log(`[Storage] No files found in ${prefix}`);
      return { count: 0 };
    }

    const filesToDelete = files.map(f => f.name); // Supabase remove metodu, o klasörün içindeki dosya isimlerini bekler (prefix/file değil, sadece file name mi? Yoksa full path mi? Supabase dökümantasyonuna göre bu metot genellikle dosya isimleri dizisi alır ama klasör bağlamında. Ancak biz garanti olsun diye full path (key) kullanırsak ve bucket rootundan silersek daha iyi olabilir. AMA `from(bucket).remove([ 'folder/file.png' ])` çalışır.
    // Düzeltme: Supabase 'remove' metodu full path (key) listesi bekler.
    const keysToDelete = files.map(f => f.key || `${prefix}/${f.name}`);

    // 3. Dosyaları sil
    const { data, error } = await supabaseClient.storage
      .from(supabaseBucket)
      .remove(keysToDelete);

    if (error) {
      throw error;
    }

    console.log(`[Storage] Successfully deleted ${keysToDelete.length} files from ${prefix}`);
    return { count: keysToDelete.length, deleted: keysToDelete };
  }

  // S3 ve Local için implementasyon gerekirse buraya eklenebilir
  throw new Error("Delete folder is currently only supported with Supabase storage");
}

module.exports = {
  uploadFile,
  getFileStream,
  isS3Ready,
  isSupabaseReady,
  listFiles,
  deleteFolder,
};

