
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface UserPreferences {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  theme: 'light' | 'dark' | 'system'; 
  language: 'en' | 'es';
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  xp: number; 
  lifetime_xp: number;
  level: number;
  streak: number;
  avatar_url?: string;
  preferences: UserPreferences;
  inventory: string[];
  equipped_frame?: string;
  
  // Freemium Fields
  is_pro: boolean;
  daily_messages_count: number;
  last_message_date: string; // ISO Date string YYYY-MM-DD
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  credits: number;
  professor?: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id?: string;
  title: string;
  description?: string;
  due_date: string; // ISO Date string
  priority: Priority;
  completed: boolean;
  estimated_hours: number;
  notes?: string; 
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id?: string;
  duration_minutes: number;
  started_at: string;
  completed: boolean;
  focus_score?: number;
}

export interface ChatAttachment {
  url: string;
  type: 'image' | 'file';
  name: string;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachment?: ChatAttachment;
}

export interface StoreItem {
  id: number;       // Matches 'id' int8
  item: string;     // Matches 'item' text
  type: string;     // Matches 'type' text
  image_path: string; // Matches 'image_path' text
  price: number;    // Matches 'price' int4
  rarity: string;   // Matches 'rarity' text (Required for styling)
  description?: string; // Matches 'description' text
  description_es?: string; // Matches 'description_es' text (Spanish)
}

export type ViewMode = 'dashboard' | 'subjects' | 'pomodoro' | 'ai-tutor' | 'analytics' | 'settings' | 'leaderboard' | 'store';
