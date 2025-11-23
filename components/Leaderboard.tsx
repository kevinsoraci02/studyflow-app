
import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Trophy, Medal, Crown, User, Flame } from 'lucide-react';
import { translations } from '../lib/translations';
import { PublicProfileModal } from './PublicProfileModal';

export const Leaderboard: React.FC = () => {
  const { leaderboard, fetchLeaderboard, user, fetchPublicProfile, publicProfile } = useStore();
  const t = translations[user?.preferences?.language || 'en'] || translations['en'];

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const renderAvatar = (u: any, sizeClass: string) => {
      if (u.avatar_url) {
          return <img src={u.avatar_url} alt={u.full_name} className={`${sizeClass} rounded-full object-cover border-2 border-transparent`} />;
      }
      return (
         <div className={`${sizeClass} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold border-2 border-transparent`}>
            {getInitials(u.full_name || 'User')}
         </div>
      );
  };

  const handleUserClick = (userId: string) => {
      fetchPublicProfile(userId);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
       <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
            <Trophy className="text-yellow-600 dark:text-yellow-400" size={28} />
          </div>
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.leaderboard.title}</h1>
             <p className="text-gray-500 dark:text-gray-400 text-sm">{t.leaderboard.topStudents}</p>
          </div>
       </div>

       {leaderboard.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
             <p className="text-gray-500 dark:text-gray-400">{t.leaderboard.noData}</p>
          </div>
       ) : (
          <>
             {/* Podium */}
             <div className="flex justify-center items-end gap-4 mb-12 h-64">
                {topThree[1] && (
                   <div 
                     onClick={() => handleUserClick(topThree[1].id)}
                     className="flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700 delay-100 cursor-pointer hover:scale-105 transition-transform"
                   >
                      <div className="relative mb-3">
                         <div className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full border-4 border-gray-300 dark:border-gray-600 shadow-lg">
                            {renderAvatar(topThree[1], "w-16 h-16")}
                         </div>
                         <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">2</div>
                      </div>
                      <div className="bg-gray-300 dark:bg-gray-700 w-24 h-32 rounded-t-xl flex flex-col items-center justify-end p-4 shadow-md">
                          <p className="font-bold text-sm text-center text-gray-800 dark:text-white truncate w-full">{topThree[1].full_name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">{topThree[1].xp} XP</p>
                      </div>
                   </div>
                )}

                {topThree[0] && (
                   <div 
                     onClick={() => handleUserClick(topThree[0].id)}
                     className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-10 duration-700 cursor-pointer hover:scale-105 transition-transform"
                   >
                      <Crown className="text-yellow-500 mb-2 animate-bounce" size={32} />
                      <div className="relative mb-3">
                         <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full border-4 border-yellow-500 shadow-xl shadow-yellow-500/20">
                             {renderAvatar(topThree[0], "w-20 h-20")}
                         </div>
                         <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">1</div>
                      </div>
                      <div className="bg-gradient-to-b from-yellow-400 to-yellow-500 w-28 h-44 rounded-t-xl flex flex-col items-center justify-end p-4 shadow-lg shadow-yellow-500/20">
                          <p className="font-bold text-white text-center truncate w-full text-lg">{topThree[0].full_name}</p>
                          <p className="text-sm text-yellow-50 font-mono font-bold">{topThree[0].xp} XP</p>
                      </div>
                   </div>
                )}

                {topThree[2] && (
                   <div 
                     onClick={() => handleUserClick(topThree[2].id)}
                     className="flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700 delay-200 cursor-pointer hover:scale-105 transition-transform"
                   >
                      <div className="relative mb-3">
                         <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded-full border-4 border-orange-400 shadow-lg">
                            {renderAvatar(topThree[2], "w-16 h-16")}
                         </div>
                         <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</div>
                      </div>
                      <div className="bg-orange-300 dark:bg-orange-800 w-24 h-24 rounded-t-xl flex flex-col items-center justify-end p-4 shadow-md">
                          <p className="font-bold text-sm text-center text-orange-900 dark:text-orange-100 truncate w-full">{topThree[2].full_name}</p>
                          <p className="text-xs text-orange-800 dark:text-orange-200 font-mono">{topThree[2].xp} XP</p>
                      </div>
                   </div>
                )}
             </div>

             {/* Ranking List */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {rest.map((entry, index) => {
                   const rank = index + 4;
                   const isMe = entry.id === user?.id;
                   return (
                     <div 
                        key={entry.id} 
                        onClick={() => handleUserClick(entry.id)}
                        className={`flex items-center p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${isMe ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                     >
                        <div className="w-8 font-bold text-gray-400 text-center">{rank}</div>
                        <div className="flex items-center gap-3 flex-1 ml-4">
                           <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-gray-600">
                              {renderAvatar(entry, "w-full h-full")}
                           </div>
                           <div>
                              <p className={`font-medium ${isMe ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                                 {entry.full_name} {isMe && '(You)'}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                 <span className="flex items-center gap-1 text-orange-500"><Flame size={10} /> {entry.streak || 0}</span>
                                 <span>Lvl {entry.level || 1}</span>
                              </div>
                           </div>
                        </div>
                        <div className="font-mono font-bold text-gray-700 dark:text-gray-300">
                           {entry.xp.toLocaleString()} XP
                        </div>
                     </div>
                   );
                })}
             </div>
          </>
       )}

       {publicProfile && <PublicProfileModal />}
    </div>
  );
};
