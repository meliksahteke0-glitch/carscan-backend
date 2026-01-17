const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    // 1️⃣ Image indir
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // 2️⃣ Base64 DATA URL
    const base64Image =
      "data:image/jpeg;base64," + buffer.toString("base64");

    // 3️⃣ OpenAI
    const aiResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are a car analysis AI.
Look at the image and return ONLY valid JSON.

Format:
{
  "brand": "",
  "model": "",
  "year": "",
  "price": { "min": 0, "max": 0 },
  "ncap": { "adult": 0, "child": 0 }
}
              `,
            },
            {
              type: "input_image",
              image_url: base64Image,
            },
          ],
        },
      ],
    });

    const text = aiResponse.output_text;
    const json = JSON.parse(text);

    return res.json(json);
  } catch (err) {
    console.error("❌ analyze error:", err);
    return res.status(500).json({ error: "analysis failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);

