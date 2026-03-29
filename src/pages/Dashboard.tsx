import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Send, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Layout
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface ScheduleItem {
  time: string;
  activity: string;
  type: 'study' | 'break' | 'other';
  description?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSchedule = async () => {
    if (!input.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a detailed daily schedule based on this request: "${input}". 
        The output must be a valid JSON array of objects with these fields: 
        - time (string, e.g., "09:00 AM")
        - activity (string)
        - type (one of: "study", "break", "other")
        - description (optional string)
        
        Focus on productivity and balance. Return ONLY the JSON array.`,
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI.");
      
      // More robust JSON extraction
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Could not find a valid schedule in the AI response.");
      
      const parsedSchedule = JSON.parse(jsonMatch[0]);
      
      if (Array.isArray(parsedSchedule)) {
        setSchedule(parsedSchedule);
      } else {
        throw new Error("Invalid schedule format received.");
      }
    } catch (err) {
      console.error("Schedule generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate schedule. Please try again with more details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Smart Planner</h1>
        <p className="text-zinc-500 text-lg">Describe your day and let AI craft the perfect schedule.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {/* Left: Input Section */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">What's on your mind?</h2>
          </div>

          <div className="flex-1 flex flex-col space-y-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: I have a math exam tomorrow, I need to study for 4 hours, and I want to go to the gym in the evening. Help me plan my day starting from 8 AM."
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-lg leading-relaxed"
            />
            
            {error && (
              <div className="flex items-center gap-2 text-rose-600 text-sm font-medium bg-rose-50 p-4 rounded-xl border border-rose-100">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={generateSchedule}
              disabled={isGenerating || !input.trim()}
              className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-zinc-900/10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate Schedule
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Right: Visualization Section */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col min-h-0 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Your Schedule</h2>
            </div>
            {schedule && (
              <button 
                onClick={() => setSchedule(null)}
                className="text-zinc-400 hover:text-zinc-900 text-sm font-bold transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="wait">
              {schedule ? (
                <div className="space-y-4">
                  {schedule.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-zinc-50 border border-zinc-100 p-5 rounded-2xl flex items-start gap-6 group hover:border-zinc-200 transition-all"
                    >
                      <div className="flex flex-col items-center space-y-2 pt-1">
                        <div className="p-2 bg-white rounded-lg border border-zinc-100 shadow-sm">
                          <Clock className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="w-px h-full bg-zinc-200 min-h-[20px]" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-zinc-400">{item.time}</span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                            item.type === 'study' ? 'bg-blue-100 text-blue-700' :
                            item.type === 'break' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-zinc-200 text-zinc-600'
                          )}>
                            {item.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900">{item.activity}</h3>
                        {item.description && (
                          <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-50">
                  <div className="p-6 bg-zinc-50 rounded-full border border-zinc-100">
                    <Layout className="w-12 h-12 text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-zinc-400">No schedule generated yet</p>
                    <p className="text-zinc-500 max-w-[280px] mx-auto mt-2">
                      Input your tasks and preferences on the left to see your personalized plan.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
