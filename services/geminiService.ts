import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, UserPreferences, Recipe, RecipeGenerationOptions, Category, GroundedSource, ChatMessage } from "../types";

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

export const generateSmartRecipes = async (pantryItems: Ingredient[], preferences: UserPreferences, options?: RecipeGenerationOptions, savedRecipes: Recipe[] = []): Promise<Recipe[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sanitizedPantry = sanitizeInventory(pantryItems);
  
  const servings = options?.servings || preferences.householdSize || 2;
  const count = options?.recipeCount || preferences.generationsCount || 3;
  const mealType = options?.mealType || 'Any';
  const maxTime = options?.maxTime || 'Any';
  const complexity = options?.complexity || (preferences.skillLevel === 'Advanced' ? 'Gourmet' : 'Simple');
  const excluded = options?.excludedIngredients?.join(', ') || 'None';
  const custom = options?.customRequest || 'None';

  const instructions = `
    ROLE: You are the Prepzu Studio Engine.
    
    STRICT MANDATE: You MUST strictly adhere to the user's selected parameters.
    - If MEAL TYPE is "Breakfast", ONLY return breakfast recipes.
    - If MEAL TYPE is "Dinner", ONLY return dinner recipes.
    - If MAX TIME is specified (e.g., 30), do NOT exceed it.
    - DIETARY: ${preferences.dietaryRestrictions.join(', ') || 'None'}.
    - ALLERGIES: ${preferences.allergies.join(', ') || 'None'} (NEVER include).
    - APPLIANCES: ${preferences.appliances.join(', ') || 'Stove, Oven'}.
    - INVENTORY: [${sanitizedPantry}].

    REALISM & ANTI-GEOMETRIC MANDATE (CRITICAL):
    1. REAL HOME FOOD ONLY: ABSOLUTELY NO CUBES, no geometric food, no molecular gastronomy, no experimental futuristic concepts. 
    2. RECOGNIZABLE DISHES: Generate dishes a normal person cooks in a standard kitchen (stews, pastas, roasts, salads, stir-frys, tacos, soups).
    3. TRADITIONAL PRESENTATION: No stacked cubes or spheres. Presentation must look like a standard home meal.
    4. PRECISION STEPS: Every instruction step must be detailed but concise. 
    5. TECHNICAL SPECIFICS: Mention heat levels (e.g., "Medium heat") and visual cues (e.g., "until golden brown").

    TASK: Generate ${count} HIGHLY REALISTIC recipes scaled for ${servings} people.
    
    OUTPUT: JSON array of recipe objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: instructions,
      config: {
        responseMimeType: "application/json",
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
              protein: { type: Type.STRING },
              matchScore: { type: Type.INTEGER },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['id', 'title', 'timeMinutes', 'ingredients', 'instructions', 'matchScore', 'missingIngredients', 'calories', 'protein', 'description']
          }
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { 
    console.error("Studio Engine Error:", error);
    return []; 
  }
};

export const generateRecipeImage = async (recipe: Recipe): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const imagePrompt = `High-quality, professional photography of a real, traditional home-cooked dish: ${recipe.title}. 
    STRICT FOCUS: Only the food on a plain ceramic plate or bowl.
    ABSOLUTELY NO CUBES. NO GEOMETRIC SHAPES. NO GLOWING ELEMENTS. NO SCI-FI.
    STRICT FORBIDDEN: 
    - NO futuristic elements, NO molecular gastronomy.
    - NO extra items: NO silverware, NO glasses, NO napkins, NO hands, NO people.
    - NO text, logos, or synthetic overlays.
    AESTHETIC: Natural warm kitchen lighting, rustic plating, high contrast, shallow depth of field. Authentically appetizing. 8k resolution.`;
    
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
      contents: `Estimate calories for: "${mealDescription}". Return JSON {calories: number}.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || "{}")).calories || 0;
  } catch (error) { return 0; }
};

export const organizePastedText = async (text: string): Promise<{ name: string; quantity: string; category: Category }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Convert text to JSON inventory: [{name, quantity, category}]. Text: "${text}"`,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { return []; }
};

export const culinarySearch = async (query: string): Promise<{ text: string; sources: GroundedSource[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: query,
            config: { tools: [{ googleSearch: {} }] }
        });
        const sources: GroundedSource[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web) sources.push({ uri: chunk.web.uri, title: chunk.web.title });
            });
        }
        return { text: response.text || "", sources };
    } catch (error) { return { text: "Search currently offline.", sources: [] }; }
};

export const parseReceiptOrImage = async (base64Image: string): Promise<{ items: { name: string; category: string; quantity: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: `Extract food inventory from this image. JSON: { "items": [{ "name", "category", "quantity" }] }.` }
        ],
      },
      config: { responseMimeType: 'application/json' }
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
                    { text: 'Extract technical recipe from this image. Return standard JSON format. Ensure no geometric/scifi concepts.' }
                ]
            },
            config: { responseMimeType: 'application/json' }
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
            calories: data.calories || 450,
            protein: data.protein || '20g',
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
        systemInstruction: "You are the Prepzu Master Chef. Provide precise, actionable advice based strictly on home cooking reality. ABSOLUTELY NO molecular gastronomy, futuristic talk, or geometric/cube food shapes. Act like a real chef in a real kitchen."
      }
    });
    return response.text || "";
  } catch (error) { return "Chef unavailable."; }
};

export const generateShoppingSuggestions = async (pantryItems: Ingredient[], historyTitles: string[]): Promise<{ name: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sanitizedPantry = pantryItems.map(i => i.name).join(', ');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on pantry [${sanitizedPantry}] and recent meals [${historyTitles.join(', ')}], suggest 5 buy items for real home cooking. JSON [{name: string}].`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { return []; }
};

export const generateWeeklyPlan = async (pantryItems: Ingredient[], preferences: UserPreferences, startDate: string): Promise<{ date: string; mealType: string; recipeTitle: string; calories: number }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sanitizedPantry = pantryItems.map(i => `${i.name} (${i.quantity})`).join(', ');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `7-day meal plan from ${startDate}. Inventory: [${sanitizedPantry}]. JSON: [{date, mealType, recipeTitle, calories}]. Use realistic home recipes only. No cubes or futuristic food.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { return []; }
};