import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

if (!process.env.GEMINI_API_KEY) {
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error("GEMINI_API_KEY secret is not set in Replit!");
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
}

export interface CategorySuggestion {
  suggestedCategory: string;
  confidence: number;
}

export async function suggestCategory(
  itemName: string,
  itemDescription?: string,
): Promise<CategorySuggestion> {
  try {
    const prompt = itemDescription
      ? `${itemName}\n\n${itemDescription}`
      : itemName;

    const systemPrompt = `You are an expert at categorizing shopping items.
Analyze the product name and description, then suggest ONE category from this list:
- All items
- Skirts
- Dresses
- Coats
- Shoes
- Electronics
- Food
- House things
- Extra stuff
- Jewelry
- Tops
- Nails
- Makeup
- Pants
- Bags
- Blazers
- Gym
- Sweaters & Cardigans
- Accessories
- Perfumes
- Shirts and Blouses

Respond with JSON in this format:
{
  "suggestedCategory": "category name",
  "confidence": 0-1
}`;

    // ✅ FIXED: Use stable alias
    const model = ai.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const rawJson = result.response.text();

    if (rawJson) {
      const cleanJson = rawJson.replace(/```json/g, "").replace(/```/g, "");
      return JSON.parse(cleanJson);
    }

    return { suggestedCategory: "All items", confidence: 0 };
  } catch (error) {
    console.error("Failed to suggest category:", error);
    return { suggestedCategory: "All items", confidence: 0 };
  }
}

export async function searchByImage(
  imageBase64: string,
): Promise<{ results: any[] }> {
  console.log("Running Gemini image analysis. This is NOT Google Lens search.");
  try {
    const systemPrompt = `You are helping find products from an image.
Analyze this product image and extract:
- Product name
- Category
- Likely price range
- Key features or colors

Respond with JSON format:
{
  "productName": "name",
  "category": "category",
  "priceRange": "range",
  "features": ["feature1", "feature2"]
}`;

    // ✅ FIXED: Use stable vision alias
    const model = ai.getGenerativeModel({
      model: "gemini-pro-vision",
      systemInstruction: systemPrompt,
    });

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([
      "Analyze this product image and extract product information.",
      imagePart,
    ]);
    const rawJson = result.response.text();

    if (rawJson) {
      const cleanJson = rawJson.replace(/```json/g, "").replace(/```/g, "");
      const data = JSON.parse(cleanJson);
      return {
        results: [
          {
            name: data.productName || "Unknown Product",
            category: data.category || "General",
            estimatedPrice: data.priceRange || "Unknown",
            features: data.features || [],
          },
        ],
      };
    }

    return { results: [] };
  } catch (error) {
    console.error("Failed to search by image with Gemini:", error);
    throw new Error("Failed to analyze image with Gemini.");
  }
}

export async function findSimilar(
  itemName: string,
): Promise<{ results: any[] }> {
  try {
    const systemPrompt = `Given a product name, suggest 3-5 similar or related products.
Return JSON array of similar products:
{
  "similar": [
    {"name": "product name", "reason": "why it's similar"},
    ...
  ]
}`;

    // ✅ FIXED: Use stable alias
    const model = ai.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(
      `Find similar products to: ${itemName}`,
    );
    const rawJson = result.response.text();

    if (rawJson) {
      const cleanJson = rawJson.replace(/```json/g, "").replace(/```/g, "");
      const data = JSON.parse(cleanJson);
      return {
        results: data.similar || [],
      };
    }
    return { results: [] };
  } catch (error) {
    console.error("Failed to find similar with Gemini:", error);
    return { results: [] };
  }
}
