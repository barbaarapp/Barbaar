import React, { useState, useEffect } from 'react';
import { Play, Book, Headphones, FileText, Search, ChevronRight, Sparkles, Zap, Heart, Award, Activity, Moon, Clock, Filter, ArrowLeft, Target, Bookmark, CheckCircle2, MoreHorizontal, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Resource, ResourceType } from '../types';
import { db, collection, getDocs, query, where, orderBy } from '../firebase';

const CATEGORIES = [
  { id: 'wellness', title: 'Wellness', description: 'Nurture your body and soul', icon: <Heart size={20} className="text-emerald-500/80" /> },
  { id: 'growth', title: 'Growth', description: 'Unlock your full potential', icon: <Zap size={20} className="text-blue-500/80" /> },
  { id: 'productivity', title: 'Productivity', description: 'Master your focus', icon: <Activity size={20} className="text-amber-500/80" /> },
  { id: 'habits', title: 'Habits', description: 'Daily consistency', icon: <Sparkles size={20} className="text-purple-500/80" /> },
];

const TABS: { id: 'Article' | 'Book Summary' | 'Course'; label: string }[] = [
  { id: 'Article', label: 'Articles' },
  { id: 'Book Summary', label: 'Books' },
  { id: 'Course', label: 'Courses' },
];

const ResourceListItem: React.FC<{
  resource: Resource;
  onClick: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
  isCompleted: boolean;
}> = ({ resource, onClick, isSaved, onToggleSave, isCompleted }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="flex items-center gap-5 bg-card rounded-[28px] p-4 border border-border shadow-sm cursor-pointer group hover:border-[#10B981]/30 transition-all text-left"
    >
      <div className="w-16 h-16 rounded-[28px] overflow-hidden shrink-0 border border-border/50">
        {resource.image ? (
          <img 
            src={resource.image} 
            alt={resource.title} 
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand">
            <Book size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-bold text-text leading-tight mb-1.5 group-hover:text-[#10B981] transition-colors line-clamp-1">
          {resource.title}
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black text-text/30 tracking-widest uppercase">
            {isCompleted ? 'COMPLETED' : `${resource.duration}`}
          </span>
          <span className="text-text/20 text-[10px]">•</span>
          <span className="text-[9px] font-black text-text/30 tracking-widest uppercase truncate max-w-[100px]">
            {resource.category}
          </span>
        </div>
      </div>
      <div className="shrink-0 pr-2">
        {isCompleted ? (
          <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#10B981] flex items-center justify-center">
            <CheckCircle2 size={18} fill="currentColor" className="text-white" />
          </div>
        ) : (
          <button 
            onClick={onToggleSave}
            className={cn(
              "p-2 rounded-xl transition-all",
              isSaved ? "text-[#10B981]" : "text-text/20 hover:text-[#10B981]"
            )}
          >
            <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const ResourceGridItem: React.FC<{
  resource: Resource;
  onClick: () => void;
}> = ({ resource, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="flex flex-col bg-card rounded-[28px] overflow-hidden border border-border group cursor-pointer shadow-sm h-full text-left"
    >
      <div className="relative aspect-square overflow-hidden">
        {resource.image ? (
          <img 
            src={resource.image} 
            alt={resource.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand">
            <Book size={32} />
          </div>
        )}
      </div>
      <div className="p-5 bg-card">
        <h4 className="text-[13px] font-black text-text mb-1.5 group-hover:text-[#10B981] transition-colors line-clamp-2 leading-relaxed">
          {resource.title}
        </h4>
        <p className="text-[9px] font-black text-text/30 uppercase tracking-widest">
          {resource.type === 'Course' ? 'Course' : `${resource.duration}`}
        </p>
      </div>
    </motion.div>
  );
};

interface ResourceViewProps {
  onSelectResource: (resource: Resource) => void;
  onBack?: () => void;
  savedResources: string[];
  completedResources: string[];
  onToggleSave: (id: string) => void;
}

export const ResourceView = ({ 
  onSelectResource, 
  onBack, 
  savedResources, 
  completedResources,
  onToggleSave 
}: ResourceViewProps) => {
  const [activeTab, setActiveTab] = useState<'Article' | 'Book Summary' | 'Course'>('Article');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const q = query(
          collection(db, 'resources'), 
          where('published', '==', true)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        setResources(fetched);
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const weeklyGoalTarget = 5;
  const weeklyCompletedCount = completedResources.length % weeklyGoalTarget; // Simplified logic
  const weeklyProgressPercentage = (weeklyCompletedCount / weeklyGoalTarget) * 100;

  const filteredResources = resources.filter(resource => {
    const matchesTab = resource.type === activeTab;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const featuredArticles = filteredResources.slice(0, 3);
  const featuredIds = new Set(featuredArticles.map(r => r.id));
  const recommendedResources = resources
    .filter(r => !featuredIds.has(r.id))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-bg pb-32">
      <main className="p-6 space-y-10">
        <section className="pt-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-brand transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-xs font-medium focus:ring-4 ring-brand/5 transition-all outline-none placeholder:text-text/20 shadow-sm"
            />
          </div>
        </section>

        {/* Weekly Goal Card */}
        <section className="bg-card rounded-[28px] p-6 shadow-sm border border-border space-y-6 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
                <Zap size={24} fill="currentColor" />
              </div>
              <div>
                <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.2em]">Weekly Target</span>
                <p className="text-sm font-black text-text mt-0.5">{weeklyCompletedCount}/{weeklyGoalTarget} Completed</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-4 bg-bg rounded-full overflow-hidden p-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${weeklyProgressPercentage}%` }}
                transition={{ duration: 1, ease: "circOut" }}
                className="h-full bg-brand rounded-full relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
              </motion.div>
            </div>
            <p className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={14} className="fill-brand text-white" />
              Progress: {Math.round(weeklyProgressPercentage)}% reached
            </p>
          </div>
        </section>

        {/* Segmented Tabs */}
        <section className="bg-card/40 border border-border rounded-2xl p-1">
          <div className="flex items-center">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all relative",
                  activeTab === tab.id ? "bg-card text-brand shadow-sm" : "text-text/30"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Loading Resources...</p>
          </div>
        ) : (
          <>
            {/* Featured Articles Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-text/40 uppercase tracking-[0.2em]">Featured Discoveries</h3>
                <button className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline transition-all">Explore All</button>
              </div>
              <div className="flex flex-col gap-4">
                {featuredArticles.length > 0 ? (
                  featuredArticles.map((resource) => (
                    <ResourceListItem 
                      key={`featured-${resource.id}`}
                      resource={resource}
                      onClick={() => onSelectResource(resource)}
                      isSaved={savedResources.includes(resource.id)}
                      onToggleSave={(e) => {
                        e.stopPropagation();
                        onToggleSave(resource.id);
                      }}
                      isCompleted={completedResources.includes(resource.id)}
                    />
                  ))
                ) : (
                  <div className="p-12 text-center bg-card rounded-[28px] border border-dashed border-border flex flex-col items-center justify-center gap-4">
                    <Book className="text-text/10" size={32} />
                    <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">No Library Items Found</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recommended Grid Section */}
            <section className="space-y-6">
              <h3 className="text-[11px] font-black text-text/40 uppercase tracking-[0.2em]">Curated For You</h3>
              <div className="grid grid-cols-2 gap-6">
                {recommendedResources.map((resource) => (
                  <ResourceGridItem 
                    key={`recommended-${resource.id}`}
                    resource={resource}
                    onClick={() => onSelectResource(resource)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
