
import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Trophy, Sparkles, BookOpen, AlertTriangle, Check, X, MessageCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calculateSessionXP } from '../lib/gameUtils';
import { translations } from '../lib/translations';
import { AIChat } from './AIChat';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export const Pomodoro: React.FC = () => {
  const { addSession, user, subjects } = useStore();
  const t = translations[user?.preferences?.language || 'en'] || translations['en'];
  
  // Default values fallbacks
  const preferences = user?.preferences || {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15
  };

  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(preferences.focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [error, setError] = useState('');
  
  // Chat Modal State
  const [showChatModal, setShowChatModal] = useState(false);
  
  const streak = user?.streak || 0;

  const modes = {
    focus: { label: t.pomodoro.modes.focus, minutes: preferences.focusDuration, color: 'text-primary-600', bg: 'bg-primary-600' },
    shortBreak: { label: t.pomodoro.modes.shortBreak, minutes: preferences.shortBreakDuration, color: 'text-green-600', bg: 'bg-green-600' },
    longBreak: { label: t.pomodoro.modes.longBreak, minutes: preferences.longBreakDuration, color: 'text-blue-600', bg: 'bg-blue-600' }
  };

  // Update timer if preferences change or mode changes
  // FIX: Removed isActive from dependency array so pausing doesn't reset the timer
  useEffect(() => {
      const newMinutes = modes[mode].minutes;
      setTimeLeft(newMinutes * 60);
      setIsActive(false); // Stop timer if settings/mode change
      setError('');
  }, [user?.preferences, mode]); 

  // Anti-Distraction: Reset timer if user switches tabs while focusing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive && mode === 'focus') {
        setIsActive(false);
        setTimeLeft(modes.focus.minutes * 60);
        
        // Notify the user why it happened
        if (Notification.permission === 'granted') {
            new Notification("Focus Reset", { body: "Timer reset because you left the app." });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, mode, modes.focus.minutes]);

  const handleTimerComplete = useCallback(() => {
    if (!isActive) return; // Prevent double firing
    
    setIsActive(false);
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(() => {}); 

    if (mode === 'focus') {
      const duration = modes.focus.minutes;
      addSession({
        duration_minutes: duration,
        started_at: new Date(Date.now() - duration * 60000).toISOString(),
        completed: true,
        focus_score: 10,
        subject_id: selectedSubjectId || undefined // Link session to subject if selected
      });
      
      if (Notification.permission === 'granted') {
        const xp = calculateSessionXP(duration);
        new Notification(t.pomodoro.notification, { body: t.pomodoro.notificationBody.replace('{xp}', xp.toString()) });
      }
    }
  }, [mode, addSession, modes.focus.minutes, t, selectedSubjectId, isActive]);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, handleTimerComplete]);

  const handleStartClick = () => {
    if (isActive) {
      setIsActive(false); // Pause immediately if running
    } else {
      // Validation: User must select a subject for Focus mode
      if (mode === 'focus' && !selectedSubjectId) {
        setError(t.pomodoro.selectSubjectRequired);
        return;
      }
      setError('');

      // If starting (not resuming from pause logic, though simple toggle is fine here)
      // We show warning if starting a FOCUS session
      if (mode === 'focus') {
        setShowStartConfirm(true);
      } else {
        confirmStart();
      }
    }
  };

  const confirmStart = () => {
    if (!isActive && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    setShowStartConfirm(false);
    setIsActive(true);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modes[mode].minutes * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    // Effect hook above handles the time reset
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 100 - (timeLeft / (modes[mode].minutes * 60)) * 100;
  const potentialXP = calculateSessionXP(modes.focus.minutes);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] relative">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        
        {/* Mode Selectors */}
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl mb-8">
          {(Object.keys(modes) as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === m 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {modes[m].label}
            </button>
          ))}
        </div>

        {/* Subject Selector - Only visible in Focus mode */}
        {mode === 'focus' && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2">
             <div className="relative">
               <BookOpen className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${error ? 'text-red-500' : 'text-gray-400'}`} size={18} />
               <select 
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setError(''); // Clear error on selection
                  }}
                  disabled={isActive}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 outline-none appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                    error 
                      ? 'border-red-300 focus:ring-red-200 ring-2 ring-red-100' 
                      : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500'
                  }`}
               >
                  <option value="">{t.subjects.selectSubject || "Select Subject (Optional)"}</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
               </select>
             </div>
             {error && (
               <p className="text-red-500 text-xs mt-2 ml-1 flex items-center gap-1 animate-pulse">
                 <AlertTriangle size={12} />
                 {error}
               </p>
             )}
          </div>
        )}

        {/* Timer Circle */}
        <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-100 dark:text-gray-700"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              className={`${modes[mode].color} transition-all duration-1000 ease-linear`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-6xl font-bold text-gray-900 dark:text-white font-mono tracking-tighter">
              {formatTime(timeLeft)}
            </div>
            <div className="text-gray-500 dark:text-gray-400 mt-2 font-medium uppercase tracking-wide text-sm">
              {isActive ? t.pomodoro.focusing : t.pomodoro.paused}
            </div>
          </div>
        </div>

        {/* XP Preview */}
        {mode === 'focus' && !isActive && (
           <div className="flex items-center justify-center gap-2 mb-6 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 py-1.5 px-3 rounded-full w-fit mx-auto">
             <Sparkles size={14} />
             <span>{t.pomodoro.earnXP.replace('{xp}', potentialXP.toString())}</span>
           </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
           <button 
            onClick={handleStartClick}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${modes[mode].bg}`}
           >
             {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
           </button>
           <button 
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
           >
             <RotateCcw size={20} />
           </button>
        </div>

        {/* Gamification Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center text-orange-500 mb-1">
              <Trophy size={18} />
            </div>
            <div className="text-lg font-bold dark:text-white">{streak}</div>
            <div className="text-xs text-gray-500">{t.pomodoro.stats.streak}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-primary-500 mb-1">
              <Brain size={18} />
            </div>
            <div className="text-lg font-bold dark:text-white">Lvl {user?.level || 1}</div>
            <div className="text-xs text-gray-500">{t.pomodoro.stats.level}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-blue-500 mb-1">
              <Coffee size={18} />
            </div>
            <div className="text-lg font-bold dark:text-white">{modes.shortBreak.minutes}m</div>
            <div className="text-xs text-gray-500">{t.pomodoro.stats.nextBreak}</div>
          </div>
        </div>
      </div>
      
      {/* AI Assistant Floating Button */}
      <button 
        onClick={() => setShowChatModal(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-20"
        title={t.dashboard.chatTutor}
      >
        <MessageCircle size={28} />
      </button>

      {/* AI Chat Popup Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transform transition-all scale-100">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-primary-500" size={20} />
                        <h3 className="font-bold text-gray-900 dark:text-white">{t.chat.title}</h3>
                    </div>
                    <button 
                        onClick={() => setShowChatModal(false)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <AIChat variant="popup" />
                </div>
            </div>
        </div>
      )}

      {/* Start Confirmation Modal */}
      {showStartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all scale-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <AlertTriangle size={24} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <button onClick={() => setShowStartConfirm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={20} />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {t.pomodoro.startWarning.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                    {t.pomodoro.startWarning.message}
                </p>
                
                <div className="space-y-2 mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                    {t.pomodoro.startWarning.checklist.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={14} className="text-green-500" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowStartConfirm(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t.pomodoro.startWarning.cancel}
                  </button>
                  <button 
                    onClick={confirmStart}
                    className="flex-1 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-600/20"
                  >
                    {t.pomodoro.startWarning.confirm}
                  </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
