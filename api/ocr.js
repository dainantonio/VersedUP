import vision from "@google-cloud/vision";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getClient() {
  const raw = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS;
  if (!raw) throw new Error("Missing GOOGLE_CLOUD_VISION_CREDENTIALS env var.");
  const credentials = JSON.parse(raw);
  return new vision.ImageAnnotatorClient({ credentials });
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({ error: "Missing imageBase64" });
      return;
    }

    const client = getClient();
    const [result] = await client.textDetection({
      image: { content: imageBase64 }
    });

    const text =
      result?.fullTextAnnotation?.text ||
      result?.textAnnotations?.[0]?.description ||
      "";

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}
