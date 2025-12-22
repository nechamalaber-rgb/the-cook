import React, { useState, useMemo } from 'react';
import { Plus, Check, Trash2, ExternalLink, Copy, ShoppingCart, Sparkles, Loader2, Store, ArrowLeft } from 'lucide-react';
import { ShoppingItem, Category, Ingredient, MealLog } from '../types';
import { generateShoppingSuggestions } from '../services/geminiService';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  moveToPantry: (item: ShoppingItem) => void;
  pantryItems?: Ingredient[];
  mealHistory?: MealLog[];
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ items, setItems, moveToPantry, pantryItems = [], mealHistory = [] }) => {
  const [newItemName, setNewItemName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Simple auto-categorization logic for the frontend
  const categorizeItem = (name: string): Category => {
      const lower = name.toLowerCase();
      if (lower.match(/apple|banana|fruit|veg|spinach|lettuce|tomato|onion|garlic|potato|carrot|pepper|salad|berry|lemon|lime/)) return Category.PRODUCE;
      if (lower.match(/milk|cheese|egg|yogurt|butter|cream|dairy/)) return Category.DAIRY;
      if (lower.match(/chicken|beef|pork|meat|fish|salmon|tuna|steak|sausage|bacon|turkey/)) return Category.MEAT;
      if (lower.match(/bread|pasta|rice|cereal|flour|sugar|oil|spice|can|soup|sauce|snack|chip|cracker|nut/)) return Category.PANTRY;
      if (lower.match(/frozen|ice|pizza|nugget/)) return Category.FROZEN;
      if (lower.match(/water|soda|juice|beer|wine|coffee|tea|drink/)) return Category.BEVERAGE;
      return Category.OTHER;
  };
  
  const addItem = (name: string) => {
    if (!name.trim()) return;
    const newItem: ShoppingItem = {
      id: Date.now().toString() + Math.random(),
      name: name,
      category: categorizeItem(name), 
      checked: false
    };
    setItems(prev => [...prev, newItem]);
    setNewItemName('');
  };

  const handleGenerateSuggestions = async () => {
      setIsGenerating(true);
      const historyTitles = mealHistory.slice(-5).map(m => m.recipeTitle);
      const suggestions = await generateShoppingSuggestions(pantryItems, historyTitles);
      
      suggestions.forEach(s => {
          if(!items.some(i => i.name.toLowerCase() === s.name.toLowerCase())) {
              addItem(s.name);
          }
      });
      setIsGenerating(false);
  };

  const toggleCheck = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleMoveCheckedToPantry = () => {
    const checkedItems = items.filter(i => i.checked);
    checkedItems.forEach(item => moveToPantry(item));
    setItems(prev => prev.filter(i => !i.checked));
  };

  const fillSmartCart = () => {
    const itemsToBuy = items.filter(i => !i.checked).map(i => i.name);
    if (itemsToBuy.length === 0) return;
    const params = new URLSearchParams();
    params.append('title', 'KitchenSync Shopping List');
    itemsToBuy.forEach(item => params.append('ingredients[]', item));
    window.open(`https://www.instacart.com/store/partner_recipes?${params.toString()}`, '_blank');
  };

  const openWalmartSearch = () => {
    const itemsToBuy = items.filter(i => !i.checked).map(i => i.name);
    if (itemsToBuy.length === 0) return;
    const listText = itemsToBuy.join('\n');
    navigator.clipboard.writeText(listText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    const firstItem = encodeURIComponent(itemsToBuy[0]);
    window.open(`https://www.walmart.com/search?q=${firstItem}`, '_blank');
  };

  // Group items by category
  const groupedItems = useMemo(() => {
      const groups: Record<string, ShoppingItem[]> = {};
      items.forEach(item => {
          if (!groups[item.category]) groups[item.category] = [];
          groups[item.category].push(item);
      });
      return groups;
  }, [items]);

  // Sort Category Keys to specific order
  const categoryOrder = [Category.PRODUCE, Category.DAIRY, Category.MEAT, Category.PANTRY, Category.FROZEN, Category.BEVERAGE, Category.OTHER];
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
      return categoryOrder.indexOf(a as Category) - categoryOrder.indexOf(b as Category);
  });

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-serif">Shopping</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{items.filter(i => !i.checked).length} items to buy</p>
        </div>
        {items.some(i => i.checked) && (
            <button 
                onClick={handleMoveCheckedToPantry}
                className="bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-800 text-primary-800 dark:text-primary-300 px-5 py-3 rounded-xl font-bold hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all shadow-sm flex items-center gap-2"
            >
                <Check size={18} />
                Move Completed to Pantry
            </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/50 border border-slate-300 dark:border-slate-700 flex gap-2 mb-8 sticky top-24 z-30">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem(newItemName)}
          placeholder="Add item (e.g. Milk, Spinach)..."
          className="flex-1 p-3 outline-none text-slate-900 dark:text-slate-200 placeholder:text-slate-400 bg-transparent font-medium"
        />
        <button 
          onClick={() => addItem(newItemName)}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-md"
        >
          <Plus size={22} />
        </button>
      </div>

      {items.length === 0 ? (
          <div className="space-y-6">
             <div className="text-center py-24 text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-[2rem] bg-white dark:bg-slate-900">
                <ShoppingCart size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                <p className="font-medium">Your list is empty.</p>
            </div>
            {/* AI Suggestions Button - Only show when empty or small list */}
            <button 
                onClick={handleGenerateSuggestions}
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-fuchsia-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform"
            >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles fill="currentColor" />}
                {isGenerating ? 'Analyzing Pantry & History...' : 'Generate Smart Restock List'}
            </button>
          </div>
      ) : (
          <div className="space-y-8">
              {/* Category Groups */}
              {sortedCategories.map(category => {
                  const categoryItems = groupedItems[category];
                  if (!categoryItems || categoryItems.length === 0) return null;

                  return (
                      <div key={category} className="animate-slide-up">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                              {category}
                          </h3>
                          <div className="space-y-2">
                              {categoryItems.map(item => (
                                  <div 
                                    key={item.id} 
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                                        item.checked 
                                        ? 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-50' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300'
                                    }`}
                                  >
                                    <button
                                      onClick={() => toggleCheck(item.id)}
                                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                          item.checked ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 dark:border-slate-500 text-transparent hover:border-primary-400'
                                      }`}
                                    >
                                      <Check size={14} strokeWidth={4} />
                                    </button>
                                    <span className={`flex-1 font-bold text-base ${item.checked ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {item.name}
                                    </span>
                                    <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2">
                                        <Trash2 size={18} />
                                    </button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )
              })}

              {/* Export Actions */}
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                      onClick={fillSmartCart}
                      className="bg-[#003D29] text-white px-5 py-4 rounded-2xl font-bold hover:bg-[#002e1f] transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 group"
                  >
                      <ShoppingCart size={20} className="text-[#ff8300]" />
                      Instacart Express
                  </button>
                  <button 
                      onClick={openWalmartSearch}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-5 py-4 rounded-2xl font-bold hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-300 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                      {copied ? <Check size={20} /> : <Store size={20} />}
                      {copied ? "List Copied!" : "Shop at Walmart"}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ShoppingListView;