
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Trophy, Flame, Brain, Archive, ZoomIn } from 'lucide-react';
import { translations } from '../lib/translations';

export const PublicProfileModal: React.FC = () => {
  const { publicProfile, closePublicProfile, storeItems, fetchStoreItems, getStoreImage, user } = useStore();
  const t = translations[user?.preferences?.language || 'en'] || translations['en'];
  const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

  useEffect(() => {
    // Ensure we have store items loaded to map IDs/Names to Images
    if (storeItems.length === 0) {
        fetchStoreItems();
    }
  }, []);

  if (!publicProfile) return null;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Map inventory strings to store items to get images
  const inventoryItems = (publicProfile.inventory || []).map(itemName => {
      return storeItems.find(i => i.item === itemName);
  }).filter(Boolean);

  return (
    <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100 relative">
                
                {/* Header / Cover */}
                <div className="h-24 bg-gradient-to-r from-primary-600 to-secondary-600 relative">
                    <button 
                        onClick={closePublicProfile}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Avatar & Name - Added 'z-20' to fix z-index stacking on top of header */}
                <div className="px-8 pb-8 -mt-12 relative z-20">
                    <div className="flex justify-between items-end">
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center shadow-lg">
                            {publicProfile.avatar_url ? (
                                <img src={publicProfile.avatar_url} alt={publicProfile.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-gray-500">{getInitials(publicProfile.full_name || 'Student')}</span>
                            )}
                        </div>
                        <div className="mb-2">
                            <div className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider text-right">Lvl {publicProfile.level || 1}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">Student</div>
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                        {publicProfile.full_name || 'Student'}
                    </h2>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                            <Trophy className="mx-auto mb-1 text-yellow-500" size={20} />
                            <div className="font-bold text-gray-900 dark:text-white">{publicProfile.lifetime_xp || publicProfile.xp || 0}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold">Total XP</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                            <Flame className="mx-auto mb-1 text-orange-500" size={20} />
                            <div className="font-bold text-gray-900 dark:text-white">{publicProfile.streak || 0}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold">{t.pomodoro.stats.streak}</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                            <Brain className="mx-auto mb-1 text-blue-500" size={20} />
                            <div className="font-bold text-gray-900 dark:text-white">{publicProfile.level || 1}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold">{t.pomodoro.stats.level}</div>
                        </div>
                    </div>

                    {/* Inventory Section */}
                    <div className="mt-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                            <Archive size={16} className="text-gray-400" />
                            {t.publicProfile.inventory}
                        </h3>
                        
                        {inventoryItems.length > 0 ? (
                            <div className="grid grid-cols-4 gap-3">
                                {inventoryItems.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 relative group cursor-zoom-in hover:border-primary-500 transition-colors" 
                                        title={item?.item}
                                        onClick={() => item && setPreviewImage({ url: getStoreImage(item.image_path), title: item.item })}
                                    >
                                        {item && (
                                            <img 
                                                src={getStoreImage(item.image_path)} 
                                                alt={item.item} 
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover" 
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <ZoomIn className="text-white" size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-sm">
                                {t.publicProfile.empty}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* LIGHTBOX OVERLAY */}
        {previewImage && (
            <div 
                className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
                onClick={() => setPreviewImage(null)}
            >
                <button 
                    className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                    onClick={() => setPreviewImage(null)}
                >
                    <X size={32} />
                </button>
                
                <div className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <img 
                        src={previewImage.url} 
                        alt={previewImage.title} 
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                    />
                    <div className="absolute bottom-[-50px] left-0 right-0 text-center text-white">
                        <h3 className="text-xl font-bold">{previewImage.title}</h3>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
