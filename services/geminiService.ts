
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
      contents: `STRICT RULE: Extract ONLY edible food or drink items. 
      CRITICAL: IGNORE non-food items like 'shelves', 'cabinets', 'bins', 'organizers', 'containers', 'furniture', or 'cleaning supplies'.
      If you see a storage bin, do NOT include it.
      Categories must be: Produce, Dairy & Eggs, Meat & Protein, Bakery & Grains, Pantry Staples, Frozen, Beverages, Other.
      Note: Milk, Cheese, Yogurt, Eggs must be 'Dairy & Eggs'.
      Note: Soda, Water, Tea, Coffee, Juice must be 'Beverages'.
      JSON format: [{name, quantity, category}].
      Items: "${text}"`,
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
    GOAL: Create EXACTLY ${count} unique recipes that look and sound DELICIOUS.
    STRICT INVENTORY RULE: Use ONLY these items: [${sanitizedPantry}].
    SERVINGS PER DISH: ${servings}.
    ADDITIONAL CONTEXT: ${options?.customRequest || 'None'}.
    DIETARY RESTRICTIONS: ${preferences.dietaryRestrictions.join(', ') || 'None'}.
    KOSHER RULES: ${preferences.isKosher ? 'Strictly Kosher (no meat/dairy mixing, no pork/shellfish)' : 'None'}.
    
    OUTPUT: A JSON array containing exactly ${count} recipe objects.
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
  } catch (error) { 
    console.error("Gemini Recipe Generation Error:", error);
    return []; 
  }
};

export const generateRecipeImage = async (recipe: Recipe, subscriptionTier: string = 'none'): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePrompt = `High-quality food photography of: ${recipe.title}. 
    STRICT INGREDIENT RULE: ONLY show ingredients from this list: ${recipe.ingredients.join(', ')}. 
    NO PHANTOM GARNISHES.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
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
          { text: `STRICT RULE: Extract ONLY food or drink items. 
          CRITICAL: IGNORE kitchen furniture, storage containers, bins, shelves, cabinets, or hardware.
          DO NOT include "Shelves", "Storage Bins", or "Cabinets" in the results.
          Identify Milk, Eggs, Cheese as 'Dairy & Eggs'.
          Identify Water, Soda, Juice as 'Beverages'.
          JSON format: { "items": [{ "name", "category", "quantity" }] }.
          Valid Categories: Produce, Dairy & Eggs, Meat & Protein, Bakery & Grains, Pantry Staples, Frozen, Beverages, Other.` }
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
      contents: `Suggest 5 restock items based on pantry. JSON format: [{name: string}].`,
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
      contents: `3-day meal plan. JSON format.`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { return []; }
};
