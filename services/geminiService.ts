
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
 * UPDATED: Strict adherence to ingredients list to prevent visual hallucinations.
 * BRIGHTNESS UPDATE: Increased lighting intensity in prompt.
 * SERVINGS UPDATE: Added servings parameter to scale visual portion.
 */
export const generateRecipeImage = async (title: string, ingredients: string[] = [], servings: number = 2): Promise<string | undefined> => {
  return withRetry(async () => {
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const strictIngredients = ingredients.join(", ");
    const prompt = `Professional high-key food photography of ${title}. 
      STRICT RULE: ONLY show ingredients mentioned in this list: [${strictIngredients}]. 
      VISUAL SCALE: The image must depict a serving size for ${servings} people.
      DO NOT add garnishes, herbs, tomatoes, or side dishes that are not in the list. 
      Vibrant presentation, BRIGHT studio lighting, soft shadows, 4k resolution, Michelin star presentation of EXACTLY what is listed. 
      The background should be clean and light-neutral.`;
    
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
 */
export const generateSingleSmartRecipe = async (
  pantry: Ingredient[], 
  preferences: UserPreferences, 
  options: RecipeGenerationOptions,
  index: number = 0
): Promise<Recipe> => {
  const pantryList = pantry.map(i => `${i.name} (${i.quantity})`).join(', ');
  const isFoundational = index === 0;

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const servings = options.servings || preferences.householdSize || 2;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ACT AS: A practical home chef who respects the user's pantry.
        PANTRY: [${pantryList}]
        USER REQUEST: "${options.customRequest || 'Make something delicious'}"
        EXCLUDE DISHES: ${(options.excludeTitles || []).join(', ')}
        
        LOGIC MODE: ${isFoundational ? 'FOUNDATIONAL' : 'CREATIVE'}
        
        STRICT RULES:
        1. TITLES: Use simple, standard, everyday names (e.g. "Pizza Rolls", "Chicken Stir Fry"). NO "Artisanal", "Medley", "Reduction", "Spheres" or fancy adjectives.
        2. NO HALLUCINATIONS: Do not assume ingredients exist if they are not in the pantry.
        3. REALISM: Use provided pantry items logically.
        4. HONESTY: Missing items go in 'missingItems'.
        5. QUANTITY: Scale for ${servings} people.
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

    const textOutput = response.text;
    if (!textOutput) throw new Error("Empty synthesis response");
    
    const r = JSON.parse(textOutput);
    
    return {
        id: `recipe-${Date.now()}-${index}`,
        title: r.title || 'Untitled Creation',
        description: r.description || '',
        timeMinutes: r.timeMinutes || 30,
        difficulty: r.difficulty || 'Easy',
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
 * BRIGHTNESS UPDATE: Added "Vibrant", "Clean" and "Bright lighting" to the prompt.
 */
export const generatePantryAssetImage = async (itemName: string, quantity: string): Promise<string | undefined> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `High-end professional food photography of ${itemName} (${quantity}). 
      Isolated on a clean, light-grey textured stone surface. 
      Vibrant colors, extremely BRIGHT studio lighting, soft shadows, sharp focus, 8k resolution, cinematic but high-key. 
      Fresh and appetizing presentation.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  }).catch(() => undefined);
};

export const generateSmartRecipeBatch = async (
  pantry: Ingredient[], 
  preferences: UserPreferences, 
  options: RecipeGenerationOptions
): Promise<Recipe[]> => {
  const recipes: Recipe[] = [];
  const count = options.recipeCount || 4;
  const usedTitles: string[] = [];

  for (let i = 0; i < count; i++) {
    const r = await generateSingleSmartRecipe(pantry, preferences, { ...options, excludeTitles: usedTitles }, i);
    recipes.push(r);
    usedTitles.push(r.title);
  }
  return recipes;
};

export const parseReceiptOrImage = async (base64Data: string, mimeType: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Extract items and quantities from this receipt or pantry image. Return as JSON object with 'items' array of {name: string, quantity: string}." }
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
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
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
          { text: "Analyze this food image. Identify the meal name and estimate total calories. Return JSON with keys: name (string), calories (number), mealType (string: Breakfast, Lunch, Dinner, or Snack)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.INTEGER },
            mealType: { type: Type.STRING, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const organizePastedText = async (text: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Organize this list into a clean JSON array of {name: string, quantity: string, category?: string}: ${text}`,
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
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const processChefChatPlan = async (pantry: Ingredient[], query: string, prefs: UserPreferences) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User wants: "${query}". Based on pantry [${pantry.map(i=>i.name).join(', ')}], create meal plans. Use simple, standard everyday names for dishes.`,
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
                      type: {
                        type: Type.OBJECT,
                        properties: { 
                          name: { type: Type.STRING }, 
                          price: { type: Type.NUMBER },
                          category: { type: Type.STRING }
                        }
                      } as any
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
    return JSON.parse(response.text);
  });
};

export const estimateMealCalories = async (mealName: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Estimate calories for: ${mealName}. Return only the number.`,
    });
    return parseInt(response.text?.match(/\d+/)?.[0] || '450');
  });
};

export const generateWeeklyPlan = async (pantry: Ingredient[], preferences: UserPreferences, startDate: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a 7-day dinner plan starting ${startDate} using pantry [${pantry.map(i=>i.name).join(', ')}]. Use simple, everyday names for dishes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              mealType: { type: Type.STRING },
              recipeTitle: { type: Type.STRING },
              calories: { type: Type.INTEGER }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generateKosherWeeklyPlan = async (pantry: Ingredient[], preferences: UserPreferences, startDate: string, config: any) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a 7-day Kosher dinner plan starting ${startDate} with focus ${config.focus}. Pantry: [${pantry.map(i=>i.name).join(', ')}]. Use simple, everyday names for dishes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  dayName: { type: Type.STRING },
                  recipeTitle: { type: Type.STRING },
                  description: { type: Type.STRING },
                  calories: { type: Type.INTEGER },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            shoppingList: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const chatWithChef = async (history: ChatMessage[], message: string, pantry: Ingredient[]) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = history.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    const prompt = `System: You are a helpful culinary studio assistant. Speak simply and clearly. Pantry: ${pantry.map(i=>i.name).join(', ')}.\n\n${context}\nUser: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  });
};

export const analyzePantryStatus = async (pantry: Ingredient[]) => {
  return withRetry(async () => {
    if (pantry.length === 0) return { tip: "Pantry is empty.", urgency: 'low' };
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this pantry and give a one-sentence tip and an urgency level (low, medium, high): ${pantry.map(i=>i.name).join(', ')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tip: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};
