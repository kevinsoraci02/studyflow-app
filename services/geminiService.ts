
import { GoogleGenAI, Chat, Content, Part } from "@google/genai";
import { ChatMessage } from '../types';

// Helper to safely get the API Key from various environments
const getApiKey = () => {
  // 1. Check Vite Environment Variable (Production/Netlify/Vercel)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_GOOGLE_API_KEY;
  }
  
  // 2. Check Process Environment (Local/Node)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }

  // 3. Check for legacy React App prefix
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_API_KEY) {
    return process.env.REACT_APP_GOOGLE_API_KEY;
  }

  return '';
};

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const SYSTEM_INSTRUCTION = `
You are "StudyFlow", an intelligent, encouraging, and highly knowledgeable study assistant for university students.
Your goal is to help students understand complex topics, plan their schedules, and stay motivated.
- When explaining concepts, use analogies suitable for a college level.
- Be concise but thorough.
- If a student uploads or pastes notes (text or images), use that context to answer questions.
- You can generate quiz questions if asked.
- Maintain a friendly, professional, and academic tone.
`;

export const createChatSession = (history: ChatMessage[] = [], language: string = 'en'): Chat => {
  // We only map text parts for history initialization to be safe
  const geminiHistory: Content[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text || " " }] // Ensure text is never empty string to avoid API errors
  }));

  const langInstruction = language === 'es' 
    ? " IMPORTANT: You must reply in Spanish (Español). Use 'tú' for addressing the user."
    : " Reply in English.";

  return ai.chats.create({
    model: GEMINI_MODEL,
    history: geminiHistory,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + langInstruction,
      temperature: 0.7,
    },
  });
};

// Wrapper to handle Multimodal requests
export const sendChatMessage = async (chat: Chat, message: string, attachment?: { mimeType: string, data: string }) => {
    let parts: Part[] = [];
    
    if (message && message.trim() !== '') {
        parts.push({ text: message });
    }
    
    if (attachment) {
        parts.push({
            inlineData: {
                mimeType: attachment.mimeType,
                data: attachment.data
            }
        });
    }
    
    // Fix: The SDK expects an object with a 'message' property that contains the content (string or parts)
    return await chat.sendMessageStream({ message: parts });
};

export const generateStudyPlanSuggestion = async (
  tasks: any[],
  productivityStats: any
): Promise<string> => {
  try {
    const prompt = `
      Based on these tasks: ${JSON.stringify(tasks)}
      And this productivity profile: ${JSON.stringify(productivityStats)}
      Suggest a 3-sentence study strategy for today.
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    return response.text || "Focus on your high priority tasks first!";
  } catch (error) {
    console.error("Error generating study plan:", error);
    return "Unable to generate plan at this moment. Prioritize upcoming deadlines.";
  }
};

export const generateDashboardInsight = async (
    sessions: any[], 
    upcomingTasks: any[], 
    userName: string,
    language: string = 'en'
): Promise<string> => {
    try {
        // Simplify data to save tokens and reduce noise
        const recentSessions = sessions.slice(0, 20).map(s => ({
            duration: s.duration_minutes,
            hour: new Date(s.started_at).getHours(),
            day: new Date(s.started_at).getDay()
        }));

        const tasks = upcomingTasks.slice(0, 3).map(t => ({
            title: t.title,
            due: t.due_date,
            priority: t.priority
        }));

        // STRICT instruction to avoid hallucinations
        const prompt = `
            Analyze this student's real data (${userName}) and give a SHORT, ONE SENTENCE insight.
            
            Language: ${language === 'es' ? 'Spanish (Español)' : 'English'}
            
            Data provided:
            - Recent Sessions (Hour 0-23): ${JSON.stringify(recentSessions)}
            - Upcoming Tasks: ${JSON.stringify(tasks)}
            
            Instructions:
            1. IF "Recent Sessions" is empty: Say "Start your first session to see your analytics!" (or equivalent in Spanish).
            2. IF they have sessions: Calculate the time of day they actually study based on the 'hour' field. Do NOT guess.
            3. IF they have high priority tasks due soon: Mention the most urgent one.
            4. Be extremely specific. If they studied at 2 AM, say "You're a night owl".
            5. Do not invent patterns that aren't in the JSON.
        `;

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
        });

        return response.text || (language === 'es' ? "¡Sigue estudiando para obtener estadísticas personalizadas!" : "Keep studying to get personalized stats!");
    } catch (error) {
        console.error("Insight Gen Error:", error);
        return language === 'es' ? "Analizando tus patrones de estudio..." : "Analyzing your study patterns...";
    }
};
