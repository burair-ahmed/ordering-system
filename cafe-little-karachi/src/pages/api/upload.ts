import { NextApiRequest, NextApiResponse } from "next";
import { getCloudinary } from "@/lib/cloudinary";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { image, folder } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const cloudinary = getCloudinary();
    const result = await cloudinary.uploader.upload(image, {
      folder: folder || "cafe-little-karachi/banners",
    });

    return res.status(200).json({ url: result.secure_url });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({
      error: "Failed to upload image to Cloudinary",
      details: error.message || "Unknown error",
    });
  }
}

