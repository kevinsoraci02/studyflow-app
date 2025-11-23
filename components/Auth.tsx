
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { ArrowRight, ArrowLeft, Mail, Lock, User, AlertCircle, Globe, Info } from 'lucide-react';
import { translations, Language } from '../lib/translations';

// --- CONFIGURATION ---
// REPLACE THIS URL WITH YOUR UPLOADED LOGO URL
const APP_LOGO_URL = "https://yqthvrupdpxfnmvuvkgi.supabase.co/storage/v1/object/public/store-images/Gemini_Generated_Image_d6fa4pd6fa4pd6fa.png"; 
// ---------------------

// Simple Google Logo SVG Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.21H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export const Auth: React.FC = () => {
  const { login, signup } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [tempLang, setTempLang] = useState<Language>('en');
  
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const t = translations[tempLang];

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // We force redirect to current origin to handle sandbox environments correctly
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'online',
            prompt: 'select_account'
          }
        }
      });
      
      if (error) throw error;
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setErrorMsg(err.message || 'Error initiating Google login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await login(email);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, preferences: { language: tempLang } }
          }
        });
        if (error) throw error;
        
        // Check if we need email confirmation (User created but no session)
        if (data.user && !data.session) {
           setNeedsConfirmation(true);
           setIsLoading(false);
        } else {
           // Auto-confirmed or session active immediately
           await signup(email, name);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  if (needsConfirmation) {
     return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="text-green-600 dark:text-green-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t.auth.checkEmail}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    {t.auth.checkEmailSubtitle.replace('{email}', email)}
                </p>
                <button 
                   onClick={() => {
                       setNeedsConfirmation(false);
                       setIsLogin(true);
                   }}
                   className="w-full bg-white border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} />
                    {t.auth.backToSignIn}
                </button>
            </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 w-full relative">
          
          <div className="absolute top-4 right-4">
             <button 
                onClick={() => setTempLang(l => l === 'en' ? 'es' : 'en')}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600"
             >
                <Globe size={14} />
                {tempLang.toUpperCase()}
             </button>
          </div>

          <div className="flex items-center gap-3 mb-8 justify-center">
            {/* CUSTOM LOGO */}
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-primary-600/20">
               <img src={APP_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
              StudyFlow AI
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            {isLogin ? t.auth.welcomeBack : t.auth.createAccount}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            {isLogin ? t.auth.signInSubtitle : t.auth.signUpSubtitle}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
             {/* Google Button */}
             <button
                onClick={handleGoogleLogin}
                className="w-full bg-white text-gray-700 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 font-medium py-3 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-3"
             >
                <GoogleIcon />
                {t.auth.googleSignIn}
             </button>

             <div className="relative flex items-center justify-center">
                <div className="absolute border-t border-gray-200 dark:border-gray-700 w-full"></div>
                <span className="relative bg-white dark:bg-gray-800 px-3 text-xs text-gray-400 uppercase tracking-wider">
                   {t.auth.orContinueWith}
                </span>
             </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder={t.auth.fullName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder={t.auth.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder={t.auth.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:bg-gray-700/50 dark:border-gray-600 dark:text-white"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? t.auth.signIn : t.auth.createAccount}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLogin ? t.auth.noAccount + " " : t.auth.hasAccount + " "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {isLogin ? t.auth.signUp : t.auth.signIn}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
