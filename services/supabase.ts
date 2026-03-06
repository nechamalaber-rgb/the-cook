
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qfvwhnhprpauxkjklohs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdndobmhwcnBhdXhramtsb2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NDEzODUsImV4cCI6MjA4MzIxNzM4NX0.oSqef0hHCfcsijo5Xx_9Pp_8zkAydUQQ9G3Jgx6M-w0';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const isSupabaseConfigured = () => {
    return !!supabaseUrl && !!supabaseKey;
};

// --- AUTH & PROFILE ---
export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
};

export const updateUserProStatus = async (userId: string, isPro: boolean, tier: string = 'pro') => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ 
            is_pro_member: isPro, 
            subscription_tier: tier,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    return { data, error };
};

// --- PANTRY & ITEMS ---
export const syncPantryToCloud = async (userId: string, items: any[]) => {
    const { error: deleteError } = await supabase.from('pantry_items').delete().eq('user_id', userId);
    if (deleteError) return { error: deleteError };

    const itemsToInsert = items.map(item => ({
        user_id: userId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        image_url: item.imageUrl,
        added_at: item.addedDate || new Date().toISOString()
    }));

    const { data, error } = await supabase.from('pantry_items').insert(itemsToInsert);
    return { data, error };
};

export const loadPantryFromCloud = async (userId: string) => {
    const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });
    return { data, error };
};

// --- RECIPES ---
export const saveRecipeToCloud = async (userId: string, recipe: any) => {
    const { data, error } = await supabase.from('saved_recipes').upsert({
        user_id: userId,
        recipe_id: recipe.id,
        title: recipe.title,
        content: JSON.stringify(recipe),
        updated_at: new Date().toISOString()
    });
    return { data, error };
};

export const deleteRecipeFromCloud = async (userId: string, recipeId: string) => {
    const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);
    return { error };
};

export const loadSavedRecipesFromCloud = async (userId: string) => {
    const { data, error } = await supabase
        .from('saved_recipes')
        .select('content')
        .eq('user_id', userId);
    return { data, error };
};

// --- MEAL LOGS (CALENDAR) ---
export const saveMealLogToCloud = async (userId: string, log: any) => {
    const { data, error } = await supabase.from('meal_logs').upsert({
        user_id: userId,
        log_id: log.id,
        date: log.date,
        meal_type: log.mealType,
        recipe_title: log.recipeTitle,
        recipe_id: log.recipeId,
        calories: log.calories,
        status: log.status,
        updated_at: new Date().toISOString()
    });
    return { data, error };
};

export const deleteMealLogFromCloud = async (userId: string, logId: string) => {
    const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('user_id', userId)
        .eq('log_id', logId);
    return { error };
};

export const loadMealLogsFromCloud = async (userId: string) => {
    const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
    return { data, error };
};

// --- SHOPPING LIST ---
export const syncShoppingListToCloud = async (userId: string, items: any[]) => {
    const { error: deleteError } = await supabase.from('shopping_list').delete().eq('user_id', userId);
    if (deleteError) return { error: deleteError };

    const itemsToInsert = items.map(item => ({
        user_id: userId,
        item_id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        checked: item.checked,
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase.from('shopping_list').insert(itemsToInsert);
    return { data, error };
};

export const loadShoppingListFromCloud = async (userId: string) => {
    const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', userId);
    return { data, error };
};

// --- PREFERENCES ---
export const syncPreferencesToCloud = async (userId: string, prefs: any) => {
    const { data, error } = await supabase.from('profiles').update({
        dietary_restrictions: prefs.dietaryRestrictions,
        cuisine_preferences: prefs.cuisinePreferences,
        allergies: prefs.allergies,
        appliances: prefs.appliances,
        skill_level: prefs.skillLevel,
        strictness: prefs.strictness,
        is_kosher: prefs.isKosher,
        health_goal: prefs.healthGoal,
        nutritional_goals: prefs.nutritionalGoals,
        measurement_system: prefs.measurementSystem,
        spice_level: prefs.spiceLevel,
        budget: prefs.budget,
        household_size: prefs.householdSize,
        chef_personality: prefs.chefPersonality,
        cooking_style: prefs.cookingStyle,
        personal_taste_bio: prefs.personalTasteBio,
        updated_at: new Date().toISOString()
    }).eq('id', userId);
    return { data, error };
};
