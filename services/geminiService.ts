
import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, UserPreferences, Recipe, RecipeGenerationOptions, ChatMessage, MealLog, Category, GroundedSource } from "../types";

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  let cleaned = str.replace(/```json\n?|```/g, '').trim();
  const firstOpen = cleaned.search(/[\{\[]/);
  const lastClose = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      return cleaned.substring(firstOpen, lastClose + 1);
  }
  return cleaned;
};

const sanitizeInventory = (items: Ingredient[]): string => {
  return items
    .map(i => `${i.name} (${i.quantity})`)
    .join(', ');
};

export const organizePastedText = async (text: string): Promise<{ name: string; quantity: string; category: Category }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Structure this list. JSON format: [{name, quantity, category}]. Items: "${text}"`,
      config: { 
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { return []; }
};

export const generateSmartRecipes = async (pantryItems: Ingredient[], preferences: UserPreferences, options?: RecipeGenerationOptions, savedRecipes: Recipe[] = []): Promise<Recipe[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sanitizedPantry = sanitizeInventory(pantryItems);
  
  const servings = options?.servings || preferences.householdSize || 2;
  const count = options?.recipeCount || preferences.generationsCount || 3;
  
  const instructions = `
    ROLE: Master of Classic & Appetizing Cuisine.
    
    GOAL: Create meals that look and sound DELICIOUS, HEARTY, and REAL.
    STRICT RULE: Avoid weird culinary experiments. Do NOT suggest "deconstructed" versions, "custards," "souffles" (unless it's a traditional souffle), or "gratins" made of random things.
    
    STYLE: Focus on "Bistro Classics" and "Expert Home Cooking." Make the user WANT to eat this food. Use recognizable names. 
    Examples: "Pan-Seared Chicken with Lemon-Wilted Spinach" (GOOD) vs "Chicken and Spinach Essence Gratin" (BAD).
    
    STRICT INVENTORY RULE: 
    - Use ONLY these items: [${sanitizedPantry}].
    - ONLY STAPLES ALLOWED: Salt, Black Pepper, Water, Vegetable Oil.
    - If Butter, Garlic, or Onion are not in the list, DO NOT use them.
    - NO PHANTOM GARNISHES.
    
    TASK: Generate ${count} satisfying, classic recipes for ${servings} people.
    
    OUTPUT: JSON array of recipe objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: instructions,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              timeMinutes: { type: Type.INTEGER },
              difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              calories: { type: Type.INTEGER },
              matchScore: { type: Type.INTEGER }
            },
            required: ['id', 'title', 'timeMinutes', 'ingredients', 'instructions', 'matchScore', 'missingIngredients', 'calories']
          }
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { return []; }
};

export const generateRecipeImage = async (recipe: Recipe, subscriptionTier: string = 'none'): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const ingredientsUsed = recipe.ingredients.join(', ');
    
    const imagePrompt = `Extremely appetizing, high-quality, warm food photography of: ${recipe.title}. 
    VISUAL STYLE: Rustic, inviting, and mouth-watering. Vibrant natural colors. 
    LIGHTING: Warm, soft natural light (like a high-end bistro window). 
    PLATING: Clean but hearty presentation. The food must look freshly cooked and delicious. 
    STRICT INGREDIENT RULE: ONLY show ingredients from this list: ${ingredientsUsed}. 
    NO PHANTOM GARNISHES. No parsley if not in list. 
    AVOID: Grayish colors, messy plating, weird textures, or unappetizing "fine dining" smears.`;
    
    const model = 'gemini-2.5-flash-image';

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: imagePrompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        for (const candidate of response.candidates || []) {
            if (candidate.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) return part.inlineData.data;
                }
            }
        }
        return undefined;
    } catch (error) { return undefined; }
};

export const estimateMealCalories = async (mealDescription: string): Promise<number> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Calories for: "${mealDescription}". Return JSON {calories: number}.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    const data = JSON.parse(cleanJsonString(response.text || "{}"));
    return data.calories || 0;
  } catch (error) { return 0; }
};

export const culinarySearch = async (query: string): Promise<{ text: string; sources: GroundedSource[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: query,
            config: { 
              tools: [{ googleSearch: {} }],
              thinkingConfig: { thinkingBudget: 0 }
            }
        });
        const sources: GroundedSource[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web) sources.push({ uri: chunk.web.uri, title: chunk.web.title });
            });
        }
        return { text: response.text || "", sources };
    } catch (error) { return { text: "Search failed.", sources: [] }; }
};

export const parseReceiptOrImage = async (base64Image: string): Promise<{ items: { name: string; category: string; quantity: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: `Extract items. JSON format: { "items": [{ "name", "category", "quantity" }] }.` }
        ],
      },
      config: { 
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (error) { return { items: [] }; }
};

export const parseRecipeFromImage = async (base64Image: string): Promise<Recipe | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
                    { text: 'Extract recipe. JSON format.' }
                ]
            },
            config: { 
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        const data = JSON.parse(cleanJsonString(response.text || "{}"));
        if (!data || !data.title) return null;
        
        return {
            id: Date.now().toString(),
            title: data.title,
            description: data.description || '',
            timeMinutes: data.timeMinutes || 30,
            difficulty: data.difficulty || 'Medium',
            ingredients: data.ingredients || [],
            instructions: data.instructions || [],
            missingIngredients: [],
            matchScore: 100,
            calories: data.calories || 0,
            isUserCreated: true
        };
    } catch (error) { return null; }
};

export const chatWithChef = async (messages: ChatMessage[], userInput: string, pantryItems: Ingredient[], activeRecipe?: Recipe | null): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: userInput }] }],
      config: { 
        systemInstruction: "You are a friendly Master of Classic Cuisine. Give practical, delicious culinary advice. Be concise and fast.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "";
  } catch (error) { return "Chef is unavailable."; }
};

export const generateShoppingSuggestions = async (pantryItems: Ingredient[], recentMealTitles: string[]): Promise<{ name: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 5 restock items.`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { return []; }
};

export const generateWeeklyPlan = async (pantryItems: Ingredient[], preferences: UserPreferences, startDate: string): Promise<{ date: string; mealType: string; recipeTitle: string; calories: number }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `3-day meal plan.`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { return []; }
};
