
import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, UserPreferences, Recipe, RecipeGenerationOptions, ChatMessage } from "../types";

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Helper to safely parse JSON from LLM output, handling Markdown code blocks
 */
const cleanAndParseJSON = (text: string | undefined) => {
  if (!text) throw new Error("No data returned from AI");
  
  // Remove markdown code blocks (```json ... ```)
  let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  // Attempt to find the first '{' or '[' if there is leading text
  const firstBrace = cleanText.indexOf('{');
  const firstBracket = cleanText.indexOf('[');
  
  if (firstBrace === -1 && firstBracket === -1) {
      throw new Error("Invalid JSON format");
  }

  // Very basic extraction if lead text exists
  const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
  cleanText = cleanText.substring(start);
  
  // Find the last '}' or ']'
  const lastBrace = cleanText.lastIndexOf('}');
  const lastBracket = cleanText.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  
  if (end !== -1) {
      cleanText = cleanText.substring(0, end + 1);
  }

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Failed:", cleanText);
    throw new Error("AI generated invalid JSON");
  }
};

/**
 * GENERATES PHOTOREALISTIC RECIPE PREVIEWS
 * Switched to gemini-2.5-flash-image for high quality generation.
 */
export const generateRecipeImage = async (title: string, ingredients: string[] = [], servings: number = 2): Promise<string | undefined> => {
  return withRetry(async () => {
    // Creating a new instance right before the call to ensure fresh API key context
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // ENFORCING PHOTOREALISM
    const prompt = `Professional gourmet food photography of ${title}. 
      STYLE: High-resolution 8k, Michelin-star plating, studio lighting, shallow depth of field (bokeh), vibrant and appetizing.
      COMPOSITION: Centered on a beautiful ceramic plate or rustic wooden board. 
      DETAILS: Clearly showing textures of ${ingredients.slice(0, 3).join(", ")}. Realistic steam or freshness droplets if applicable.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });
      
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) return part.inlineData.data;
        }
      }
    } catch (err: any) {
      console.warn("Image synthesis failed", err);
    }
    return undefined;
  }).catch(() => undefined);
};

export const generateSingleSmartRecipe = async (
  pantry: Ingredient[], 
  preferences: UserPreferences, 
  options: RecipeGenerationOptions,
  index: number = 0
): Promise<Recipe> => {
  const pantryList = pantry.map(i => `${i.name} (${i.quantity})`).join(', ');

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const servings = options.servings || preferences.householdSize || 2;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ACT AS: A master chef who precisely follows user profile constraints.
        
        USER PROFILE:
        - DIET: ${preferences.dietaryRestrictions.join(', ') || 'None'}
        - ALLERGIES: ${preferences.allergies.join(', ') || 'None'}
        - KOSHER: ${preferences.isKosher ? 'YES' : 'No'}
        - SKILL LEVEL: ${preferences.skillLevel}
        - BUDGET: ${preferences.budget}
        - SPICE TOLERANCE: ${preferences.spiceLevel}
        - APPLIANCES: [${preferences.appliances.join(', ') || 'Stove only'}]
        - BLACKLIST: [${preferences.blacklist.join(', ') || 'None'}]
        
        PANTRY: [${pantryList}]
        REQUEST: "${options.customRequest || 'Make something amazing'}"
        
        STRICT LOGIC:
        1. APPLIANCES: ONLY suggest methods using available hardware.
        2. BUDGET: If Thrifty, maximize pantry use. 
        3. SPICE: Respect "${preferences.spiceLevel}" exactly.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            timeMinutes: { type: Type.INTEGER },
            difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            calories: { type: Type.INTEGER },
            servings: { type: Type.INTEGER },
            missingItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchScore: { type: Type.INTEGER }
          },
          required: ['title', 'ingredients', 'instructions', 'servings', 'missingItems', 'matchScore']
        },
      },
    });

    const r = cleanAndParseJSON(response.text);
    
    return {
        id: `recipe-${Date.now()}-${index}`,
        title: r.title,
        description: r.description,
        timeMinutes: r.timeMinutes || 30,
        difficulty: r.difficulty || 'Medium',
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        missingIngredients: r.missingItems || [],
        calories: r.calories || 450,
        matchScore: r.matchScore || 0,
        tips: r.tips || [],
        servings: r.servings || servings,
        mealType: options.mealType as any || 'Dinner',
    };
  });
};

/**
 * GENERATES REALISTIC PANTRY ASSETS
 * Aligned with the request for "real images".
 */
export const generatePantryAssetImage = async (itemName: string, quantity: string): Promise<string | undefined> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `High-quality commercial product photography of raw ${itemName}. 
      STYLE: Realistic, 4k, studio lighting on white or neutral background. 
      DETAILS: Fresh, appetizing, high detail. No text overlay.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  }).catch(() => undefined);
};

