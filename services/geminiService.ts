
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
 * Generates a High-End Studio photo of a finished dish.
 * UPDATED: Extreme negative constraints to prevent hallucinated tomatoes/herbs.
 */
export const generateRecipeImage = async (title: string, ingredients: string[] = []): Promise<string | undefined> => {
  return withRetry(async () => {
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Explicitly check for absence of tomatoes/herbs to create negative prompt
    const hasTomatoes = ingredients.some(i => i.toLowerCase().includes('tomato'));
    const hasHerbs = ingredients.some(i => i.toLowerCase().includes('basil') || i.toLowerCase().includes('herb') || i.toLowerCase().includes('parsley'));
    
    const available = ingredients.join(", ");
    
    // Hard negative constraints
    let prompt = `Professional food photography of ${title}. Plated on dark matte ceramic. 8k, cinematic lighting.
      STRICT VISUAL RULES:
      1. ONLY show ingredients listed here: [${available}].
      2. If dough and cheese are the only items, show ONLY golden bread and melted cheese.
      ${!hasTomatoes ? "3. FORBIDDEN: NO tomatoes, NO red sauce splashes, NO cherry tomatoes." : ""}
      ${!hasHerbs ? "4. FORBIDDEN: NO green garnishes, NO basil leaves, NO chopped herbs." : ""}
      Michelin star presentation of ONLY what the user has. No artistic additions.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
        }
      });

      if (!response.candidates?.[0]) return undefined;

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data; 
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("Requested entity was not found")) {
        if (window.aistudio) await window.aistudio.openSelectKey();
      }
      throw err;
    }
    return undefined;
  }).catch(() => undefined);
};

/**
 * Generates a single smart recipe using Gemini 3.
 * UPDATED: Forcefully default to 2 people as requested and ensure Foundational logic.
 */
export const generateSingleSmartRecipe = async (
  pantry: Ingredient[], 
  preferences: UserPreferences, 
  options: RecipeGenerationOptions,
  index: number = 0
): Promise<Recipe> => {
  const pantryList = pantry.map(i => `${i.name} (${i.quantity})`).join(', ');
  const isFirst = index === 0;
  // USER REQUESTED 2 PEOPLE:
  const servings = 2; 

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ACT AS: A Michelin-star chef creating recipes for exactly ${servings} people.
        PANTRY: [${pantryList}]
        USER REQUEST: "${options.customRequest || 'Make something delicious'}"
        
        LOGIC MODE: ${isFirst ? 'FOUNDATIONAL (If they have dough/sauce/cheese, the result MUST be PIZZA first. No variants allowed for slot 1.)' : 'CREATIVE (Unique variation)'}
        
        STRICT RULES:
        1. NO HALLUCINATIONS: Do not assume eggs, milk, tomatoes, or oil exist if not in pantry.
        2. MISSING ITEMS: If the recipe needs something not in pantry, it MUST go in 'missingItems'.
        3. SCALE: Scale ingredient quantities exactly for ${servings} persons.
        4. ACCURACY: If the user only has dough and cheese, slots 1-4 should all be bread/cheese variations.
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
          required: ['title', 'ingredients', 'instructions', 'servings', 'missingItems', 'matchScore', 'calories']
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) throw new Error("Synthesis failed");
    const r = JSON.parse(textOutput);
    
    return {
        id: `recipe-${Date.now()}-${index}`,
        title: r.title || 'Untitled',
        description: r.description || '',
        timeMinutes: r.timeMinutes || 30,
        difficulty: r.difficulty || 'Easy',
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        missingIngredients: r.missingItems || [],
        calories: r.calories || 500,
        matchScore: r.matchScore || 0,
        tips: r.tips || [],
        servings: servings, // Force 2 as requested
        mealType: options.mealType as any || 'Dinner',
    };
  });
};

export const generatePantryAssetImage = async (itemName: string, quantity: string): Promise<string | undefined> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Professional food photography of ${itemName}, isolated on dark surface, studio lighting.`;
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

export const generateSmartRecipeBatch = async (pantry: Ingredient[], prefs: UserPreferences, opts: RecipeGenerationOptions): Promise<Recipe[]> => {
  const recipes: Recipe[] = [];
  const used: string[] = [];
  for (let i = 0; i < (opts.recipeCount || 4); i++) {
    const r = await generateSingleSmartRecipe(pantry, prefs, { ...opts, excludeTitles: used }, i);
    recipes.push(r);
    used.push(r.title);
  }
  return recipes;
};

export const parseReceiptOrImage = async (data: string, mime: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ inlineData: { data, mimeType: mime } }, { text: "List grocery items found." }] },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const organizePastedText = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Organize: ${text}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const processChefChatPlan = async (pantry: Ingredient[], query: string, prefs: UserPreferences) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Plan for: ${query}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const estimateMealCalories = async (name: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Calories for ${name}? Number only.`,
  });
  return parseInt(response.text?.match(/\d+/)?.[0] || '500');
};

export const generateWeeklyPlan = async (pantry: Ingredient[], prefs: UserPreferences, start: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `7 day plan from ${start}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const generateKosherWeeklyPlan = async (pantry: Ingredient[], prefs: UserPreferences, start: string, config: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Kosher plan from ${start}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const chatWithChef = async (history: ChatMessage[], msg: string, pantry: Ingredient[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: msg,
  });
  return response.text;
};

export const analyzePantryStatus = async (pantry: Ingredient[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Analyze pantry health.",
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const findNearbyStores = async () => [];

export const parsePastOrderText = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extract order: ${text}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};
