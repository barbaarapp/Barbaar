import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Clock, Zap,
  ChevronRight, Shield,
  Trophy, Flame,
  Headphones, Users, PenTool, X, ArrowRight,
  CheckCircle2, Target
} from 'lucide-react';
import { Task, Mood, Priority, UserChallenge, UserProfile, JournalEntry, MoodLog, Booking } from '../types';
import { cn } from '../lib/utils';
import { getAvatarUrl } from '../services/gamificationService';

interface HomeViewProps {
  userName: string;
  gender?: 'male' | 'female' | 'other';
  level: number;
  tasks: Task[];
  userChallenges: UserChallenge[];
  journalEntries: JournalEntry[];
  moodLogs: MoodLog[];
  bookings: Booking[];
  onToggleTask: (id: string) => void;
  onStartFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTasks: (activeId: string, overId: string) => void;
  onAddTask: () => void;
  totalPoints: number;
  totalWords: number;
  totalWins: number;
  onSelectMood: (mood: Mood) => void;
  onViewChange: (view: any, params?: any) => void;
  growthScore: number;
  streak: number;
  encouragementsReceived?: number;
}

export const HomeView = ({ 
  userName, 
  gender,
  level,
  tasks, 
  userChallenges,
  journalEntries,
  moodLogs,
  bookings,
  onToggleTask, 
  onStartFocus, 
  onDeleteTask,
  onReorderTasks,
  onAddTask, 
  totalPoints,
  totalWords,
  totalWins,
  onSelectMood,
  onViewChange,
  growthScore,
  streak,
  encouragementsReceived = 0,
}: HomeViewProps) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const featuredTools = [
    { id: 'challenges', label: 'Daily Path', icon: Trophy, color: 'text-brand', desc: 'Discipline', bg: 'bg-brand/5' },
    { id: 'therapy', label: 'Therapy', icon: Users, color: 'text-purple-500', desc: '24/7 Support', bg: 'bg-purple-500/5' },
    { id: 'journal', label: 'Reflections', icon: PenTool, color: 'text-amber-500', desc: 'Journaling', bg: 'bg-amber-500/5' },
  ];

  const activeTasks = tasks.filter(t => !t.completed);

  return (
    <div className="pb-32 max-w-lg mx-auto px-6 pt-10 space-y-12">
      {/* Soft Header */}
      <section className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand/40 animate-pulse" />
            <p className="text-[10px] font-black text-text/30 uppercase tracking-[0.3em] font-sans">{greeting}</p>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-text capitalize font-sans">
            salaam, <span className="text-brand">{userName}</span>
          </h2>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewChange('profile')}
          className="relative cursor-pointer"
        >
          <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-card shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-xl">
            <img 
              src={getAvatarUrl({ name: userName, gender, level })} 
              alt={userName} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-brand text-brand-dark text-[8px] font-black px-2 py-1 rounded-lg shadow-lg border-2 border-white uppercase">
            Lvl {level}
          </div>
        </motion.div>
      </section>

      {/* Growth Sabr - Minimal Horizon Strip */}
      <section className="relative px-2">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full bg-white rounded-[1.5rem] p-6 flex items-center justify-between shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden"
        >
          <div className="flex items-center gap-5">
            {/* Minimal Progress Ring */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="24"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-bg"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="24"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 24}
                  initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - growthScore / 100) }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="text-brand"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[8px] font-black text-brand tracking-tighter">{Math.round(growthScore)}%</p>
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-xl font-black text-text tracking-tighter leading-none">{totalPoints}</h3>
              <p className="text-[10px] font-bold text-text/30 uppercase tracking-widest">Sabr points</p>
            </div>
          </div>

          <div className="flex items-center gap-6 pr-2">
            <div className="text-center">
              <p className="text-lg font-black text-text leading-none">{streak}d</p>
              <p className="text-[8px] font-bold text-text/20 uppercase tracking-widest mt-0.5 text-orange-500/60">Streak</p>
            </div>
            <div className="w-px h-6 bg-border/40" />
            <div className="text-center">
              <p className="text-lg font-black text-text leading-none">{totalWins}</p>
              <p className="text-[8px] font-bold text-text/20 uppercase tracking-widest mt-0.5 text-blue-500/60">Wins</p>
            </div>
            <div className="w-px h-6 bg-border/40" />
            <div className="text-center">
              <p className="text-lg font-black text-text leading-none">{encouragementsReceived}</p>
              <p className="text-[8px] font-bold text-brand uppercase tracking-widest mt-0.5 opacity-60">Claps</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pathways Grid - Ultra Radius, No Borders */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-text/20 uppercase tracking-[0.4em] ml-2">Life Pathways</h3>
        <div className="grid grid-cols-3 gap-5">
          {featuredTools.map((tool, index) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onViewChange(tool.id)}
              className="group flex flex-col items-center gap-4"
            >
              <div className={cn(
                "w-full aspect-square rounded-[1.5rem] flex items-center justify-center transition-all duration-500",
                tool.bg, tool.color, "shadow-[0_15px_30px_-5px_rgba(0,0,0,0.03)] group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]"
              )}>
                <tool.icon size={30} />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-xs font-black text-text tracking-tight uppercase group-hover:text-brand transition-colors">{tool.label}</p>
                <p className="text-[8px] font-bold text-text/20 uppercase tracking-[0.2em]">{tool.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Intentions - Smooth Transitions */}
      <section className="space-y-6 pt-2">
        <div className="flex items-center justify-between pl-2">
          <div>
            <h3 className="text-[10px] font-black text-text/20 uppercase tracking-[0.4em]">Current Focus</h3>
            <p className="text-[8px] font-bold text-brand uppercase tracking-widest mt-1">building momentum</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddTask}
            className="w-12 h-12 bg-text text-white rounded-[1rem] flex items-center justify-center shadow-xl shadow-text/5 hover:bg-brand hover:shadow-brand/20 transition-all"
          >
            <Plus size={24} />
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {activeTasks.map((task, index) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div 
                onClick={() => onStartFocus(task.id)}
                className="bg-white rounded-[1.5rem] p-6 sm:p-8 flex items-center justify-between cursor-pointer shadow-[0_15px_45px_-5px_rgba(0,0,0,0.06)] border border-bg hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-1 h-12 rounded-full blur-[0.5px]",
                    task.priority === 'high' ? "bg-rose-400" : 
                    task.priority === 'medium' ? "bg-amber-400" : "bg-emerald-400"
                  )} />
                  
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-text tracking-tight group-hover:text-brand transition-colors lowercase leading-tight">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 text-text/20 group-hover:text-text/40 transition-colors">
                      <Clock size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{task.time}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id);
                  }}
                  className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center text-text/5 hover:bg-emerald-500 hover:text-white transition-all shadow-inner active:scale-90"
                >
                  <CheckCircle2 size={24} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          ))}
          
          {activeTasks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 bg-white rounded-[3rem] text-center space-y-4 shadow-sm"
            >
              <div className="w-16 h-16 bg-bg rounded-[2rem] flex items-center justify-center text-text/10 mx-auto">
                <Target size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-text/40 uppercase tracking-[0.3em]">All Clear</p>
                <p className="text-[8px] font-bold text-brand uppercase tracking-widest">Time to rest or start new</p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Universal Sanctuary - Emergence Mode */}
      <motion.button 
        whileTap={{ scale: 0.98 }}
        onClick={() => onViewChange('sanctuary')}
        className="w-full bg-teal-500/5 p-6 rounded-[1.5rem] flex items-center justify-between group hover:bg-teal-500/10 transition-all shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white text-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Shield size={22} className="fill-current/10" />
          </div>
          <div className="text-left">
            <h4 className="text-[10px] font-black text-text uppercase tracking-widest leading-none mb-1">Emergence Mode</h4>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
              <p className="text-[8px] font-bold text-teal-600/60 uppercase tracking-widest">Take a Breath • Calm Session</p>
            </div>
          </div>
        </div>
        <ArrowRight size={18} className="text-teal-500/30 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
      </motion.button>
    </div>
  );
};
