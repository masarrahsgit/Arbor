import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return Response.json({ error: "Missing image data" }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
      `You are a plant identification expert. Identify the plant in this image.
      
Return ONLY a raw JSON object. No markdown. No code blocks. No backticks. No explanation. Just the JSON.

{
  "name": "common name here",
  "scientificName": "scientific name here",
  "confidence": 0.95,
  "description": "one sentence description",
  "careInstructions": {
    "waterFrequency": 7,
    "light": "Bright indirect light",
    "temperature": "65-85°F (18-29°C)"
  }
}`,
    ]);

    const rawContent = result.response.text();

    // Aggressively clean the response
    const cleaned = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/^\s*[\r\n]/gm, "")
      .trim();

    // Find the JSON object — extract anything between first { and last }
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No JSON found in response:", rawContent);
      return Response.json(
        { error: "No valid JSON in response" },
        { status: 500 },
      );
    }

    const jsonString = cleaned.substring(jsonStart, jsonEnd + 1);
    const plant = JSON.parse(jsonString);

    // Validate required fields exist
    if (!plant.name || !plant.scientificName || !plant.careInstructions) {
      return Response.json({ error: "Incomplete plant data" }, { status: 500 });
    }

    return Response.json({ success: true, plant });
  } catch (error) {
    console.error("Plant identification error:", error);
    return Response.json(
      { error: "Failed to identify plant", details: String(error) },
      { status: 500 },
    );
  }
}
