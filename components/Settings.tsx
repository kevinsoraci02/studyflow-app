
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { User, Moon, Sun, Clock, Save, Trash2, LogOut, AlertTriangle, X, CheckCircle2, AlertCircle, Globe, Camera, CreditCard, Zap, Mail, Copy } from 'lucide-react';
import { translations, Language } from '../lib/translations';

export const Settings: React.FC = () => {
  const { user, updateUser, uploadAvatar, darkMode, toggleDarkMode, logout, resetUserData } = useStore();
  
  const [name, setName] = useState(user?.full_name || '');
  const [focusTime, setFocusTime] = useState(user?.preferences?.focusDuration || 25);
  const [shortBreak, setShortBreak] = useState(user?.preferences?.shortBreakDuration || 5);
  const [longBreak, setLongBreak] = useState(user?.preferences?.longBreakDuration || 15);
  const [language, setLanguage] = useState<Language>(user?.preferences?.language || 'en');
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const MP_LINK = "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=e3b25ace34ae4a4290b9df871be6dbde";

  // Avatar State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const t = translations[language] || translations['en'];

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setFocusTime(user.preferences?.focusDuration || 25);
      setShortBreak(user.preferences?.shortBreakDuration || 5);
      setLongBreak(user.preferences?.longBreakDuration || 15);
      setLanguage(user.preferences?.language || 'en');
      // Clear local preview when user data syncs from server
      if (!uploadingAvatar) setLocalPreview(null);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit to 1MB (Updated)
      if (file.size > 1 * 1024 * 1024) {
          alert(t.settings.fileTooLarge.replace('{size}', '1'));
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      // 1. Show immediate local preview
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      setUploadingAvatar(true);

      // 2. Upload in background
      const { success, error } = await uploadAvatar(file);
      
      setUploadingAvatar(false);
      if (!success) {
        alert(`Failed to upload avatar: ${error}`);
        setLocalPreview(null); // Revert on error
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setErrorMessage('');
    
    const updatedPreferences = {
      focusDuration: focusTime,
      shortBreakDuration: shortBreak,
      longBreakDuration: longBreak,
      theme: user?.preferences?.theme || 'dark',
      language: language
    };

    const result = await updateUser({
      full_name: name,
      preferences: updatedPreferences
    });
    
    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setErrorMessage(result.error || "Failed to save changes.");
    }
  };

  const handleConfirmReset = async () => {
    setResetStatus('loading');
    const { success, error } = await resetUserData();
    
    if (success) {
      setResetStatus('success');
      setResetMessage("All data erased successfully.");
      setTimeout(() => {
        setShowResetModal(false);
        setResetStatus('idle');
        // Reset language state
        setLanguage('en');
      }, 2000);
    } else {
      setResetStatus('error');
      setResetMessage(error || "Failed to reset data.");
    }
  };

  const handleUpgradeClick = () => {
      window.open(MP_LINK, '_blank');
      setShowPaymentModal(true);
  };

  // Determine which image to show: Local Preview > Server URL > Fallback
  const displayImage = localPreview || user?.avatar_url;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.settings.title}</h1>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut size={16} />
          {t.sidebar.logout}
        </button>
      </div>

      {/* SUBSCRIPTION CARD */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 shadow-lg text-white overflow-hidden relative">
          <div className="flex justify-between items-center relative z-10">
              <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                      <CreditCard size={20} className="text-white" />
                      {t.settings.subscription}
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                      {t.settings.plan}: 
                      <span className="font-bold ml-1 text-white uppercase tracking-wide">
                          {user?.is_pro ? t.settings.pro : t.settings.free}
                      </span>
                  </p>
              </div>
              {user?.is_pro ? (
                  <div className="bg-white/20 p-2 rounded-full border border-white/30">
                      <CheckCircle2 size={28} className="text-white" />
                  </div>
              ) : (
                  <button 
                    onClick={handleUpgradeClick}
                    className="bg-white text-primary-600 font-bold py-2 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                  >
                      <Zap size={18} fill="currentColor" />
                      {t.settings.upgradeBtn}
                  </button>
              )}
          </div>
          
          {/* Decorative Circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={20} className="text-primary-500" />
            {t.settings.profile}
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center sm:flex-row gap-6">
             <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center relative">
                  {displayImage ? (
                     <img 
                        src={displayImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover transition-opacity duration-300"
                        key={displayImage} // Force re-render on change
                        onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('fallback-active');
                        }}
                     />
                  ) : (
                     <User size={40} className="text-gray-400" />
                  )}
                  
                  {/* Spinner Overlay */}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                       <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors group-hover:scale-110 z-20"
                  title="Change Avatar"
                >
                  <Camera size={16} />
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
             </div>
             <div className="flex-1 w-full grid grid-cols-1 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.settings.fullName}</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.settings.email}</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 dark:bg-gray-800 dark:border-gray-600 cursor-not-allowed bg-white dark:text-gray-400"
                    />
                </div>
             </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={20} className="text-primary-500" />
            {t.settings.timerSettings}
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.settings.focusDuration}</label>
              <input
                type="number"
                min="1"
                max="60"
                value={focusTime}
                onChange={(e) => setFocusTime(Number(e.target.value))}
                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.settings.shortBreak}</label>
              <input
                type="number"
                min="1"
                max="30"
                value={shortBreak}
                onChange={(e) => setShortBreak(Number(e.target.value))}
                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.settings.longBreak}</label>
              <input
                type="number"
                min="5"
                max="60"
                value={longBreak}
                onChange={(e) => setLongBreak(Number(e.target.value))}
                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
             {/* Language Selector */}
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                 <Globe size={16} /> {t.settings.language}
               </label>
               <select 
                 value={language}
                 onChange={(e) => setLanguage(e.target.value as Language)}
                 className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
               >
                 <option value="en">English 🇺🇸</option>
                 <option value="es">Español 🇪🇸</option>
               </select>
             </div>
          </div>

          {saveStatus === 'error' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3">
               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.settings.theme}</span>
               <button
                 type="button"
                 onClick={toggleDarkMode}
                 className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
               >
                 {darkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-gray-500" />}
               </button>
             </div>

             <button
               type="submit"
               disabled={saveStatus === 'saving'}
               className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-xl transition-all transform active:scale-95 shadow-lg shadow-primary-600/20 ${
                 saveStatus === 'success' 
                   ? 'bg-green-500 text-white hover:bg-green-600'
                   : 'bg-primary-600 text-white hover:bg-primary-700'
               }`}
             >
               {saveStatus === 'saving' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle2 size={18} />
                    {t.settings.saved}
                  </>
               ) : (
                  <>
                    <Save size={18} />
                    {t.settings.save}
                  </>
               )}
             </button>
          </div>
        </div>
      </form>

      <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6">
        <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2 flex items-center gap-2">
          <Trash2 size={18} />
          {t.settings.dangerZone}
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400/80 mb-4">
          {t.settings.resetText}
        </p>
        <button 
           onClick={() => {
             setResetStatus('idle');
             setShowResetModal(true);
           }}
           className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
        >
          {t.settings.resetBtn}
        </button>
      </div>

      {/* Custom Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all scale-100">
            
            {resetStatus === 'success' ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 size={48} className="mx-auto text-green-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Success!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{resetMessage}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                  </div>
                  <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={20} />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.settings.dangerZone}?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  {t.settings.resetText}
                </p>

                {resetStatus === 'error' && (
                   <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
                     {resetMessage}
                   </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowResetModal(false)}
                    disabled={resetStatus === 'loading'}
                    className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmReset}
                    disabled={resetStatus === 'loading'}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resetStatus === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Instruction Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-200 dark:border-gray-700 relative text-center">
                <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="text-green-600 dark:text-green-400" size={32} />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.settings.paymentModal.title}</h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {t.settings.paymentModal.instruction}
                </p>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 text-left">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t.settings.paymentModal.step1}</p>
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="font-mono text-sm text-gray-800 dark:text-gray-200 select-all">kevinsoraci02@gmail.com</span>
                        <button 
                            onClick={() => navigator.clipboard.writeText("kevinsoraci02@gmail.com")}
                            className="text-primary-600 hover:text-primary-700 p-1"
                            title="Copy"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-left mb-6">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <p>{t.settings.paymentModal.note}</p>
                </div>

                <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                    {t.settings.paymentModal.close}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
