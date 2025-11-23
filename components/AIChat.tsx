
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, Sparkles, X, FileText, Image as ImageIcon, Trash2, Lock, Zap } from 'lucide-react';
import { createChatSession, sendChatMessage } from '../services/geminiService';
import { GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { useStore } from '../store/useStore';
import { ChatMessage, ChatAttachment } from '../types';
import { translations } from '../lib/translations';

interface AIChatProps {
  variant?: 'full' | 'popup';
}

export const AIChat: React.FC<AIChatProps> = ({ variant = 'full' }) => {
  const { chatHistory, fetchChatHistory, saveChatMessage, uploadFile, user, clearChatHistory, checkDailyLimit, setView } = useStore();
  const t = translations[user?.preferences?.language || 'en'] || translations['en'];
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64File, setBase64File] = useState<{ data: string, mimeType: string } | null>(null);

  // Confirm Clear State
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Limit State
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Check limit on mount and updates
  useEffect(() => {
      checkLimit();
  }, [user?.daily_messages_count, user?.is_pro]);

  const checkLimit = async () => {
      const canSend = await checkDailyLimit();
      setIsLimitReached(!canSend);
  };

  // Load history on mount
  useEffect(() => {
    if (chatHistory.length === 0) {
      fetchChatHistory();
    }
  }, []);

  // Initialize Gemini session with loaded history
  useEffect(() => {
    chatSessionRef.current = createChatSession(chatHistory, user?.preferences?.language || 'en');
    scrollToBottom();
  }, [chatHistory.length === 0, user?.preferences?.language]); 

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, streamingText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit to 5MB (Updated)
      if (file.size > 5 * 1024 * 1024) {
          alert(t.chat.fileTooLarge.replace('{size}', '5'));
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Convert to Base64 for Gemini
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setBase64File({
            data: base64Data,
            mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setBase64File(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearChat = async () => {
      await clearChatHistory();
      chatSessionRef.current = createChatSession([], user?.preferences?.language || 'en');
      setShowClearConfirm(false);
  };

  const handleSend = async () => {
    // DOUBLE CHECK LIMIT BEFORE SENDING
    const canSend = await checkDailyLimit();
    if (!canSend) {
        setIsLimitReached(true);
        return;
    }

    if ((!input.trim() && !selectedFile) || isLoading) return;

    setIsLoading(true);
    let attachmentData: ChatAttachment | undefined = undefined;
    let uploadedUrl = '';

    if (selectedFile) {
        const url = await uploadFile(selectedFile);
        if (url) {
            uploadedUrl = url;
            attachmentData = {
                url: url,
                name: selectedFile.name,
                type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
                mimeType: selectedFile.type
            };
        }
    }

    const userMsg: ChatMessage = { 
        id: crypto.randomUUID(), 
        role: 'user', 
        text: input,
        timestamp: Date.now(),
        attachment: attachmentData
    };

    setInput('');
    clearFile();

    await saveChatMessage(userMsg);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession(chatHistory, user?.preferences?.language || 'en');
      }

      const streamResult = await sendChatMessage(
        chatSessionRef.current, 
        userMsg.text, 
        base64File ? base64File : undefined
      );
      
      let fullText = "";
      for await (const chunk of streamResult) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || "";
        fullText += textChunk;
        setStreamingText(fullText);
      }
      
      const modelMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: fullText,
        timestamp: Date.now()
      };
      
      // FIX: Clear streaming text BEFORE saving to history to prevent double-bubble glitch
      setStreamingText(''); 
      await saveChatMessage(modelMsg);

    } catch (error) {
      console.error("Chat Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cleanText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\n\n!\[.*?\]\(.*?\)$/, '') 
      .replace(/\n\n\[Attached File: .*?\]\(.*?\)$/, '')
      .trim();
  };

  // Dynamic classes based on variant
  const containerClass = variant === 'full' 
    ? "flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    : "flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden"; // Popup mode fills parent

  return (
    <div className={containerClass}>
      {/* Header - Only show in full mode, popup has its own header */}
      {variant === 'full' && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="text-white" size={20} />
              </div>
              <div>
                  <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {t.chat.title} 
                      {user?.is_pro && <span className="text-[10px] bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full">PRO</span>}
                  </h2>
              </div>
            </div>
            
            {/* Clear Chat Button */}
            {chatHistory.length > 0 && (
                <div className="flex items-center">
                    {showClearConfirm ? (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg animate-in slide-in-from-right-5">
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">{t.chat.confirmClear}</span>
                            <button onClick={handleClearChat} className="text-red-600 hover:text-red-800 dark:hover:text-red-300 font-bold text-xs bg-white dark:bg-red-900/50 px-2 py-1 rounded border border-red-200 dark:border-red-800">Yes</button>
                            <button onClick={() => setShowClearConfirm(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowClearConfirm(true)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t.chat.clear}
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 relative">
        
        {/* Limit Overlay */}
        {isLimitReached && (
            <div className="absolute inset-x-4 bottom-4 z-20">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 text-center animate-in slide-in-from-bottom-10">
                   <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                       <Lock className="text-amber-600 dark:text-amber-400" size={24} />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.chat.limitReached}</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                       {t.chat.limitMessage}
                   </p>
                   <button 
                      onClick={() => setView('settings')}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                   >
                       <Zap size={18} fill="currentColor" />
                       {t.chat.upgrade}
                   </button>
               </div>
            </div>
        )}

        {chatHistory.length === 0 && !streamingText && (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center p-8">
                <Bot size={48} className="mb-4 opacity-50 text-primary-500" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{t.chat.noMessages}</p>
                <p className="text-sm">{t.chat.subtitle}</p>
             </div>
        )}

        {chatHistory.map((msg) => {
          const displayText = cleanText(msg.text);
          if (!displayText && !msg.attachment) return null;

          return (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-primary-100 dark:bg-primary-900/30'
              }`}>
                {msg.role === 'user' ? <User size={16} className="text-gray-600 dark:text-gray-300" /> : <Bot size={16} className="text-primary-600 dark:text-primary-400" />}
              </div>
              
              <div className={`flex flex-col max-w-[85%] md:max-w-[75%]`}>
                 <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                   msg.role === 'user' 
                     ? 'bg-primary-600 text-white rounded-tr-none' 
                     : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
                 }`}>
                   {msg.attachment && (
                      <div className="mb-2">
                          {msg.attachment.type === 'image' ? (
                              <img src={msg.attachment.url} alt="attachment" className="max-w-full rounded-lg max-h-48 object-cover border border-white/20" />
                          ) : (
                              <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/10 dark:bg-white/10 p-2 rounded-lg hover:bg-black/20 transition-colors">
                                  <FileText size={16} />
                                  <span className="truncate text-xs underline">{msg.attachment.name}</span>
                              </a>
                          )}
                      </div>
                   )}
  
                   {displayText && (
                     <ReactMarkdown 
                        className={`prose max-w-none prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1 break-words ${
                            msg.role === 'user' ? 'prose-invert text-white' : 'dark:prose-invert'
                        }`}
                        components={{
                            a: ({node, ...props}) => <a {...props} className="underline font-semibold" target="_blank" rel="noopener noreferrer" />
                        }}
                     >
                       {displayText}
                     </ReactMarkdown>
                   )}
                 </div>
              </div>
            </div>
          );
        })}
        
        {streamingText && (
          <div className="flex gap-4 flex-row">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex flex-col max-w-[85%] md:max-w-[75%]">
               <div className="px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700">
                   <ReactMarkdown className="prose dark:prose-invert max-w-none prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1">
                     {streamingText}
                   </ReactMarkdown>
               </div>
               <span className="text-xs text-gray-400 mt-1 ml-1 animate-pulse">{t.chat.generating}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {!user?.is_pro && (
            <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-3">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            (user?.daily_messages_count || 0) >= 10 ? 'bg-red-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(100, ((user?.daily_messages_count || 0) / 10) * 100)}%` }}
                    />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {t.chat.messagesLeft.replace('{count}', (user?.daily_messages_count || 0).toString())}
                </span>
            </div>
        )}

        {selectedFile && (
            <div className="mb-2 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 w-fit px-3 py-1.5 rounded-full">
                {selectedFile.type.startsWith('image/') ? <ImageIcon size={14} className="text-purple-500" /> : <FileText size={14} className="text-blue-500" />}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[200px] truncate">{selectedFile.name}</span>
                <button onClick={clearFile} className="ml-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><X size={12} /></button>
            </div>
        )}

        <div className={`flex items-end gap-2 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-2xl border border-transparent focus-within:border-primary-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all ${isLimitReached ? 'opacity-50 pointer-events-none' : ''}`}>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.txt,.md"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" 
            title={t.chat.attachTooltip}
          >
            <Paperclip size={20} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isLimitReached ? t.chat.limitReached : t.chat.placeholder}
            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white resize-none max-h-32 py-2.5 text-sm"
            rows={1}
            style={{ minHeight: '44px' }}
            disabled={isLimitReached}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedFile) || isLoading || isLimitReached}
            className={`p-2.5 rounded-xl transition-all ${
              (input.trim() || selectedFile) && !isLoading && !isLimitReached
                ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700 transform hover:scale-105'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
