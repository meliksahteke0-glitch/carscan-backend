const express = require("express");
const cors = require("cors");
const multer = require("multer");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const upload = multer();

app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file missing" });
    }

    // 1️⃣ File → base64 (backend yapıyor)
    const base64Image = req.file.buffer.toString("base64");

    // 2️⃣ OpenAI Vision çağrısı (eski çalışan mantık)
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

Analyze the car image and return EXACTLY this JSON:

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

    const resultText = response.output_text;
    const resultJson = JSON.parse(resultText);

    return res.json(resultJson);

  } catch (err) {
    console.error("❌ AI ERROR:", err);
    return res.status(500).json({
      error: "Analysis failed",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 CarScan backend running on port ${PORT}`);
});
