
export enum Category {
  PRODUCE = 'Produce',
  DAIRY = 'Dairy & Eggs',
  MEAT = 'Meat & Protein',
  PANTRY = 'Pantry Staples',
  FROZEN = 'Frozen',
  BEVERAGE = 'Beverages',
  OTHER = 'Other'
}

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  quantity: string;
  expiryDate?: string; // ISO date string
  addedDate: string;
}

export interface Pantry {
    id: string;
    name: string;
    items: Ingredient[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: string[];
  missingIngredients: string[];
  calories?: number;
  protein?: string; 
  matchScore: number; 
  imageUrl?: string;
}

export interface Substitution {
  original: string;
  substitute: string;
  explanation: string; 
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: Category;
  checked: boolean;
}

export interface MealLog {
  id: string;
  date: string; 
  time: string; 
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';
  recipeTitle: string;
  recipeId: string;
  calories?: number;
  status?: 'planned' | 'completed';
}

export interface UserPreferences {
  userName?: string;
  email?: string; 
  isProMember?: boolean; 
  subscriptionTier?: 'basic' | 'pro' | 'elite';
  trialStartedAt?: string; // ISO string
  darkMode: boolean; 
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  allergies: string[];
  appliances: string[];
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  strictness: 'Creative' | 'Flexible' | 'Strict';
  isKosher: boolean;
  healthGoal: 'Lose Weight' | 'Maintain' | 'Build Muscle';
  nutritionalGoals?: {
    maxCaloriesPerMeal?: string;
    minProteinPerMeal?: string;
  };
  measurementSystem: 'Metric' | 'Imperial';
  emailNotifications: boolean;
}

export interface RecipeGenerationOptions {
  servings: number;
  mealType: 'Any' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';
  maxTime: 'Any' | '15' | '30' | '45' | '60';
  excludeRecents?: string[]; 
  customRequest?: string; 
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}