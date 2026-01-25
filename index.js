const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const multer = require("multer");
require("dotenv").config();

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    console.log("📩 /analyze called");

    if (!req.file) {
      console.error("❌ No file received");
      return res.status(400).json({ error: "Image missing" });
    }

    console.log("✅ Image received:", req.file.mimetype, req.file.size);

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

    const text = response.output_text;
    console.log("🤖 AI raw output:", text);

    const parsed = JSON.parse(text);
    console.log("✅ Parsed result:", parsed);

    res.json(parsed);

  } catch (err) {
    console.error("🔥 BACKEND ERROR:", err);
    res.status(500).json({
      error: "Analysis failed",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 CarScan backend running on port ${PORT}`);
});
