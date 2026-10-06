// src/middleware/compressImages.js
import path from "path";
import fs from "fs/promises";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 80;

// Load sharp lazily so a missing/unsupported sharp can never crash the API
let sharpPromise = null;
const loadSharp = () => {
  if (!sharpPromise) {
    sharpPromise = import("sharp")
      .then((m) => m.default)
      .catch((err) => {
        console.warn(
          "⚠️ sharp unavailable, images will be stored without compression:",
          err.message.split("\n")[0]
        );
        return null;
      });
  }
  return sharpPromise;
};

export const compressImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  const sharp = await loadSharp();
  if (!sharp) return next(); // keep originals

  const created = [];

  try {
    await Promise.all(
      req.files.map(async (file) => {
        const outName = `${path.parse(file.filename).name}-opt.webp`;
        const outPath = path.join(file.destination, outName);
        created.push(outPath);

        await sharp(file.path)
          .rotate()
          .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: WEBP_QUALITY })
          .toFile(outPath);

        await fs.unlink(file.path);

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

    await Promise.allSettled([
      ...created.map((p) => fs.unlink(p)),
      ...req.files.map((f) => fs.unlink(f.path)),
    ]);

    res.status(400).json({
      error: `Could not process one of the images (${err.message}). The file may be corrupted. Try re-saving it as a JPG.`,
    });
  }
};