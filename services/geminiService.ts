
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Ingredient, UserPreferences, Recipe, RecipeGenerationOptions, Category, ChatMessage } from "../types";

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

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};

const sanitizeInventory = (items: Ingredient[]): string => {
  return items.map(i => `${i.name} (${i.quantity})`).join(', ');
};

// --- Speech Helpers ---
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const speakText = async (text: string, voiceName: string = 'Kore') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with chef personality: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (error) {
    console.error("TTS generation failed", error);
  }
};

/**
 * Generates an illustrative icon for an ingredient.
 */
export const generateIngredientImage = async (name: string): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A single minimalist flat-design 2D illustrative icon of "${name}" on a solid soft neutral background, clean vector lines, professional culinary illustration style, not realistic.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
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

/**
 * Generates a cinematic video explainer of the user's current kitchen status.
 */
export const generateKitchenTrailer = async (
    pantryItems: Ingredient[], 
    preferences: UserPreferences,
    onProgress: (msg: string) => void
): Promise<{ videoUrl: string; script: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inventory = pantryItems.map(i => i.name).join(', ');

    onProgress("Synthesizing Cinematic Script...");
    const scriptResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Write a 15-second cinematic trailer script for a kitchen studio. 
                   Focus on these items: ${inventory}. 
                   The tone should be 'Epic Studio' like a movie trailer.
                   JSON Output: {"script": "string", "visualPrompt": "string"}`
    });
    
    const { script, visualPrompt } = JSON.parse(cleanJsonString(scriptResponse.text || "{}"));

    onProgress("Orchestrating Veo Synthesis...");
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Cinematic high-end kitchen footage: ${visualPrompt}, macro shots, steam, professional lighting, 4k, moody.`,
        config: {
            numberOfVideos: 1,
            resolution: '1080p',
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        onProgress(`Synthesizing Frame Logic... (${new Date().toLocaleTimeString()})`);
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const finalVideoUrl = `${downloadLink}&key=${process.env.API_KEY}`;

    return { videoUrl: finalVideoUrl, script };
};

export const generateSmartRecipes = async (pantryItems: Ingredient[], preferences: UserPreferences, options?: RecipeGenerationOptions, savedRecipes?: Recipe[]): Promise<Recipe[]> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const sanitizedPantry = sanitizeInventory(pantryItems);
    
    const servings = options?.servings || preferences.householdSize || 2;
    const count = options?.recipeCount || preferences.generationsCount || 3;
    
    const instructions = `
      Act as a Precision Nutritionist and Michelin-Starred Executive Chef. 
      Task: Generate ${count} detailed recipes in JSON.
      
      CONTEXT:
      - Inventory: ${sanitizedPantry}.
      - Goal: ${preferences.healthGoal}.
      - Cuisine: ${preferences.cuisinePreferences.join(', ')}.
      - Household Size: ${servings} people.
      
      CRITICAL ACCURACY REQUIREMENTS:
      1. SERVINGS: Every recipe MUST be scaled for EXACTLY ${servings} servings. 
      2. NUTRITION: Calculate calories, protein, carbs, and fat PER INDIVIDUAL SERVING. 
      3. LOGIC: Use at least 3 items from inventory.
      
      OUTPUT FORMAT: Strict JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: instructions,
      config: {
        thinkingConfig: { thinkingBudget: 2000 },
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
              servings: { type: Type.INTEGER },
              mealType: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              calories: { type: Type.INTEGER },
              protein: { type: Type.STRING },
              carbs: { type: Type.STRING },
              fat: { type: Type.STRING },
              matchScore: { type: Type.INTEGER },
              isFitnessMatch: { type: Type.BOOLEAN },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['id', 'title', 'timeMinutes', 'ingredients', 'instructions', 'matchScore', 'missingIngredients', 'calories', 'protein', 'carbs', 'fat', 'description', 'servings', 'mealType', 'isFitnessMatch']
          }
        }
      }
    });
    const parsed = JSON.parse(cleanJsonString(response.text || "[]"));
    return parsed.map((r: any) => ({ ...r, id: r.id || Math.random().toString(), reviews: [] }));
  });
};

export const processChefChatPlan = async (
    pantryItems: Ingredient[], 
    userInput: string,
    preferences: UserPreferences
): Promise<{ concept: string; description: string; items: { name: string; category: string }[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inventoryList = pantryItems.map(i => i.name).join(', ');
    
    const instructions = `
      Identify exactly what is MISSING to create a chef-quality meal for ${preferences.householdSize} people.
      User Input: "${userInput}"
      Current Inventory: ${inventoryList}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: instructions,
            config: { 
              responseMimeType: "application/json",
              responseSchema: {
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
                        category: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
        });
        return JSON.parse(cleanJsonString(response.text || "{}"));
    } catch (error) { 
        return { concept: "Chef's Special", description: "A tailored dish designed for your pantry.", items: [] }; 
    }
};

