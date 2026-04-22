import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Type, Moon, Sun, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Settings2, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Resource } from '../types';
import { cn } from '../lib/utils';

interface ResourceReaderProps {
  resource: Resource;
  onBack: () => void;
  onComplete?: (resource: Resource) => void;
  theme: 'light' | 'sepia' | 'dark';
  onThemeChange: (theme: 'light' | 'sepia' | 'dark') => void;
}

export const ResourceReader = ({ resource, onBack, onComplete, theme, onThemeChange }: ResourceReaderProps) => {
  const [fontSize, setFontSize] = useState(18);
  const [currentPage, setCurrentPage] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle reading progress
  useEffect(() => {
    setReadingProgress(0);
  }, [resource.id, currentPage]);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const winScroll = scrollTop;
      const height = scrollHeight - clientHeight;
      const scrolled = (winScroll / height) * 100;
      setReadingProgress(scrolled);

      if (scrolled > 95 && !isCompleted && !resource.pages) {
        setIsCompleted(true);
        onComplete?.(resource);
      }
    }
  };

  const themes = {
    light: 'bg-[#FDFCFB] text-[#2D2D2D]',
    sepia: 'bg-[#F4ECD8] text-[#5B4636]',
    dark: 'bg-[#121212] text-[#E0E0E0]',
  };

  const isBook = resource.type === 'Book Summary' && resource.pages;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn("fixed inset-0 z-50 flex flex-col overflow-hidden", themes[theme])}
    >
      {/* Reading Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-text/5 z-50">
        <motion.div 
          className="h-full bg-brand"
          style={{ width: `${isBook ? ((currentPage + 1) / resource.pages!.length) * 100 : readingProgress}%` }}
        />
      </div>

      {/* Top Bar */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-border/50 backdrop-blur-2xl sticky top-0 z-10 bg-inherit/80">
        <button 
          onClick={onBack}
          className="p-3 hover:bg-brand/10 text-brand rounded-2xl transition-all active:scale-90"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-text/5 p-1 rounded-2xl">
            <button 
              onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
              className="p-2.5 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-all"
            >
              <Type size={16} />
            </button>
            <button 
              onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
              className="p-2.5 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-all"
            >
              <Type size={20} />
            </button>
          </div>
          <div className="w-px h-8 bg-border/50 mx-1" />
          <div className="flex gap-2">
            <button 
              onClick={() => onThemeChange('light')}
              className={cn("w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2", theme === 'light' ? "border-brand bg-brand/5" : "border-transparent bg-text/5")}
            >
              <Sun size={18} />
            </button>
            <button 
              onClick={() => onThemeChange('sepia')}
              className={cn("w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2", theme === 'sepia' ? "border-[#5B4636]/40 bg-[#F4ECD8]" : "border-transparent bg-[#F4ECD8]/50")}
            >
              <div className="w-4 h-4 rounded-full bg-[#F4ECD8] border border-[#5B4636]/20" />
            </button>
            <button 
              onClick={() => onThemeChange('dark')}
              className={cn("w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2", theme === 'dark' ? "border-brand bg-white/10" : "border-transparent bg-white/5")}
            >
              <Moon size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main 
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-8 py-16 no-scrollbar pb-32"
      >
        <article 
          className={cn(
            "max-w-2xl mx-auto space-y-12 transition-all duration-500",
            resource.language === 'ar' && "text-right"
          )}
          dir={resource.language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="space-y-6 text-center mb-16">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">
              {resource.type} • {resource.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-black leading-[1.1] tracking-tight">
              {resource.title}
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-[10px] font-bold">
                {resource.author?.[0] || 'B'}
              </div>
              <p className="text-sm font-medium opacity-60">
                {resource.author || 'Barbaar Academy'}
              </p>
            </div>
          </div>

          <div 
            className="leading-[2.2] font-serif"
            style={{ fontSize: `${fontSize}px` }}
          >
            {isBook ? (
              <div className="space-y-10">
                <div className="bg-card/30 p-10 md:p-16 rounded-[3rem] min-h-[500px] flex flex-col justify-center shadow-inner border border-border/50 backdrop-blur-sm relative overflow-hidden">
                  <p className="mb-6">
                    {resource.pages![currentPage]}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-8 border-t border-border">
                  <button 
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-6 py-3 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-20 text-text/60"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-bold opacity-40">Page {currentPage + 1} of {resource.pages!.length}</span>
                  <button 
                    disabled={currentPage === resource.pages!.length - 1}
                    onClick={() => {
                      const next = currentPage + 1;
                      setCurrentPage(next);
                      if (next === resource.pages!.length - 1 && !isCompleted) {
                        setIsCompleted(true);
                        onComplete?.(resource);
                      }
                    }}
                    className="px-6 py-3 bg-brand text-brand-dark rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-20"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                <p>{resource.content}</p>
              </div>
            )}
          </div>
        </article>
      </main>
    </motion.div>
  );
};
