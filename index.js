const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const multer = require("multer");
require("dotenv").config();

const app = express();

/* =========================
   BASIC SETUP
========================= */
app.use(cors());

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

/* =========================
   OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("CarScan backend is running");
});

/* =========================
   ANALYZE ENDPOINT
========================= */
app.post("/analyze", upload.single("image"), async (req, res) => {
  console.log("📥 /analyze HIT");

  try {
    console.log("➡️ Headers:", req.headers);

    if (!req.file) {
      console.error("❌ NO FILE RECEIVED");
      return res.status(400).json({ error: "Image missing" });
    }

    console.log("✅ File received");
    console.log("📄 File info:", {
      fieldname: req.file.fieldname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const base64Image = req.file.buffer.toString("base64");
    console.log("🧠 Base64 length:", base64Image.length);

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are a car analysis AI.

Return ONLY valid JSON.
No markdown.
No explanations.

Analyze the car in the image and return EXACTLY this format:

{
  "brand": "string",
  "model": "string",
  "year": "string",
  "price": {
    "min": number,
    "max": number
  },
  "ncap": {
    "adult": number,
    "child": number
  }
}
              `,
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    console.log("🤖 OpenAI raw output:", response.output_text);

    const aiResult = JSON.parse(response.output_text);

    console.log("✅ Parsed AI result:", aiResult);

    return res.json(aiResult);
  } catch (err) {
    console.error("🔥 ANALYZE ERROR:", err);
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 CarScan backend running on port ${PORT}`);
});