export const parseReceiptOrImage = async (base64Data: string, mimeType: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Extract items from this receipt as JSON object with 'items' array of {name, quantity}." }
        ]
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING }
                },
                required: ['name']
              }
            }
          },
          required: ['items']
        }
      }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const analyzeMealFromImage = async (base64Data: string, mimeType: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze food image. JSON keys: name, calories, mealType." }
        ]
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.INTEGER },
            mealType: { type: Type.STRING }
          },
          required: ['name', 'calories', 'mealType']
        }
      }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const organizePastedText = async (text: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `JSON array of {name, quantity, category}: ${text}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ['name']
          }
        }
      }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const processChefChatPlan = async (pantry: Ingredient[], query: string, prefs: UserPreferences) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a structured shopping plan based on this request: "${query}".
      
      CONTEXT:
      - Pantry Available: [${pantry.map(i=>i.name).join(', ')}] (Try to use these)
      - User Skill: ${prefs.skillLevel}
      - Budget: ${prefs.budget}
      - Kosher: ${prefs.isKosher ? 'YES (Strict)' : 'No'}
      - Diet: ${prefs.dietaryRestrictions.join(', ') || 'None'}
      
      INSTRUCTIONS:
      1. If the user asks for a specific number of meals (e.g. "5 dinners"), generate EXACTLY that many distinct concepts in the 'plans' array.
      2. For 'items' (shopping list), estimate realistic prices (e.g. 5.00, 12.50).
      3. Ensure 'fullRecipe' has actual steps.
      `,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plans: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING, description: "Name of the meal/dish" },
                  description: { type: Type.STRING, description: "Why this fits the request" },
                  items: {
                    type: Type.ARRAY,
                    description: "List of ingredients needed to buy",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        category: { type: Type.STRING }
                      },
                      required: ['name', 'price']
                    }
                  },
                  fullRecipe: {
                    type: Type.OBJECT,
                    properties: {
                      ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                      instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['ingredients', 'instructions']
                  }
                },
                required: ['concept', 'description', 'items', 'fullRecipe']
              }
            }
          },
          required: ['plans']
        }
      }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const estimateMealCalories = async (mealName: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Estimate calories for: ${mealName}. Return only number.`,
    });
    return parseInt(response.text?.match(/\d+/)?.[0] || '450');
  });
};

export const generateWeeklyPlan = async (pantry: Ingredient[], preferences: UserPreferences, startDate: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 7-day dinner plan starting ${startDate} using pantry [${pantry.map(i=>i.name).join(',')}] and other needed ingredients. Budget: ${preferences.budget}.`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const generateKosherWeeklyPlan = async (pantry: Ingredient[], preferences: UserPreferences, startDate: string, config: any) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 7-day Kosher plan. Start=${startDate}. Pantry: [${pantry.map(i=>i.name).join(',')}]`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const chatWithChef = async (history: ChatMessage[], message: string, pantry: Ingredient[]) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = history.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    const prompt = `Assistant: You are a culinary studio guide. Pantry: ${pantry.map(i=>i.name).join(',')}.\n\n${context}\nUser: ${message}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "I am currently unable to respond.";
  });
};

export const analyzePantryStatus = async (pantry: Ingredient[]) => {
  return withRetry(async () => {
    if (pantry.length === 0) return { tip: "Pantry empty.", urgency: 'low' };
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `One sentence pantry tip and urgency (low/medium/high): ${pantry.map(i=>i.name).join(',')}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tip: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
          },
          required: ['tip', 'urgency']
        }
      }
    });
    return cleanAndParseJSON(response.text);
  });
};
