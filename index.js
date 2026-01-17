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
    const { image } = req.body;

    // 1️⃣ Girdi kontrolü
    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Image is missing or invalid",
      });
    }

    // 2️⃣ OpenAI request (GÜNCEL & DOĞRU FORMAT)
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "You are a car analysis AI. " +
                "Return ONLY valid JSON. No markdown. No explanations. " +
                "Analyze the car in the image and return exactly this JSON format: " +
                '{"brand":"string","model":"string","year":"string","price":{"min":number,"max":number},"ncap":{"adult":number,"child":number}}'
            },
            {
              type: "input_image",
              image_base64: image
            }
          ]
        }
      ]
    });

    // 3️⃣ OpenAI çıktısını güvenli alma
    const aiText = response.output_text;

    if (!aiText) {
      throw new Error("Empty AI response");
    }

    // 4️⃣ JSON parse
    const aiResult = JSON.parse(aiText);

    return res.json(aiResult);

  } catch (err) {
    console.error("❌ AI ERROR:", err);
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

