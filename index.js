const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", async (req, res) => {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a car analysis AI.

Assume the user sent an image of a car.
Return ONLY valid JSON.
No markdown.
No explanations.

Return this exact format:

{
  "brand": "Toyota",
  "model": "Corolla",
  "year": "2020",
  "price": {
    "min": 18000,
    "max": 24000
  },
  "ncap": {
    "adult": 90,
    "child": 85
  }
}
      `,
    });

    const aiText = response.output_text;
    const aiResult = JSON.parse(aiText);

    return res.json(aiResult);
  } catch (err) {
    console.error("❌ ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 Backend running on port ${PORT}`);
});
