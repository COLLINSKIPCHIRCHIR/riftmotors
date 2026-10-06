// src/middleware/compressImages.js
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

const MAX_DIMENSION = 1600; // longest side in pixels
const WEBP_QUALITY = 80;

export const compressImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  const created = [];

  try {
    await Promise.all(
      req.files.map(async (file) => {
        // "-opt" avoids input and output being the same path for .webp uploads
        const outName = `${path.parse(file.filename).name}-opt.webp`;
        const outPath = path.join(file.destination, outName);
        created.push(outPath);

        await sharp(file.path)
          .rotate() // apply EXIF orientation so phone photos aren't sideways
          .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: WEBP_QUALITY })
          .toFile(outPath);

        await fs.unlink(file.path); // delete the large original

        const { size } = await fs.stat(outPath);
        file.filename = outName;
        file.path = outPath;
        file.mimetype = "image/webp";
        file.size = size;
      })
    );

    next();
  } catch (err) {
    console.error("❌ Image compression failed:", err);

    // Remove anything we wrote or received so no orphan files are left
    await Promise.allSettled([
      ...created.map((p) => fs.unlink(p)),
      ...req.files.map((f) => fs.unlink(f.path)),
    ]);

    res.status(400).json({
      error: `Could not process one of the images (${err.message}). The file may be corrupted. Try re-saving it as a JPG.`,
    });
  }
};