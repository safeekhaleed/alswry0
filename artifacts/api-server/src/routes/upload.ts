import { Router } from "express";
import { requireAuth } from "../lib/sessions.js";

const router = Router();

router.post("/upload", requireAuth, async (req, res) => {
  const { base64, mimeType } = req.body ?? {};
  if (!base64 || !mimeType) {
    res.status(400).json({ error: "base64 و mimeType مطلوبان" });
    return;
  }
  const url = `data:${mimeType};base64,${base64}`;
  res.json({ url });
});

export default router;
