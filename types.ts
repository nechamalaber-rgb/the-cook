
export enum Category {
  PRODUCE = 'Produce',
  DAIRY = 'Dairy & Eggs',
  MEAT = 'Meat & Protein',
  BAKERY = 'Bakery & Grains',
  PANTRY = 'Pantry Staples',
  FROZEN = 'Frozen',
  BEVERAGE = 'Beverages',
  OTHER = 'Other'
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: string;
  isExpert?: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  quantity: string;
  expiryDate?: string; 
  addedDate: string;
  imageUrl?: string;
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
  carbs?: string;
  fat?: string;
  matchScore: number; 
  imageUrl?: string;
  isUserCreated?: boolean; 
  tips?: string[];
  servings?: number;
  mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert' | 'Fitness Fuel';
  reviews?: Review[];
  isFitnessMatch?: boolean;
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
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert' | 'Fitness Fuel';
  recipeTitle: string;
  recipeId: string;
  calories?: number;
  status?: 'planned' | 'completed';
}

export interface UserPreferences {
  userName?: string;
  email?: string; 
  isProMember?: boolean; 
  subscriptionTier?: 'none' | 'pro' | 'elite';
  trialStartedAt?: string; 
  trialUsed?: boolean;
  dailyUsage?: { date: string; count: number };
  darkMode: boolean; 
  themeColor?: 'classic' | 'slate' | 'emerald' | 'rose';
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
  spiceLevel: 'None' | 'Mild' | 'Medium' | 'Hot' | 'Nuclear';
  budget: 'Thrifty' | 'Moderate' | 'Gourmet';
  blacklist: string[];
  householdSize: number;
  chefPersonality: 'Strict' | 'Creative';
  generationsCount?: number;
  selectedGoal?: 'fitness' | 'waste' | 'chef';
  twoFactorEnabled?: boolean;
  betaReasoningEnabled?: boolean;
  onboardingCompleted?: boolean;
  activeWalkthroughStep?: number;
}

export interface RecipeGenerationOptions {
  servings: number;
  mealType: 'Any' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert' | 'Fitness Fuel';
  maxTime: string;
  excludeRecents?: string[]; 
  customRequest?: string; 
  recipeCount?: number;
  complexity?: 'Simple' | 'Gourmet';
  excludedIngredients?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
