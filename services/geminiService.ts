
import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, UserPreferences, Recipe, RecipeGenerationOptions, PantryAudit, ChatMessage } from "../types";

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

export const generatePantryAssetImage = async (itemName: string, quantity: string): Promise<string | undefined> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Professional studio product photography of ${itemName} in its standard retail packaging or container (e.g. tub, carton, jar, or wrap). Minimalist product shot. Clean white background. High quality lighting. No raw food unless it comes unpackaged.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return undefined;
  }).catch(() => undefined);
};

export const generateRecipeImage = async (title: string, ingredients: string[] = []): Promise<string | undefined> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Realistic food photography of ${title}. High contrast, dark plate. Show ONLY: ${ingredients.join(', ')}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return part.inlineData.data; 
    }
    return undefined;
  }).catch(() => undefined);
};

export const generateSingleSmartRecipe = async (
  pantry: Ingredient[], 
  preferences: UserPreferences, 
  options: RecipeGenerationOptions,
  seedIndex: number = 0
): Promise<Recipe> => {
  const pantryManifest = pantry.map(i => `${i.name} (${i.quantity})`).join(', ');
  const exclusions = options.excludedIngredients?.join(', ') || 'None';
  
  // STRICT SEQUENCE LOGIC AS PER USER REQUEST
  let missionObjective = "";
  switch(seedIndex % 4) {
    case 0: 
      missionObjective = "MISSION 1: THE SYNERGY. Combine multiple pantry items into a high-quality, complex, and 'good' dish. Use ingredients together effectively."; 
      break;
    case 1: 
      missionObjective = "MISSION 2: THE ULTRA-SIMPLE. Use only 1 or 2 ingredients total. Focus on raw assembly or the simplest possible preparation of a single hero ingredient."; 
      break;
    case 2: 
      missionObjective = "MISSION 3: THE BALANCED STANDARD. Create a 'good', dependable, standard recipe that follows classic culinary logic."; 
      break;
    case 3: 
      missionObjective = "MISSION 4: THE ALTERNATIVE PREP. Focus on a completely different cooking style than the previous three (e.g. if others were pan-fried, make this oven-roasted or cold-prep)."; 
      break;
  }

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const servingsNeeded = options.servings || preferences.householdSize || 2;
    const targetMealType = options.mealType || 'Dinner';
    const complexityLevel = options.complexity || 'Simple';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        ROLE: Literal Pantry Logistics Engine.
        ${missionObjective}
        
        STRICT OPERATIONAL PARAMETERS:
        - MANDATORY MEAL CATEGORY: This MUST be a ${targetMealType} dish.
        - MANDATORY COMPLEXITY: Technical execution level MUST be "${complexityLevel}".
        - PANTRY ITEMS: [${pantryManifest}]
        - REQUIRED SERVINGS: ${servingsNeeded}
        - EXCLUSIONS: Do NOT use [${exclusions}] under any circumstances.
        - USER BIO: "${preferences.personalTasteBio}"
        - SEQUENCE ID: ${seedIndex} 
        
        STRICT DIVERSITY PROTOCOL:
        - If previous IDs generated specific combinations, this ID MUST pivot to a different culinary angle.
        - The ${missionObjective} MUST be applied specifically to a ${targetMealType} meal.
        
        RULES:
        1. NO HALLUCINATIONS: Use ONLY [Pantry Items]. Any missing item MUST be in 'pantryDelta'.
        2. EXCLUSION COMPLIANCE: If an item is excluded, don't just omit it, choose a dish that doesn't traditionally need it.
        3. LITERAL TITLES: Name it exactly what it is. "3-Ingredient [Food]", "[Food] Bowl", etc.
        4. NO FANCY SHIT: No "Infusions", "Symphonies", or "Velvety". Just logistics.
        5. MEAL TIER LOCK: If the user selected Breakfast, do NOT suggest a Steak Dinner unless it's "Steak and Eggs".
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            timeMinutes: { type: Type.INTEGER },
            difficulty: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            calories: { type: Type.INTEGER },
            servings: { type: Type.INTEGER },
            pantryDelta: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List items missing for this specific recipe."
            },
            matchScore: { type: Type.INTEGER },
            macros: {
                type: Type.OBJECT,
                properties: {
                    protein: { type: Type.STRING },
                    carbs: { type: Type.STRING },
                    fat: { type: Type.STRING }
                }
            }
          },
          required: ['title', 'ingredients', 'instructions', 'servings', 'pantryDelta', 'matchScore'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    
    return {
        id: `hon-${Date.now()}-${seedIndex}`,
        title: parsed.title,
        description: parsed.description,
        timeMinutes: parsed.timeMinutes || 15,
        difficulty: (parsed.difficulty as any) || 'Easy',
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        tips: parsed.tips || [],
        missingIngredients: parsed.pantryDelta || [], 
        matchScore: parsed.matchScore || (parsed.pantryDelta?.length > 0 ? 50 : 100), 
        calories: parsed.calories || 450,
        servings: parsed.servings || servingsNeeded,
        protein: parsed.macros?.protein,
        carbs: parsed.macros?.carbs,
        fat: parsed.macros?.fat,
        mealType: targetMealType as any,
        groundingLinks: []
    } as Recipe;
  });
};

