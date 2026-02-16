/**
 * /api/ocr.js  (Vercel Serverless Function)
 *
 * Env var required:
 * - GOOGLE_VISION_API_KEY
 *
 * Request:
 *   POST { "imageBase64": "..." }
 *
 * Response:
 *   200 { "text": "..." }
 */

export default async function handler(req, res) {
  const corsOrigin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GOOGLE_VISION_API_KEY on server" });

    const { imageBase64 } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    const endpoint =
      "https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(apiKey);

    const body = {
      requests: [
        {
          image: { content: imageBase64 },
          features: [
            { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
            { type: "TEXT_DETECTION", maxResults: 1 },
          ],
        },
      ],
    };

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || "Google Vision request failed",
        details: data?.error || data,
      });
    }

    const anno = data?.responses?.[0] || {};
    const fullText = anno?.fullTextAnnotation?.text || "";
    const textBlocks = Array.isArray(anno?.textAnnotations) ? anno.textAnnotations : [];
    const fallback = textBlocks?.[0]?.description || "";

    const text = String(fullText || fallback || "").trim();

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err || "Unknown error") });
  }
}
