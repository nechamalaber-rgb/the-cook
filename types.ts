
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
  tips?: string[];
  servings?: number;
  mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert' | 'Fitness Fuel';
  reviews?: Review[];
  groundingLinks?: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: Category;
  quantity?: string;
  price?: number;
  checked: boolean;
  store?: string;
  source?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  date: string;
  total: number;
  items: ShoppingItem[];
  status: OrderStatus;
  createdAt: string;
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
  avatarUrl?: string;
  loginMethod?: 'magic_link' | 'google';
  isProMember?: boolean; 
  subscriptionTier?: 'none' | 'pro' | 'elite';
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
  
  // Notification Toggles
  emailNotifications: boolean;
  recipeUpdateNotifications: boolean;
  promotionNotifications: boolean;
  
  spiceLevel: 'None' | 'Mild' | 'Medium' | 'Hot' | 'Nuclear';
  budget: 'Thrifty' | 'Moderate' | 'Gourmet';
  blacklist: string[];
  householdSize: number;
  chefPersonality: 'Strict' | 'Creative';
  onboardingCompleted?: boolean;
  personalTasteBio: string;
  cookingStyle: 'simple' | 'culinary';
  freeGenerationsUsed?: number;
}

export interface RecipeGenerationOptions {
  servings: number;
  mealType: 'Any' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert' | 'Fitness Fuel';
  maxTime: string;
  customRequest?: string; 
  recipeCount?: number;
  complexity?: 'Simple' | 'Gourmet';
  excludedIngredients?: string[];
  excludeTitles?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
