
import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, UserPreferences, Recipe, RecipeGenerationOptions, Substitution, ChatMessage } from "../types";

const cleanJsonString = (str: string) => {
  const match = str.match(/[\{\[][\s\S]*[\}\]]/);
  return match ? match[0] : str.replace(/```json\n?|```/g, '').trim();
};

export const parseReceiptOrImage = async (base64Image: string): Promise<{ items: { name: string; category: string; quantity: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: `List items from image. Output JSON format: { "items": [{ "name", "category", "quantity" }] }. Categories MUST be one of: 'Produce', 'Dairy & Eggs', 'Meat & Protein', 'Pantry Staples', 'Frozen', 'Beverages', 'Other'.` }
        ],
      },
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(cleanJsonString(response.text || "{}"));
    return parsed.items && Array.isArray(parsed.items) ? parsed : { items: [] };
  } catch (error) { 
    return { items: [] }; 
  }
};

export const parseTextList = async (text: string): Promise<{ items: { name: string; category: string; quantity: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Parse this shopping list into JSON: "${text}". Output: { "items": [{ "name", "category", "quantity" }] }.`,
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(cleanJsonString(response.text || "{}"));
    return parsed.items && Array.isArray(parsed.items) ? parsed : { items: [] };
  } catch (error) {
    return { items: [] };
  }
};

export const parseRecipeFromImage = async (base64Image: string): Promise<Partial<Recipe> | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: `Extract the recipe from this image. Output JSON: { "title": string, "description": string, "timeMinutes": number, "ingredients": string[], "instructions": string[] }.` }
        ],
      },
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (error) {
    return null;
  }
};

export const generateSmartRecipes = async (pantryItems: Ingredient[], preferences: UserPreferences, options?: RecipeGenerationOptions): Promise<Recipe[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let strictnessInstruction = "";
  if (preferences.strictness === 'Strict') {
      strictnessInstruction = "CRITICAL: ONLY use ingredients from the pantry list. Suggesting missing ingredients is FORBIDDEN except for salt, pepper, and water.";
  } else if (preferences.strictness === 'Flexible') {
      strictnessInstruction = "Prioritize pantry items, but you can suggest 1-2 small external additions if they transform the dish.";
  }

  let dietaryConstraints = preferences.dietaryRestrictions.length > 0 ? `DIETARY: ${preferences.dietaryRestrictions.join(', ')}. ` : "";
  if (preferences.isKosher) {
      dietaryConstraints += "CRITICAL: The recipe MUST BE KOSHER (no mixing of dairy and meat, no pork, no shellfish). ";
  }

  let capabilityConstraints = `SKILL LEVEL: ${preferences.skillLevel}. APPLIANCES AVAILABLE: ${preferences.appliances.join(', ')}. `;
  let customConstraints = "";
  if (options) {
      if (options.customRequest) {
          customConstraints += `!!! ABSOLUTE PRIORITY USER REQUEST: "${options.customRequest}". YOU MUST ADHERE TO THIS REQUEST ABOVE ALL OTHER PREFERENCES. !!! `;
      }
      if (options.mealType && options.mealType !== 'Any') {
          customConstraints += `MEAL TYPE: This must be a ${options.mealType} recipe. `;
      }
      if (options.maxTime && options.maxTime !== 'Any') {
          customConstraints += `TIME LIMIT: Must take less than ${options.maxTime} minutes. `;
      }
  }

  try {
    const prompt = `
    Task: Act as a high-end chef generating 6 unique recipe ideas.
    Context:
    Pantry: ${pantryItems.map(i => i.name).join(', ')}. 
    ${dietaryConstraints}
    ${strictnessInstruction}
    ${capabilityConstraints}
    ${customConstraints}
    
    Output Format: Return valid JSON array of recipe objects.
    Each instruction step should start with a strong action verb.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
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
              matchScore: { type: Type.INTEGER }
            },
            required: ['id', 'title', 'timeMinutes', 'ingredients', 'instructions', 'matchScore', 'missingIngredients']
          }
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text || "[]")).map((r: any) => ({ ...r, id: r.id || Math.random().toString() }));
  } catch (error) { return []; }
};

