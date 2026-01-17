const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", async (req, res) => {
  try {
    const { image_base64 } = req.body;

    if (!image_base64 || typeof image_base64 !== "string") {
      return res.status(400).json({ error: "image_base64 missing" });
    }

    // 🚨 EN KRİTİK SATIR
    const imageDataUrl = `data:image/jpeg;base64,${image_base64}`;

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
No markdown. No explanations.

Format:
{
  "brand": "string",
  "model": "string",
  "year": "string",
  "price": { "min": number, "max": number },
  "ncap": { "adult": number, "child": number }
}
              `,
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
            },
          ],
        },
      ],
    });

    const aiText = response.output_text;
    const aiResult = JSON.parse(aiText);

    return res.json(aiResult);
  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 Backend running on port ${PORT}`);
});
