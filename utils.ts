
import { Category } from './types';

export const autoCategorize = (name: string): Category => {
    const lower = name.toLowerCase();
    if (lower.match(/steak|beef|chicken|pork|meat|fish|salmon|tuna|lamb|turkey|shrimp|bacon|sausage|ham|prawn|tilapia|ribs|fillet|loin|venison|duck|quail|prosciutto|salami|chorizo|jerky/)) return Category.MEAT;
    if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy|curd|sour cream|parmesan|mozzarella|cheddar|brie|feta|goat|ricotta|heavy cream|half and half|provolone|swiss|gruyere|kefir|ghee/)) {
        if (lower.match(/peanut butter|almond butter|nut butter/)) return Category.PANTRY;
        return Category.DAIRY;
    }
    if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper|salad|berry|lemon|lime|broccoli|cabbage|cucumber|mushroom|kale|zucchini|asparagus|cilantro|parsley|dill|thyme|rosemary|sage|basil|mint|ginger|shallot|leek|celery|avocado|grape|orange|strawberry|blueberry|raspberry|mango|pineapple|peach|plum|cherry|date|fig|pear|corn|pea|bean|radish|beet|cauliflower|brussels/)) return Category.PRODUCE;
    if (lower.match(/honey|syrup|oil|flour|sugar|salt|spice|pasta|rice|bean|lentil|source|vinegar|ketchup|mustard|mayo|canned|soup|cereal|oats|nut|seed|cumin|paprika|turmeric|cinnamon|vanilla|pepper|broth|stock|bouillon|yeast|baking|jam|jelly|peanut butter|almond butter|tahini|soy sauce|teriyaki|salsa|hot sauce/)) return Category.PANTRY;
    if (lower.match(/water|soda|juice|beer|wine|coffee|tea|drink|sparkling|cola|pepsi|coke|whiskey|vodka|spirit|gin|rum|tequila|espresso|latte|tonic|ale/)) return Category.BEVERAGE;
    if (lower.match(/bagel|bread|toast|sourdough|tortilla|wrap|roll|bun|muffin|pita|naan|baguette|ciabatta|croissant|focaccia|chips|snack|cracker|pretzel|cookie|cake|pastry|brownie/)) return Category.BAKERY;
    if (lower.match(/frozen| ice |pizza|nugget|peas|sorbet|gelato|waffle|fries|patties/)) return Category.FROZEN;
    return Category.PANTRY; 
};

export const parseQuantityValue = (q: any): { num: number; suffix: string } => {
    const strQ = String(q || '1');
    const match = strQ.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
        return { num: parseFloat(match[1]), suffix: match[2] || '' };
    }
    return { num: 1, suffix: strQ };
};

export const mergeQuantities = (oldQ: string, newQ: string): string => {
    const p1 = parseQuantityValue(oldQ);
    const p2 = parseQuantityValue(newQ);
    const sum = p1.num + p2.num;
    const unit = p1.suffix || p2.suffix || '';
    return unit ? `${sum} ${unit}`.trim() : `${sum}`;
};
