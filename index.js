const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const multer = require("multer");
require("dotenv").config();

const app = express();

app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image missing" });
    }

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
No explanations.

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

    const result = JSON.parse(response.output_text);
    res.json(result);

  } catch (err) {
    console.error("❌ AI ERROR:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 CarScan backend running on port ${PORT}`);
});
