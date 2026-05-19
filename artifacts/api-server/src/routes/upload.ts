import { Router } from "express";
import { requireAuth } from "../lib/sessions.js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, extname } from "path";
import { randomBytes } from "crypto";

const router = Router();

const UPLOADS_DIR = join(process.cwd(), "uploads");
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/pdf": ".pdf",
  "application/vnd.android.package-archive": ".apk",
  "text/plain": ".txt",
};

router.post("/upload", requireAuth, async (req, res) => {
  const { base64, mimeType } = req.body ?? {};
  if (!base64 || !mimeType) {
    res.status(400).json({ error: "base64 و mimeType مطلوبان" });
    return;
  }

  try {
    const ext = MIME_EXT[mimeType] ?? ".bin";
    const filename = `${randomBytes(12).toString("hex")}${ext}`;
    const filepath = join(UPLOADS_DIR, filename);
    const buffer = Buffer.from(base64, "base64");
    writeFileSync(filepath, buffer);

    // Build public URL — served at /api/uploads/<filename>
    const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "";
    const proto = req.headers["x-forwarded-proto"] ?? "https";
    const url = `${proto}://${host}/api/uploads/${filename}`;
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: `فشل حفظ الملف: ${err.message}` });
  }
});

export default router;
