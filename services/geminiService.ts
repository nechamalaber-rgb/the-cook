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

const cleanAndParseJSON = (text: string | undefined) => {
  if (!text) throw new Error("No data returned from AI");
  let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleanText.indexOf('{');
  const firstBracket = cleanText.indexOf('[');
  if (firstBrace === -1 && firstBracket === -1) throw new Error("Invalid JSON format");
  const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
  cleanText = cleanText.substring(start);
  const lastBrace = cleanText.lastIndexOf('}');
  const lastBracket = cleanText.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  if (end !== -1) cleanText = cleanText.substring(0, end + 1);
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Failed:", cleanText);
    throw new Error("AI generated invalid JSON");
  }
};

export const generateRecipeImage = async (title: string, ingredients: string[] = [], servings: number = 2): Promise<string | undefined> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Appetizing high-quality photo of ${title}. 
      STYLE: Clean food photography, natural lighting, looking like a real meal a person would eat at home. 
      DETAILS: Clearly showing ${ingredients.slice(0, 2).join(" and ")}. Vibrant and fresh. No professional studio lighting, just beautiful home cooking style.`;
    
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

const CUISINES = [
  'Everyday Home Cooking', 
  'Classic Deli & Sandwiches', 
  'Simple American Comfort', 
  'Quick Family Dinners', 
  'Diner Style Classics', 
  'Easy Pasta & Bowls', 
  'Fresh & Healthy Basics', 
  'Traditional Sandwiches & Wraps', 
  'Backyard Grill Style', 
  'Homestyle Favorites'
];

export const generateSingleSmartRecipe = async (
  pantry: Ingredient[], 
  preferences: UserPreferences, 
  options: RecipeGenerationOptions,
  index: number = 0
): Promise<Recipe> => {
  const pantryList = pantry.map(i => `${i.name} (${i.quantity})`).join(', ');
  const forbiddenTitles = options.excludeTitles?.join(', ') || 'None';
  
  const focus = CUISINES[Math.floor(Math.random() * CUISINES.length)];

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const servings = options.servings || preferences.householdSize || 2;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ACT AS: A practical, efficient Home Cook who loves making "NORMAL" food.
        
        CURRENT FOCUS: ${focus}.
        
        STRICT RULES:
        1. NO OVER-ENGINEERING: Stop suggesting fancy restaurant food. Make normal food like a good sandwich, a classic pasta, a simple stir-fry, or a hearty salad.
        2. SANDWICH FRIENDLY: If the pantry has bread, buns, or wraps, ALWAYS consider making a great sandwich, melt, or toastie.
        3. REALISTIC TITLES: Use simple, plain English names (e.g., "Crispy Chicken Sandwich", "Beef & Onion Wrap", "Classic Egg Salad").
        4. FORBIDDEN TITLES: Avoid [${forbiddenTitles}]. 
        5. PANTRY: Use [${pantryList}].
        
        USER REQUEST: "${options.customRequest || 'Make me something normal and easy for a regular person to eat.'}"
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
        id: `recipe-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        title: r.title,
        description: r.description,
        timeMinutes: r.timeMinutes || 20,
        difficulty: r.difficulty || 'Easy',
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        missingIngredients: r.missingItems || [],
        calories: r.calories || 500,
        matchScore: r.matchScore || 0,
        tips: r.tips || [],
        servings: r.servings || servings,
        mealType: options.mealType as any || 'Lunch',
    };
  });
};

export const generatePantryAssetImage = async (itemName: string, quantity: string): Promise<string | undefined> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Realistic photo of ${itemName} for a grocery app. STYLE: Clean, natural lighting, white background.`;
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
      config: { responseMimeType: "application/json" }
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
      config: { responseMimeType: "application/json" }
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
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const processChefChatPlan = async (pantry: Ingredient[], query: string, prefs: UserPreferences) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a practical, structured shopping plan for: "${query}". 
      Keep it simple, "normal" food (e.g. sandwiches, basics).
      Pantry available: [${pantry.map(i=>i.name).join(', ')}].
      Return JSON object with 'plans' array.`,
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
                  concept: { type: Type.STRING },
                  description: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
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
    return parseInt(response.text?.match(/\d+/)?.[0] || '500');
  });
};

export const generateWeeklyPlan = async (pantry: Ingredient[], preferences: UserPreferences, startDate: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 7-day simple meal plan starting ${startDate}. Focus on normal, easy meals. Pantry: [${pantry.map(i=>i.name).join(',')}]`,
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
      contents: `Generate 7-day simple Kosher plan. Start=${startDate}. Normal food only, no fancy restaurant style.`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const chatWithChef = async (history: ChatMessage[], message: string, pantry: Ingredient[]) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = history.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    const prompt = `Assistant: You are a practical home cooking assistant. Pantry: ${pantry.map(i=>i.name).join(',')}.\n\n${context}\nUser: ${message}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "I am here to help you cook something simple and good.";
  });
};

export const analyzePantryStatus = async (pantry: Ingredient[]) => {
  return withRetry(async () => {
    if (pantry.length === 0) return { tip: "Your pantry is empty.", urgency: 'low' };
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `One simple cooking tip based on: ${pantry.map(i=>i.name).join(',')}`,
      config: { responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text);
  });
};