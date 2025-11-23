
import React from 'react';
import { useStore } from '../store/useStore';
import { ViewMode } from '../types';
import { calculateProgress, calculateXPForNextLevel, calculateXPForCurrentLevel } from '../lib/gameUtils';
import { translations } from '../lib/translations';
import { 
  LayoutDashboard, 
  BookOpen, 
  Timer, 
  Bot, 
  BarChart2, 
  Settings,
  LogOut,
  Trophy,
  User,
  ShoppingBag
} from 'lucide-react';

// --- CONFIGURATION ---
// REPLACE THIS URL WITH YOUR UPLOADED LOGO URL
const APP_LOGO_URL = "https://yqthvrupdpxfnmvuvkgi.supabase.co/storage/v1/object/public/store-images/Gemini_Generated_Image_d6fa4pd6fa4pd6fa.png"; 
// ---------------------

interface NavItemProps {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  active, 
  icon: Icon, 
  label, 
  onClick 
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col md:flex-row items-center md:justify-start md:space-x-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 font-medium' 
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <Icon size={24} className={active ? "stroke-[2.5px]" : "stroke-2"} />
    <span className="text-[10px] md:text-sm mt-1 md:mt-0">{label}</span>
  </button>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentView, setView, user, logout } = useStore();
  const lang = user?.preferences?.language || 'en';
  const t = translations[lang] || translations['en'];

  const navItems: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: t.sidebar.dashboard, icon: LayoutDashboard },
    { id: 'subjects', label: t.sidebar.subjects, icon: BookOpen },
    { id: 'pomodoro', label: t.sidebar.focus, icon: Timer },
    { id: 'ai-tutor', label: t.sidebar.aiTutor, icon: Bot },
    { id: 'analytics', label: t.sidebar.analytics, icon: BarChart2 },
    { id: 'leaderboard', label: t.sidebar.leaderboard, icon: Trophy },
    { id: 'store', label: t.sidebar.store, icon: ShoppingBag },
  ];

  // Use lifetime XP for level progress
  const xp = user?.lifetime_xp || user?.xp || 0;
  const progress = calculateProgress(xp);
  const nextLevelXP = calculateXPForNextLevel(user?.level || 1);
  const currentLevelBaseXP = calculateXPForCurrentLevel(user?.level || 1);
  const xpInLevel = xp - currentLevelBaseXP;
  const xpNeededInLevel = nextLevelXP - currentLevelBaseXP;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 shadow-sm transition-colors duration-300 h-full">
        <div className="p-6 flex items-center space-x-3 flex-shrink-0">
          {/* CUSTOM LOGO AREA */}
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary-600/20">
            <img 
              src={APP_LOGO_URL} 
              alt="App Logo" 
              className="w-full h-full object-contain bg-white dark:bg-gray-900" 
            />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
            StudyFlow
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto min-h-0">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              active={currentView === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => setView(item.id)}
            />
          ))}
          <div className="pt-4">
            <NavItem 
                active={currentView === 'settings'}
                icon={Settings}
                label={t.sidebar.settings}
                onClick={() => setView('settings')}
            />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
          <div className="flex flex-col gap-3 mb-4">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden border-2 border-transparent">
                         {user?.avatar_url ? (
                             <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={16} /></div>
                         )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user?.full_name?.split(' ')[0] || 'Guest'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                        {user?.email}
                        </span>
                    </div>
                </div>
                <div className="text-xs text-primary-600 dark:text-primary-400 font-bold bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded-full flex-shrink-0">
                  Lvl {user?.level || 1}
                </div>
             </div>

             {/* XP Progress Bar */}
             <div className="px-2">
               <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                 <span>{Math.max(0, Math.floor(xpInLevel))}</span>
                 <span>{Math.max(1, Math.floor(xpNeededInLevel))} XP</span>
               </div>
               <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${isNaN(progress) ? 0 : progress}%` }}
                 />
               </div>
             </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center w-full space-x-3 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>{t.sidebar.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-20 flex-shrink-0">
          <div className="flex items-center space-x-2">
             {/* CUSTOM LOGO MOBILE */}
             <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src={APP_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
             </div>
             <span className="font-bold text-lg dark:text-white">StudyFlow</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-transparent">
                 {user?.avatar_url ? (
                     <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={16} /></div>
                 )}
             </div>
             <button 
                onClick={() => setView('settings')}
                className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
             >
                <Settings size={20} />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto w-full pb-20 md:pb-0">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden absolute bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 z-30 pb-safe safe-area-pb overflow-x-auto">
           {navItems.map((item) => (
            <NavItem
              key={item.id}
              active={currentView === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => setView(item.id)}
            />
          ))}
        </nav>
      </main>
    </div>
  );
};