export const generateRecipeImage = async (recipeTitle: string): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `High resolution food photography of ${recipeTitle}. Styled for a cookbook, overhead shot, soft lighting, 16:9 aspect ratio.` }] },
            config: { imageConfig: { aspectRatio: "16:9" } }
        });
        for (const candidate of response.candidates || []) {
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.data) return part.inlineData.data;
                }
            }
        }
        return undefined;
    } catch (error) { return undefined; }
};

export const updatePantryAfterCooking = async (currentPantry: Ingredient[], recipeUsed: Recipe): Promise<Ingredient[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `As an inventory manager, look at this pantry: ${JSON.stringify(currentPantry)} and this recipe cooked: ${JSON.stringify(recipeUsed.ingredients)}. 
            Subtract the logic amounts from the pantry. If an item is completely used up, remove it. 
            Return the NEW full pantry as a JSON array of Ingredient objects. Keep existing IDs.`,
            config: { responseMimeType: 'application/json' }
        });
        const updated = JSON.parse(cleanJsonString(response.text || "[]"));
        return Array.isArray(updated) ? updated : currentPantry;
    } catch (error) { return currentPantry; }
};

export const generateSubstitutions = async (pantryItems: Ingredient[], recipe: Recipe): Promise<Substitution[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Suggest pantry swaps for: ${recipe.title}. Missing: ${recipe.missingIngredients.join(', ')}. Available: ${pantryItems.map(i => i.name).join(', ')}.`,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(cleanJsonString(response.text || "[]"));
    } catch (e) { return []; }
};

export const generateShoppingSuggestions = async (pantryItems: Ingredient[], historyTitles: string[]): Promise<{ name: string }[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const prompt = `Based on a pantry of ${pantryItems.map(i => i.name).join(', ')} and a history of cooking ${historyTitles.join(', ')}, suggest 5-8 smart items the user might be running low on. Output JSON: { "suggestions": [{ "name": string }] }.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const parsed = JSON.parse(cleanJsonString(response.text || "{}"));
        return parsed.suggestions || [];
    } catch (e) { return []; }
};

export const generateQuickPitch = async (recipeTitle: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Give me a 2-sentence appetizing sales pitch for a professional marketplace for the recipe: "${recipeTitle}".`,
        });
        return response.text || "A masterpiece for your kitchen.";
    } catch (error) { return "A must-try dish perfected by KitchenSync AI."; }
};

/**
 * chatWithChef facilitates real-time interaction with the Chef Gemini AI.
 * It uses the gemini-3-pro-preview model for complex reasoning and conversation.
 */
export const chatWithChef = async (history: ChatMessage[], userInput: string, pantryItems: Ingredient[], activeRecipe?: Recipe | null): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `You are Chef Gemini, a world-class culinary expert and helpful sous-chef.
    Your personality is sophisticated, encouraging, and highly knowledgeable about global cuisines.
    
    Context:
    - User's Pantry: ${pantryItems.map(i => i.name).join(', ')}.
    ${activeRecipe ? `- Active Recipe context: "${activeRecipe.title}". Ingredients: ${activeRecipe.ingredients.join(', ')}.` : ""}
    
    Rules:
    - If the user asks about what they can cook, prioritize their pantry items.
    - If they are looking at a recipe, help them with substitutions, technical questions, or timing.
    - Keep responses concise but flavorful.
    - If asked for something non-culinary, politely redirect them back to the kitchen.`;

    const chatHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    try {
        const chat = ai.chats.create({
            model: 'gemini-3-pro-preview',
            config: {
                systemInstruction,
            },
            history: chatHistory
        });

        const response = await chat.sendMessage({ message: userInput });
        return response.text || "I'm sorry, I'm a bit distracted by the stove. Could you repeat that?";
    } catch (error) {
        console.error("Chef Chat Error:", error);
        return "Chef Gemini is currently busy in the kitchen (API error). Please try again in a moment!";
    }
};
