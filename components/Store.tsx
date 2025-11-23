
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { StoreItem } from '../types';
import { ShoppingBag, Check, Lock, Sparkles, Archive, Loader2, ImageOff, RefreshCw, ZoomIn, X } from 'lucide-react';
import { translations } from '../lib/translations';

// Helper to get color based on rarity
const getRarityClass = (rarity: string = 'common') => {
    switch (rarity.toLowerCase()) {
        case 'common': 
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
        case 'uncommon': 
            return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800';
        case 'rare': 
            return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800';
        case 'epic': 
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
        case 'legendary': 
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800'; // Gold/Amber
        case 'ultimate': 
            return 'bg-gray-900 text-white dark:bg-black dark:text-gray-200 border border-gray-700 dark:border-gray-600'; // Black
        case 'impossible':
            return 'bg-gradient-to-r from-yellow-300 via-amber-500 to-black text-white border border-amber-400/50 shadow-sm shadow-amber-500/20';
        default: 
            return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600';
    }
};

// Separate component to handle individual image states
const StoreItemCard: React.FC<{ 
    item: StoreItem; 
    isOwned: boolean; 
    onBuy: (item: StoreItem) => void;
    onImageClick: (item: StoreItem) => void; 
    getImage: (path: string) => string;
    language: string;
}> = ({ item, isOwned, onBuy, onImageClick, getImage, language }) => {
    const [imgError, setImgError] = useState(false);
    // REMOVED TIMESTAMP (?t=...) to allow browser caching. This significantly speeds up loading.
    const imageUrl = getImage(item.image_path);
    const rarityClass = getRarityClass(item.rarity);
    
    // Choose description based on language
    const description = language === 'es' && item.description_es ? item.description_es : item.description;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-md transition-all group">
            <div className="h-40 bg-gray-100 dark:bg-gray-700 relative overflow-hidden flex items-center justify-center cursor-zoom-in" onClick={() => onImageClick(item)}>
                {!imgError ? (
                    <img 
                        src={imageUrl} 
                        alt={item.item} 
                        loading="lazy" // Enable Native Lazy Loading
                        decoding="async" // Decode off main thread
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => {
                            console.warn(`Failed to load image for ${item.item}:`, imageUrl);
                            setImgError(true);
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 p-2 w-full h-full bg-gray-800">
                        <ImageOff size={24} className="mb-2" />
                        <span className="text-[10px] text-center font-mono text-red-300">Img Not Found</span>
                        
                        {/* VISUAL DEBUGGER */}
                        <div className="mt-2 p-1 bg-black/50 rounded w-full overflow-hidden">
                            <p className="text-[8px] text-gray-500">DB Path:</p>
                            <p className="text-[9px] font-mono text-white truncate select-all">{item.image_path}</p>
                            <a href={imageUrl} target="_blank" rel="noreferrer" className="block mt-1 text-[9px] text-blue-400 underline text-center">
                                Open Link
                            </a>
                        </div>
                    </div>
                )}
                
                {/* Zoom Icon overlay on hover */}
                {!imgError && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <ZoomIn className="text-white drop-shadow-md" size={24} />
                    </div>
                )}
                
                {isOwned && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm z-10">
                        <Check size={10} /> {language === 'es' ? 'Adquirido' : 'Owned'}
                    </div>
                )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{item.item}</h3>
                    <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider ${rarityClass}`}>
                        {item.rarity?.toUpperCase() || 'COMMON'}
                    </span>
                </div>
                
                {description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {description}
                    </p>
                )}
                
                <div className="mt-auto pt-1">
                    {isOwned ? (
                        <button disabled className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-xl font-medium text-sm cursor-default border border-transparent">
                            {language === 'es' ? 'Comprado' : 'Purchased'}
                        </button>
                    ) : (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent opening lightbox
                                onBuy(item);
                            }}
                            className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-primary-600/20"
                        >
                            <Lock size={14} />
                            {language === 'es' ? 'Comprar por' : 'Buy for'} {item.price} XP
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const Store: React.FC = () => {
  const { user, purchaseItem, storeItems, fetchStoreItems, getStoreImage, isStoreLoading } = useStore();
  const lang = user?.preferences?.language || 'en';
  const t = translations[lang] || translations['en'];
  
  useEffect(() => {
      fetchStoreItems();
  }, []);

  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null); // For purchase modal
  const [previewItem, setPreviewItem] = useState<StoreItem | null>(null); // For lightbox
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'buying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const initiateBuy = (item: StoreItem) => {
      if (!user) return;
      if (user.xp < item.price) {
          alert(t.store.notEnough); 
          return;
      }
      setPurchaseStatus('idle');
      setMessage('');
      setSelectedItem(item);
  };

  const confirmPurchase = async () => {
      if (!selectedItem) return;
      
      setPurchaseStatus('buying');
      const { success, error } = await purchaseItem(selectedItem);

      if (success) {
          setPurchaseStatus('success');
          setMessage(t.store.successBuy);
          setTimeout(() => {
              setSelectedItem(null);
              setPurchaseStatus('idle');
          }, 1500);
      } else {
          setPurchaseStatus('error');
          setMessage(error || "Transaction failed");
      }
  };

  const isOwned = (itemName: string) => user?.inventory?.includes(itemName);

  const itemsToDisplay = activeTab === 'shop' 
    ? storeItems 
    : storeItems.filter(item => isOwned(item.item));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 relative">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                <ShoppingBag size={32} className="text-white" />
             </div>
             <div>
                <h1 className="text-2xl font-bold">{t.store.title}</h1>
                <p className="text-white/80 text-sm">{t.store.subtitle}</p>
             </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/20">
             <Sparkles size={20} className="text-yellow-300" />
             <div className="flex flex-col">
                <span className="text-xs text-white/70 uppercase font-bold tracking-wider">{t.store.balance}</span>
                <span className="text-xl font-mono font-bold">{user?.xp.toLocaleString()} XP</span>
             </div>
          </div>
       </div>

       {/* Tabs */}
       <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-xl w-full max-w-md mx-auto">
          <button
             onClick={() => setActiveTab('shop')}
             className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                 activeTab === 'shop' 
                 ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm' 
                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
             }`}
          >
             <ShoppingBag size={16} />
             {t.store.tabs.shop}
          </button>
          <button
             onClick={() => setActiveTab('inventory')}
             className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                 activeTab === 'inventory' 
                 ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm' 
                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
             }`}
          >
             <Archive size={16} />
             {t.store.tabs.inventory}
          </button>
       </div>

       <div className="flex justify-end">
          <button 
            onClick={() => fetchStoreItems()} 
            className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 hover:text-primary-600 rounded-full flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} className={isStoreLoading ? "animate-spin" : ""} /> Refresh Store
          </button>
       </div>

       {/* Content Area */}
       {isStoreLoading ? (
           <div className="flex flex-col items-center justify-center py-12">
               <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
               <p className="text-gray-400">Loading store items...</p>
           </div>
       ) : itemsToDisplay.length === 0 ? (
           <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95">
               {activeTab === 'inventory' ? (
                    <>
                        <Archive size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{t.store.tabs.emptyInventory}</p>
                    </>
               ) : (
                    <>
                        <ImageOff size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Store is Empty</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No items found in the database.</p>
                        <button onClick={() => fetchStoreItems()} className="text-primary-600 hover:underline">Try Refreshing</button>
                    </>
               )}
           </div>
       ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
             {itemsToDisplay.map(item => (
                <StoreItemCard 
                    key={item.id} 
                    item={item} 
                    isOwned={!!isOwned(item.item)} 
                    onBuy={initiateBuy}
                    onImageClick={setPreviewItem}
                    getImage={getStoreImage}
                    language={lang}
                />
             ))}
          </div>
       )}

       {/* Purchase Modal */}
       {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl transform transition-all scale-100 border border-gray-200 dark:border-gray-700">
            {purchaseStatus === 'success' ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Check size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.store.successBuy}</h3>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Purchase</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                    Buy <strong>{selectedItem.item}</strong> for <span className="text-primary-600 dark:text-primary-400 font-bold">{selectedItem.price} XP</span>?
                </p>
                
                {purchaseStatus === 'error' && (
                    <div className="mb-4 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">
                        {message}
                    </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedItem(null)} 
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmPurchase} 
                    disabled={purchaseStatus === 'buying'}
                    className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-primary-600/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {purchaseStatus === 'buying' ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
       )}

       {/* LIGHTBOX PREVIEW MODAL */}
       {previewItem && (
           <div 
                className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
                onClick={() => setPreviewItem(null)}
           >
               <button 
                    className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                    onClick={() => setPreviewItem(null)}
                >
                   <X size={32} />
               </button>
               
               <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                   <img 
                        src={getStoreImage(previewItem.image_path)} 
                        alt={previewItem.item} 
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                    />
                   <div className="mt-6 text-center text-white max-w-lg">
                        <h3 className="text-2xl font-bold mb-1">{previewItem.item}</h3>
                        <p className="text-sm font-bold opacity-80 uppercase tracking-wider mb-2" style={{color: getRarityClass(previewItem.rarity).split(' ')[1]?.replace('text-', '#')}}>{previewItem.rarity}</p>
                        {/* Bilingual Description in Lightbox */}
                        {previewItem.description && (
                            <p className="text-white/80 text-sm leading-relaxed">
                                {lang === 'es' && previewItem.description_es ? previewItem.description_es : previewItem.description}
                            </p>
                        )}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
