const express = require("express");
const cors = require("cors");
const multer = require("multer");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());

app.post("/analyze", upload.single("image"), async (req, res) => {
  console.log("📥 /analyze endpoint hit");

  try {
    if (!req.file) {
      console.error("❌ No file received");
      return res.status(400).json({ error: "Image missing" });
    }

    console.log("✅ Image received");
    console.log("📏 Size:", req.file.size);
    console.log("🖼️ Type:", req.file.mimetype);

    const base64Image = req.file.buffer.toString("base64");

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
No explanation.

Return this exact JSON format:

{
  "brand": "string",
  "model": "string",
  "year": "string",
  "price": { "min": number, "max": number },
  "ncap": { "adult": number, "child": number }
}
              `
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64Image}`
            }
          ]
        }
      ]
    });

    console.log("🤖 OpenAI response received");

    const aiText = response.output_text;
    console.log("🧠 AI RAW OUTPUT:", aiText);

    const aiResult = JSON.parse(aiText);
    return res.json(aiResult);

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 CarScan backend running on port ${PORT}`);
});