export const generateRecipeImage = async (recipe: Recipe): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePrompt = `Professional food photography of ${recipe.title}, high resolution, minimalist plate, 8k.`;
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

export const chatWithChef = async (messages: ChatMessage[], userInput: string, pantryItems: Ingredient[], activeRecipe?: Recipe | null): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: userInput }] }],
      config: { 
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `You are Chef Prepzu AI. Help with cooking and inventory based on: ${pantryItems.map(i => i.name).join(', ')}.`
      }
    });
    return response.text || "";
  } catch (error) { return "Studio link unstable."; }
};

export const analyzePantryStatus = async (pantryItems: Ingredient[]): Promise<{ tip: string; urgency: 'low' | 'medium' | 'high' }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sanitized = sanitizeInventory(pantryItems);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current Inventory: ${sanitized}. Provide a JSON logistics tip: {"tip": "string", "urgency": "low|medium|high"}`,
      config: { 
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json" 
      }
    });
    return JSON.parse(cleanJsonString(response.text || '{"tip": "Inventory stable.", "urgency": "low"}'));
  } catch (error) { return { tip: "Continue discovery.", urgency: "low" }; }
};

export const parseReceiptOrImage = async (base64Image: string): Promise<{ items: { name: string; category: string; quantity: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: `Identify all food items in JSON: { "items": [{ "name", "category", "quantity" }] }.` }
        ],
      },
      config: { 
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json' 
      }
    });
    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (error) { return { items: [] }; }
};

export const organizePastedText = async (text: string): Promise<{ name: string; category: string; quantity: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract food items from: "${text}". JSON: { "items": [{ "name", "category", "quantity" }] }.`,
      config: { 
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json' 
      }
    });
    const data = JSON.parse(cleanJsonString(response.text || "{}"));
    return data.items || [];
  } catch (error) { return []; }
};

export const generateWeeklyPlan = async (pantryItems: Ingredient[], preferences: UserPreferences, startDate: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a 7-day precise meal plan from ${startDate}. Use Inventory: ${pantryItems.map(i => i.name).join(', ')}. JSON: [{ "date", "dayName", "recipeTitle", "mealType", "calories" }]`,
      config: { 
        thinkingConfig: { thinkingBudget: 1500 },
        responseMimeType: "application/json" 
      }
    });
    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) { return []; }
};

export const estimateMealCalories = async (mealDescription: string): Promise<number> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Estimate calories: "${mealDescription}". JSON: { "calories": number }.`,
            config: { responseMimeType: "application/json" }
        });
        const data = JSON.parse(cleanJsonString(response.text || "{}"));
        return data.calories || 450;
    } catch (error) { return 450; }
};

export const generateKosherWeeklyPlan = async (
    pantryItems: Ingredient[], 
    preferences: UserPreferences, 
    startDate: string, 
    config: any
): Promise<{ plan: any[], shoppingList: string[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `7-day plan from ${startDate}. Scale for ${config.servings} people. Inventory: ${pantryItems.map(i => i.name).join(', ')}. JSON: { "plan": [{ "date", "recipeTitle", "description", "calories", "ingredients" }], "shoppingList": ["items"] }.`,
            config: { 
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 2500 }
            }
        });
        return JSON.parse(cleanJsonString(response.text || '{"plan": [], "shoppingList": []}'));
    } catch (error) { return { plan: [], shoppingList: [] }; }
};