export const chatWithChef = async (history: ChatMessage[], input: string, pantry: Ingredient[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const pantryContext = pantry.map(i => i.name).join(', ');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pantry: [${pantryContext}]. Input: ${input}. No fluff, just facts.`,
  });
  return response.text || "Synchronizing...";
};

export const analyzePantryStatus = async (pantryItems: Ingredient[]): Promise<{ tip: string; urgency: 'low' | 'medium' | 'high' }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Status check: ${pantryItems.map(i => i.name).join(', ')}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { tip: { type: Type.STRING }, urgency: { type: Type.STRING } },
        required: ['tip', 'urgency'],
      },
    },
  });
  return JSON.parse(response.text || '{"tip": "Manifest ready.", "urgency": "low"}');
};

export const auditPantryInventory = async (pantryItems: Ingredient[]): Promise<PantryAudit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Audit: ${pantryItems.map(i => i.name).join(', ')}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          efficiencyScore: { type: Type.INTEGER },
          healthStatus: { type: Type.STRING },
          categoryDistribution: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, percentage: { type: Type.NUMBER } } } },
          wasteRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingLink: { type: Type.STRING },
          chefAdvice: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const organizePastedText = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `List food items: ${text}`,
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
                required: ['name', 'quantity']
            }
        }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const parseReceiptOrImage = async (base64: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: "Scan items." }],
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
                        required: ['name', 'quantity']
                    }
                }
            }
        }
    }
  });
  return JSON.parse(response.text || '{"items":[]}');
};

export const estimateMealCalories = async (name: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Calories for ${name}.`,
    config: { 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                calories: { type: Type.INTEGER }
            }
        }
    }
  });
  return JSON.parse(response.text || '{"calories":450}').calories;
};

export const processChefChatPlan = async (pantry: Ingredient[], input: string, prefs: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Plan: ${input}`,
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
                                        price: { type: Type.NUMBER }
                                    }
                                }
                            },
                            fullRecipe: {
                                type: Type.OBJECT,
                                properties: {
                                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
  });
  return JSON.parse(response.text || '{"plans":[]}');
};

export const findNearbyStores = async () => [];

export const parsePastOrderText = async (text: string): Promise<{ items: any[]; total: number; date?: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse: ${text}`,
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
                quantity: { type: Type.STRING },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING }
              },
              required: ["name"]
            }
          },
          total: { type: Type.NUMBER },
          date: { type: Type.STRING }
        },
        required: ["items", "total"]
      }
    }
  });
  try {
    return JSON.parse(response.text || '{"items":[], "total": 0}');
  } catch (e) {
    return { items: [], total: 0 };
  }
};

export const generateWeeklyPlan = async (pantry: Ingredient[], prefs: any, start: string) => [];
export const generateKosherWeeklyPlan = async (pantry: Ingredient[], prefs: any, start: string, config: any) => ({ plan: [], shoppingList: [] });
