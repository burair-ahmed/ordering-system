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
      const client = getCloudinary();
      const uploadRes = await client.uploader.upload(trimmed, {
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


