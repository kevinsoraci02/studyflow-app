import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { UserProfile, Subject, Task, ViewMode, StudySession, Priority, ChatMessage, ChatAttachment, StoreItem } from '../types';
import { calculateSessionXP, calculateLevelFromXP } from '../lib/gameUtils';
import { differenceInCalendarDays, format } from 'date-fns';
import { generateDashboardInsight } from '../services/geminiService';

interface AppState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  chatHistory: ChatMessage[];
  leaderboard: UserProfile[]; 
  currentView: ViewMode;
  darkMode: boolean;
  isLoading: boolean;
  dashboardInsight: string | null;
  lastInsightFetch: number;
  storeItems: StoreItem[];
  isStoreLoading: boolean;
  publicProfile: UserProfile | null;
  
  // Async Actions
  initialize: () => Promise<void>;
  login: (email: string) => Promise<void>;
  signup: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  
  fetchUserData: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchDashboardInsight: (force?: boolean) => Promise<void>;
  fetchStoreItems: () => Promise<void>;
  
  updateUser: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string }>;
  resetUserData: () => Promise<{ success: boolean; error?: string }>;
  toggleDarkMode: () => void;
  setView: (view: ViewMode) => void;
  
  addSubject: (subject: Partial<Subject>) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  addSession: (session: Partial<StudySession>) => Promise<void>;
  
  purchaseItem: (item: StoreItem) => Promise<{ success: boolean; error?: string }>;
  getStoreImage: (path: string) => string;
  fetchPublicProfile: (userId: string) => Promise<void>;
  closePublicProfile: () => void;

  // Chat Actions
  fetchChatHistory: () => Promise<void>;
  saveChatMessage: (message: ChatMessage) => Promise<void>;
  uploadFile: (file: File) => Promise<string | null>;
  clearChatHistory: () => Promise<void>;
  
  // Freemium Actions
  checkDailyLimit: () => Promise<boolean>; // Returns true if user can send message
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      subjects: [],
      tasks: [],
      sessions: [],
      chatHistory: [],
      leaderboard: [],
      storeItems: [],
      isStoreLoading: false,
      publicProfile: null,
      currentView: 'dashboard',
      darkMode: true, 
      isLoading: false,
      dashboardInsight: null,
      lastInsightFetch: 0,

      initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           set({ isAuthenticated: true });
           await get().fetchUserData();
        }
        
        // Background Task: Trigger Daily Storage Cleanup
        // calls the new 'auto_cleanup_if_needed' function which handles the 24h check internally
        try {
            supabase.rpc('auto_cleanup_if_needed').then(({ data, error }) => {
                if (error) {
                    console.warn("Storage cleanup warning:", error.message);
                } else if (data) {
                    console.log("Storage cleanup status:", data);
                }
            });
        } catch (e) {
            // Ignore errors, background task
        }
      },

      fetchUserData: async () => {
        set({ isLoading: true });
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          set({ isLoading: false });
          return;
        }

        try {
          let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          // SELF-HEALING: If profile is missing (DB trigger failed), create it now
          if (!profile) {
              console.warn("User profile missing in DB. Attempting to create default profile...");
              const defaultProfile = {
                  id: authUser.id,
                  email: authUser.email,
                  full_name: authUser.user_metadata?.full_name || 'Student',
                  xp: 0,
                  lifetime_xp: 0,
                  level: 1,
                  streak: 0,
                  inventory: [],
                  preferences: {
                      focusDuration: 25, 
                      shortBreakDuration: 5, 
                      longBreakDuration: 15, 
                      theme: 'dark', 
                      language: 'en'
                  },
                  is_pro: false,
                  daily_messages_count: 0,
                  last_message_date: new Date().toISOString().split('T')[0]
              };
              
              const { error: insertError } = await supabase.from('profiles').insert([defaultProfile]);
              
              if (!insertError) {
                  profile = defaultProfile;
              } else {
                  console.error("Failed to auto-create profile:", insertError.message || insertError);
              }
          }

          const { data: subjects } = await supabase
            .from('subjects')
            .select('*')
            .order('created_at', { ascending: true });

          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .order('due_date', { ascending: true });
            
          const { data: sessions } = await supabase
            .from('study_sessions')
            .select('*')
            .order('started_at', { ascending: false });

          if (profileError && profileError.code !== 'PGRST116') {
              console.error('Profile fetch error:', profileError.message);
          }

          // Use a safe fallback object
          const safeProfile: any = profile || {};
          
          // Manually map properties to ensure no null pointer exceptions
          const fullProfile: UserProfile = {
            id: authUser.id,
            email: authUser.email || safeProfile.email || '',
            full_name: safeProfile.full_name || authUser.user_metadata?.full_name || 'Student',
            xp: safeProfile.xp || 0,
            lifetime_xp: (safeProfile.lifetime_xp !== undefined && safeProfile.lifetime_xp !== null) ? safeProfile.lifetime_xp : (safeProfile.xp || 0),
            level: safeProfile.level || 1,
            streak: safeProfile.streak || 0,
            avatar_url: safeProfile.avatar_url || undefined,
            preferences: safeProfile.preferences || {
                focusDuration: 25, 
                shortBreakDuration: 5, 
                longBreakDuration: 15, 
                theme: 'dark', 
                language: 'en'
            },
            inventory: safeProfile.inventory || [],
            equipped_frame: safeProfile.equipped_frame || undefined,
            // Freemium
            is_pro: safeProfile.is_pro || false,
            daily_messages_count: safeProfile.daily_messages_count || 0,
            last_message_date: safeProfile.last_message_date || new Date().toISOString().split('T')[0]
          };

          set({
            user: fullProfile,
            subjects: (subjects as Subject[]) || [],
            tasks: (tasks as Task[]) || [],
            sessions: (sessions as StudySession[]) || [],
            isLoading: false
          });
          
          await get().fetchChatHistory();
          
        } catch (e: any) {
          console.error('Error fetching data:', e.message || e);
          set({ isLoading: false });
        }
      },

      fetchLeaderboard: async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, xp, lifetime_xp, level, streak, avatar_url') 
            .order('lifetime_xp', { ascending: false }) 
            .limit(50);

          if (error) throw error;
          
          if (data) {
             const mappedData = data.map((u: any) => ({
                ...u,
                xp: u.lifetime_xp || u.xp || 0 // Fallback to 0 if both are missing
             }));
             set({ leaderboard: mappedData as unknown as UserProfile[] });
          }
        } catch (e) {
          console.error("Leaderboard fetch error:", e);
        }
      },

      fetchDashboardInsight: async (force = false) => {
          const state = get();
          const now = Date.now();
          
          if (!force && state.dashboardInsight && (now - state.lastInsightFetch < 300000)) {
              return;
          }
          
          if (state.sessions.length === 0 && state.tasks.length === 0) {
             const lang = state.user?.preferences?.language || 'en';
             set({ 
                 dashboardInsight: lang === 'es' 
                    ? "¡Bienvenido! Empieza a estudiar y agregar tareas para recibir consejos personalizados." 
                    : "Welcome! Start studying and adding tasks to receive personalized insights."
             });
             return;
          }

          const insight = await generateDashboardInsight(
              state.sessions, 
              state.tasks, 
              state.user?.full_name || 'Student',
              state.user?.preferences?.language || 'en'
          );
          
          set({ dashboardInsight: insight, lastInsightFetch: now });
      },

      fetchStoreItems: async () => {
        set({ isStoreLoading: true });
        try {
            const { data, error } = await supabase
                .from('store')
                .select('*')
                .order('price', { ascending: true });

            if (error) {
                console.error("Supabase Store Fetch Error:", error);
                throw error;
            }
            
            if (data) {
                const cleanData = data.map((item: any) => ({
                  ...item,
                  // Aggressively remove newlines, carriage returns, extra spaces, quotes
                  image_path: (item.image_path || '').toString().trim().replace(/['"\r\n\t]+/g, ''),
                  item: (item.item || '').toString().trim(),
                  description: (item.description || '').toString().trim(),
                  description_es: (item.description_es || '').toString().trim(), // Fetch Spanish Description
                  // Sanitize rarity for consistent styling
                  rarity: (item.rarity || 'common').toString().trim().toLowerCase()
                }));
                set({ storeItems: cleanData as StoreItem[] });
            }
        } catch (e: any) {
            console.error("Error fetching store items:", e.message);
        } finally {
            set({ isStoreLoading: false });
        }
      },

      purchaseItem: async (item) => {
          const user = get().user;
          if (!user) return { success: false, error: "Not logged in" };
          
          if (user.xp < item.price) return { success: false, error: "Insufficient XP" };

          // Check if already owned based on Item Name
          if (user.inventory?.includes(item.item)) {
              return { success: false, error: "Item already owned" };
          }

          const newXP = user.xp - item.price;
          const newInventory = [...(user.inventory || []), item.item];

          // Optimistic update
          set({ user: { ...user, xp: newXP, inventory: newInventory } });

          try {
              const { error } = await supabase.from('profiles').update({
                  xp: newXP,
                  inventory: newInventory
              }).eq('id', user.id);

              if (error) throw error;
              return { success: true };
          } catch (e: any) {
              // Revert
              set({ user });
              return { success: false, error: e.message };
          }
      },

      getStoreImage: (path: string) => {
          if (!path) return '';
          
          // Robust cleaning: trim spaces, newlines, remove quotes
          const clean = path.trim().replace(/['"\r\n\t\s]+/g, '');

          // Check if it's already a full URL (e.g. user pasted a link)
          if (clean.startsWith('http://') || clean.startsWith('https://')) {
             return clean;
          }

          // Clean path: remove 'public/' prefix if it exists in the DB string but not bucket structure
          // Also remove leading slashes
          const finalPath = clean.replace(/^public\//, '').replace(/^\//, '');
          
          const { data } = supabase.storage.from('store').getPublicUrl(finalPath);
          return data.publicUrl;
      },

      fetchChatHistory: async () => {
         const { data, error } = await supabase
          .from('chat_history')
          .select('*')
          .order('created_at', { ascending: true });
          
         if (error) {
             console.error("Error fetching chat history:", error.message);
             return;
         }

         if (data) {
            const history: ChatMessage[] = data.map((d: any) => {
                const text = d.message || "";
                let attachment: ChatAttachment | undefined;

                const imgMatch = text.match(/!\[(.*?)\]\((.*?)\)/);
                if (imgMatch) {
                    attachment = {
                        name: imgMatch[1] || "Image",
                        url: imgMatch[2],
                        type: 'image'
                    };
                } 
                else {
                    const fileMatch = text.match(/\[Attached File: (.*?)\]\((.*?)\)/);
                    if (fileMatch) {
                        attachment = {
                            name: fileMatch[1] || "File",
                            url: fileMatch[2],
                            type: 'file'
                        };
                    }
                }

                return {
                  id: d.id,
                  role: d.role === 'user' ? 'user' : 'model',
                  text: text, 
                  timestamp: new Date(d.created_at).getTime(),
                  attachment: attachment
                };
            });
            set({ chatHistory: history });
         }
      },

      clearChatHistory: async () => {
        const userId = get().user?.id;
        if (!userId) return;

        // Optimistic update
        set({ chatHistory: [] });

        try {
            const { error } = await supabase
                .from('chat_history')
                .delete()
                .eq('user_id', userId);
            
            if (error) {
                console.error("Error clearing chat history:", error.message);
                // If failed, maybe refresh to show messages again, but for now just log
            }
        } catch (e: any) {
            console.error("Exception clearing chat:", e.message);
        }
      },

      uploadFile: async (file: File) => {
        const userId = get().user?.id;
        if (!userId) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('study-materials')
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('study-materials')
            .getPublicUrl(filePath);

        await supabase.from('documents').insert({
            user_id: userId,
            file_path: filePath,
            file_name: file.name,
            uploaded_at: new Date().toISOString()
        });

        return publicUrl;
      },

      // FREEMIUM LOGIC
      checkDailyLimit: async () => {
          const user = get().user;
          if (!user) return false;
          
          if (user.is_pro) return true; // Unlimited for Pro

          const today = new Date().toISOString().split('T')[0];
          const lastDate = user.last_message_date;
          let count = user.daily_messages_count;

          // Reset if new day
          if (lastDate !== today) {
              count = 0;
              // Optimistically update local state
              set({ user: { ...user, daily_messages_count: 0, last_message_date: today }});
              
              // Sync Reset to DB
              await supabase.from('profiles').update({
                  daily_messages_count: 0,
                  last_message_date: today
              }).eq('id', user.id);
          }

          // Check limit (10 messages)
          if (count >= 10) return false;

          return true;
      },

      saveChatMessage: async (msg) => {
         const userId = get().user?.id;
         if (!userId) return;
         
         set(state => ({ chatHistory: [...state.chatHistory, msg] }));
         
         let messageText = msg.text;
         if (msg.attachment && msg.attachment.type === 'image') {
             messageText += `\n\n![${msg.attachment.name}](${msg.attachment.url})`;
         } else if (msg.attachment && msg.attachment.type === 'file') {
             messageText += `\n\n[Attached File: ${msg.attachment.name}](${msg.attachment.url})`;
         }

         try {
             // Save Message
             await supabase.from('chat_history').insert({
                id: msg.id,
                user_id: userId,
                role: msg.role,
                message: messageText,
                created_at: new Date(msg.timestamp).toISOString()
             });

             // Increment usage ONLY for user messages (not model replies)
             // and sync to DB
             if (msg.role === 'user') {
                 const currentUser = get().user;
                 if (currentUser && !currentUser.is_pro) {
                     const newCount = (currentUser.daily_messages_count || 0) + 1;
                     const today = new Date().toISOString().split('T')[0];
                     
                     set({ user: { ...currentUser, daily_messages_count: newCount, last_message_date: today }});
                     
                     await supabase.from('profiles').update({
                         daily_messages_count: newCount,
                         last_message_date: today
                     }).eq('id', userId);
                 }
             }

         } catch (e: any) {
             console.error("Exception saving chat message:", e.message);
         }
      },

      login: async (email) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          set({ isAuthenticated: true });
          await get().fetchUserData();
        }
      },

      signup: async (email, name) => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            set({ isAuthenticated: true });
            await get().fetchUserData();
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        document.documentElement.removeAttribute('data-theme');
        set({ 
          isAuthenticated: false, 
          user: null, 
          subjects: [], 
          tasks: [], 
          sessions: [], 
          chatHistory: [], 
          leaderboard: [], 
          currentView: 'dashboard',
          dashboardInsight: null
        });
      },

      updateUser: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) return { success: false, error: "No user logged in" };

        set({ user: { ...currentUser, ...updates } });

        try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', currentUser.id);
            
          if (error) {
            return { success: false, error: error.message };
          }
          
          return { success: true };
        } catch (e: any) {
           return { success: false, error: e.message };
        }
      },

      uploadAvatar: async (file: File) => {
         const userId = get().user?.id;
         if (!userId) return { success: false, error: "No user logged in" };

         try {
             const fileExt = file.name.split('.').pop();
             const fileName = `${Date.now()}.${fileExt}`;
             const filePath = `${userId}/${fileName}`;

             const { error: uploadError } = await supabase.storage
                 .from('avatars')
                 .upload(filePath, file, { upsert: true });

             if (uploadError) throw uploadError;

             const { data: { publicUrl } } = supabase.storage
                 .from('avatars')
                 .getPublicUrl(filePath);

             const { error: updateError } = await supabase
                 .from('profiles')
                 .update({ avatar_url: publicUrl })
                 .eq('id', userId);

             if (updateError) throw updateError;

             set((state) => ({
                 user: state.user ? { ...state.user, avatar_url: publicUrl } : null
             }));

             return { success: true };

         } catch (e: any) {
             return { success: false, error: e.message };
         }
      },

      resetUserData: async () => {
        const userId = get().user?.id;
        if (!userId) return { success: false, error: "No user logged in" };

        set({ isLoading: true });

        try {
          try { await supabase.from('chat_history').delete().eq('user_id', userId); } catch (e) {}
          try { await supabase.from('documents').delete().eq('user_id', userId); } catch (e) {}

          await supabase.from('study_sessions').delete().eq('user_id', userId);
          await supabase.from('tasks').delete().eq('user_id', userId);
          await supabase.from('subjects').delete().eq('user_id', userId);
          
          const defaultPreferences = {
              focusDuration: 25,
              shortBreakDuration: 5,
              longBreakDuration: 15,
              theme: 'dark' as 'dark',
              language: 'en' as 'en'
          };

          try {
            await supabase.from('profiles').update({
                xp: 0,
                lifetime_xp: 0,
                level: 1,
                streak: 0,
                avatar_url: null,
                preferences: defaultPreferences,
                inventory: [],
                equipped_frame: null,
                is_pro: false,
                daily_messages_count: 0
            }).eq('id', userId);
          } catch (e) {}

          set((state) => ({
              subjects: [],
              tasks: [],
              sessions: [],
              chatHistory: [],
              dashboardInsight: null,
              user: state.user ? {
                  ...state.user,
                  xp: 0,
                  lifetime_xp: 0,
                  level: 1,
                  streak: 0,
                  avatar_url: undefined,
                  preferences: defaultPreferences,
                  inventory: [],
                  equipped_frame: undefined,
                  is_pro: false,
                  daily_messages_count: 0
              } : null,
              isLoading: false
          }));
          
          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      toggleDarkMode: () => set((state) => {
        const newMode = !state.darkMode;
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { darkMode: newMode };
      }),

      setView: (view) => set({ currentView: view }),

      addSubject: async (subject) => {
        const userId = get().user?.id;
        if (!userId) return;
        
        const newSubject: Subject = {
          id: crypto.randomUUID(), // Generate proper UUID
          user_id: userId,
          name: subject.name!,
          color: subject.color!,
          credits: subject.credits!
        };
        
        // Optimistic update
        set(state => ({ subjects: [...state.subjects, newSubject] }));
        
        try {
            const { error } = await supabase.from('subjects').insert([newSubject]);
            if (error) throw error;
        } catch (e: any) {
            console.error("Add Subject Error:", e.message);
            // Revert state if needed, or show toast
        }
      },

      updateSubject: async (id, updates) => {
        set(state => ({
          subjects: state.subjects.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
        await supabase.from('subjects').update(updates).eq('id', id);
      },

      deleteSubject: async (id) => {
        // Optimistic update
        set(state => ({
          subjects: state.subjects.filter(s => s.id !== id),
          tasks: state.tasks.filter(t => t.subject_id !== id) // Cascade delete tasks in UI
        }));

        try {
            // 1. Unlink sessions (set subject_id to null) to preserve history
            await supabase.from('study_sessions').update({ subject_id: null }).eq('subject_id', id);
            
            // 2. Delete tasks associated with subject
            await supabase.from('tasks').delete().eq('subject_id', id);
            
            // 3. Delete subject
            await supabase.from('subjects').delete().eq('id', id);
        } catch (e: any) {
            console.error("Delete Subject Error:", e.message);
        }
      },

      addTask: async (task) => {
        const userId = get().user?.id;
        if (!userId) return;

        const newTask: Task = {
          id: crypto.randomUUID(),
          user_id: userId,
          title: task.title!,
          subject_id: task.subject_id,
          due_date: task.due_date!,
          priority: task.priority || Priority.MEDIUM,
          completed: false,
          estimated_hours: task.estimated_hours || 1,
          notes: task.notes
        };

        set(state => ({ tasks: [...state.tasks, newTask] }));
        await supabase.from('tasks').insert([newTask]);
        
        // Refresh dashboard insight if new task added
        get().fetchDashboardInsight(true);
      },

      updateTask: async (id, updates) => {
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
        await supabase.from('tasks').update(updates).eq('id', id);
      },

      toggleTaskComplete: async (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (task) {
          const newStatus = !task.completed;
          set(state => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, completed: newStatus } : t)
          }));
          await supabase.from('tasks').update({ completed: newStatus }).eq('id', taskId);
        }
      },

      deleteTask: async (id) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id)
        }));
        await supabase.from('tasks').delete().eq('id', id);
      },

      addSession: async (session) => {
        const userId = get().user?.id;
        if (!userId) return;

        const newSession: StudySession = {
          id: crypto.randomUUID(),
          user_id: userId,
          subject_id: session.subject_id,
          duration_minutes: session.duration_minutes!,
          started_at: session.started_at!,
          completed: true,
          focus_score: 10
        };

        set(state => {
            const newState = { ...state, sessions: [newSession, ...state.sessions] };
            
            // Calculate Gamification Stats
            if (state.user) {
                const xpGained = calculateSessionXP(newSession.duration_minutes);
                const newLifetimeXP = (state.user.lifetime_xp || 0) + xpGained;
                const newLevel = calculateLevelFromXP(newLifetimeXP);
                
                // Streak Calculation
                let newStreak = state.user.streak;
                const today = new Date();
                // Find last session that wasn't this one (since we just added it to local state logic)
                // Actually, checking state.sessions[0] is better
                const lastSession = state.sessions[0]; 
                
                if (lastSession) {
                    const lastDate = new Date(lastSession.started_at);
                    const diff = differenceInCalendarDays(today, lastDate);
                    
                    if (diff === 1) {
                        newStreak += 1; // Continued streak
                    } else if (diff > 1) {
                        newStreak = 1; // Broken streak, restart (or 1 if this is the first today)
                    }
                    // If diff === 0, same day, streak stays same
                } else {
                    newStreak = 1; // First ever session
                }

                const updatedUser = {
                    ...state.user,
                    xp: (state.user.xp || 0) + xpGained, // Spendable XP
                    lifetime_xp: newLifetimeXP,
                    level: newLevel,
                    streak: newStreak
                };
                
                // Persist user stats
                supabase.from('profiles').update({
                    xp: updatedUser.xp,
                    lifetime_xp: updatedUser.lifetime_xp,
                    level: updatedUser.level,
                    streak: updatedUser.streak
                }).eq('id', userId).then();

                return { ...newState, user: updatedUser };
            }
            
            return newState;
        });

        await supabase.from('study_sessions').insert([newSession]);
        get().fetchDashboardInsight(true);
      },

      fetchPublicProfile: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (error) throw error;
          
          if (data) {
            // Parse or default fields just in case
            const profile: UserProfile = {
                id: data.id,
                email: data.email,
                full_name: data.full_name || 'Student',
                xp: data.xp || 0,
                lifetime_xp: data.lifetime_xp || data.xp || 0,
                level: data.level || 1,
                streak: data.streak || 0,
                avatar_url: data.avatar_url,
                preferences: data.preferences || { focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, theme: 'dark', language: 'en' },
                inventory: data.inventory || [],
                equipped_frame: data.equipped_frame,
                is_pro: data.is_pro || false,
                daily_messages_count: data.daily_messages_count || 0,
                last_message_date: data.last_message_date || new Date().toISOString().split('T')[0]
            };
            set({ publicProfile: profile });
          }
        } catch (e) {
          console.error("Error fetching public profile:", e);
        }
      },

      closePublicProfile: () => set({ publicProfile: null }),
    }),
    {
      name: 'studyflow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
          user: state.user, 
          isAuthenticated: state.isAuthenticated, 
          darkMode: state.darkMode, 
          dashboardInsight: state.dashboardInsight 
      }),
    }
  )
);