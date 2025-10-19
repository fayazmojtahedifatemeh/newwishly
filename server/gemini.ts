// Blueprint reference: javascript_gemini
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CategorySuggestion {
  suggestedCategory: string;
  confidence: number;
}

export async function suggestCategory(itemName: string, itemDescription?: string): Promise<CategorySuggestion> {
  try {
    const prompt = itemDescription
      ? `${itemName}\n\n${itemDescription}`
      : itemName;

    const systemPrompt = `You are an expert at categorizing shopping items.
Analyze the product name and description, then suggest ONE category from this list:
- Dresses
- Skirts
- Tops
- Makeup
- Perfumes
- Shoes
- Bags
- Jewelry
- Electronics
- Home
- Books
- Toys

Respond with JSON in this format:
{
  "suggestedCategory": "category name",
  "confidence": 0-1
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            suggestedCategory: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["suggestedCategory", "confidence"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    }

    // Fallback
    return { suggestedCategory: "All Items", confidence: 0 };
  } catch (error) {
    console.error("Failed to suggest category:", error);
    return { suggestedCategory: "All Items", confidence: 0 };
  }
}

export async function searchByImage(imageBase64: string): Promise<{ results: any[] }> {
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg",
          },
        },
        "Analyze this product image and extract product information.",
      ],
    });

    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return {
        results: [{
          name: data.productName || "Unknown Product",
          category: data.category || "General",
          estimatedPrice: data.priceRange || "Unknown",
          features: data.features || [],
        }],
      };
    }

    return { results: [] };
  } catch (error) {
    console.error("Failed to search by image:", error);
    return { results: [] };
  }
}

export async function findSimilar(itemName: string, itemImage?: string): Promise<{ results: any[] }> {
  try {
    // In a real implementation, this would use Google Vision API
    // For now, we'll use Gemini to suggest similar product types
    const systemPrompt = `Given a product name, suggest 3-5 similar or related products.
Return JSON array of similar products:
{
  "similar": [
    {"name": "product name", "reason": "why it's similar"},
    ...
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: `Find similar products to: ${itemName}`,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return {
        results: data.similar || [],
      };
    }

    return { results: [] };
  } catch (error) {
    console.error("Failed to find similar:", error);
    return { results: [] };
  }
}
