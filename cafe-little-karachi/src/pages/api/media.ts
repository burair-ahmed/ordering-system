import { NextApiRequest, NextApiResponse } from "next";
import { getCloudinary } from "@/lib/cloudinary";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export interface MediaResource {
  public_id: string;
  format: string;
  version?: number;
  resource_type: string;
  type?: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
  folder?: string;
  filename?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cloudinary = getCloudinary();

  if (req.method === "GET") {
    try {
      const maxResults = Math.min(Number(req.query.max_results) || 60, 100);
      const nextCursor = req.query.next_cursor ? String(req.query.next_cursor) : undefined;
      const search = req.query.search ? String(req.query.search).trim() : "";
      const folder = req.query.folder ? String(req.query.folder).trim() : "";

      let resources: MediaResource[] = [];
      let newNextCursor: string | undefined = undefined;
      let totalCount: number | undefined = undefined;

      try {
        // Attempt using Cloudinary Search API first (richer sorting and text matching)
        let searchExp = "resource_type:image";
        if (folder) {
          searchExp += ` AND folder:"${folder}*"`;
        }
        if (search) {
          searchExp += ` AND (public_id:*${search}* OR filename:*${search}*)`;
        }

        let searchReq = cloudinary.search
          .expression(searchExp)
          .sort_by("created_at", "desc")
          .max_results(maxResults);

        if (nextCursor) {
          searchReq = searchReq.next_cursor(nextCursor);
        }

        const searchRes = await searchReq.execute();
        resources = (searchRes.resources || []).map((r: any) => ({
          public_id: r.public_id,
          format: r.format,
          version: r.version,
          resource_type: r.resource_type,
          type: r.type,
          created_at: r.created_at,
          bytes: r.bytes || 0,
          width: r.width || 0,
          height: r.height || 0,
          url: r.url,
          secure_url: r.secure_url,
          folder: r.folder,
          filename: r.filename,
        }));
        newNextCursor = searchRes.next_cursor;
        totalCount = searchRes.total_count;
      } catch (searchErr) {
        console.warn("Cloudinary Search API fallback to Admin Resources API:", searchErr);
        // Fallback to standard admin resources API
        const adminOptions: any = {
          resource_type: "image",
          type: "upload",
          max_results: maxResults,
        };
        if (nextCursor) adminOptions.next_cursor = nextCursor;
        if (folder) adminOptions.prefix = folder;

        const adminRes = await cloudinary.api.resources(adminOptions);
        resources = (adminRes.resources || []).map((r: any) => ({
          public_id: r.public_id,
          format: r.format,
          version: r.version,
          resource_type: r.resource_type,
          type: r.type,
          created_at: r.created_at,
          bytes: r.bytes || 0,
          width: r.width || 0,
          height: r.height || 0,
          url: r.url,
          secure_url: r.secure_url,
          folder: r.folder,
          filename: r.public_id.split("/").pop(),
        }));

        if (search) {
          const lower = search.toLowerCase();
          resources = resources.filter((r) => r.public_id.toLowerCase().includes(lower));
        }
        newNextCursor = adminRes.next_cursor;
      }

      return res.status(200).json({
        resources,
        next_cursor: newNextCursor,
        total_count: totalCount,
      });
    } catch (error: any) {
      console.error("Failed to list Cloudinary media resources:", error);
      return res.status(500).json({
        error: "Failed to fetch media assets from Cloudinary",
        details: error.message || "Unknown error",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { image, images, folder = "cafe-little-karachi/gallery" } = req.body;
      const imagesToUpload: string[] = [];

      if (Array.isArray(images) && images.length > 0) {
        imagesToUpload.push(...images);
      } else if (image) {
        imagesToUpload.push(image);
      }

      if (imagesToUpload.length === 0) {
        return res.status(400).json({ error: "No image payload provided for upload" });
      }

      const uploadedResults: MediaResource[] = [];

      for (const img of imagesToUpload) {
        const uploadRes = await cloudinary.uploader.upload(img, {
          folder,
          resource_type: "image",
        });

        uploadedResults.push({
          public_id: uploadRes.public_id,
          format: uploadRes.format,
          version: uploadRes.version,
          resource_type: uploadRes.resource_type,
          type: uploadRes.type,
          created_at: uploadRes.created_at,
          bytes: uploadRes.bytes,
          width: uploadRes.width,
          height: uploadRes.height,
          url: uploadRes.url,
          secure_url: uploadRes.secure_url,
          folder: uploadRes.folder,
          filename: uploadRes.original_filename || uploadRes.public_id.split("/").pop(),
        });
      }

      return res.status(201).json({
        success: true,
        count: uploadedResults.length,
        resources: uploadedResults,
      });
    } catch (error: any) {
      console.error("Cloudinary upload failed:", error);
      return res.status(500).json({
        error: "Failed to upload image(s) to Cloudinary",
        details: error.message || "Unknown error",
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { public_ids, public_id } = req.body;
      const targetIds: string[] = [];

      if (Array.isArray(public_ids) && public_ids.length > 0) {
        targetIds.push(...public_ids.filter(Boolean));
      } else if (public_id && typeof public_id === "string") {
        targetIds.push(public_id);
      } else if (req.query.public_id) {
        targetIds.push(String(req.query.public_id));
      }

      if (targetIds.length === 0) {
        return res.status(400).json({ error: "No public_id(s) provided for deletion" });
      }

      // Delete resources
      let deleteResult: any;
      if (targetIds.length === 1) {
        const singleRes = await cloudinary.uploader.destroy(targetIds[0]);
        deleteResult = { [targetIds[0]]: singleRes.result };
      } else {
        const bulkRes = await cloudinary.api.delete_resources(targetIds);
        deleteResult = bulkRes.deleted || {};
      }

      return res.status(200).json({
        success: true,
        deletedCount: targetIds.length,
        deleted: deleteResult,
      });
    } catch (error: any) {
      console.error("Cloudinary deletion failed:", error);
      return res.status(500).json({
        error: "Failed to delete media asset(s) from Cloudinary",
        details: error.message || "Unknown error",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
