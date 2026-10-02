import { v2 as cloudinary } from "cloudinary";

export function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

/**
 * Uploads an image payload (base64, URL, or data URI) to Cloudinary with automatic
 * retry and socket timeout to safely recover from ECONNRESET / network drops.
 */
export async function uploadToCloudinaryWithRetry(
  imageStr: string,
  options: Record<string, any> = {},
  maxRetries = 2
): Promise<any> {
  const client = getCloudinary();
  const uploadOptions = {
    timeout: 90000,
    ...options,
  };

  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await client.uploader.upload(imageStr, uploadOptions);
      return result;
    } catch (error: any) {
      lastError = error;
      const isNetworkErr =
        error?.code === "ECONNRESET" ||
        error?.code === "ETIMEDOUT" ||
        error?.errno === -4077 ||
        error?.message?.includes("ECONNRESET") ||
        error?.message?.includes("timeout");

      if (attempt <= maxRetries && isNetworkErr) {
        console.warn(
          `[Cloudinary] Upload attempt ${attempt} failed (${error.code || error.message}). Retrying in ${attempt * 1.5}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        continue;
      }
      break;
    }
  }

  throw lastError;
}

/**
 * Ensures an image string is stored as a Cloudinary URL.
 * If it's already a http/https URL, returns it unchanged.
 * If it's a base64 string (starts with data: or raw base64 string), uploads to Cloudinary and returns secure_url.
 */
export async function ensureCloudinaryUrl(
  imageStr: string | null | undefined,
  folder: string = "cafe-little-karachi/products"
): Promise<string> {
  if (!imageStr || typeof imageStr !== "string") {
    return imageStr || "";
  }
  const trimmed = imageStr.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("data:") || trimmed.length > 500) {
    try {
      const uploadRes = await uploadToCloudinaryWithRetry(trimmed, {
        folder,
      });
      return uploadRes.secure_url;
    } catch (error) {
      console.error(`Cloudinary upload error for folder ${folder}:`, error);
      throw error;
    }
  }
  return trimmed;
}

export default cloudinary;



