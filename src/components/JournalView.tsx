import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, ChevronRight, PenLine, X, Sparkles, ChevronLeft, BarChart2, Check, Loader2, Trash2, Undo2 } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { JournalEntry, Mood, MoodLog } from '../types';
import { cn } from '../lib/utils';
import { MoodTracker } from './MoodTracker';
import { MoodInsights } from './MoodInsights';

interface JournalViewProps {
  entries: JournalEntry[];
  moodLogs: MoodLog[];
  onAddEntry: (content: string, mood?: Mood) => Promise<string>;
  onUpdateEntry: (id: string, content: string, mood?: Mood) => void;
  onDeleteEntry: (id: string) => void;
  onBack?: () => void;
  onWritingModeChange?: (isWriting: boolean) => void;
}

const moodEmojis: Record<Mood, string> = {
  'very-sad': '😔',
  'sad': '😕',
  'neutral': '😐',
  'happy': '🙂',
  'very-happy': '✨',
};

const JournalEntryItem = ({ 
  entry, 
  onEdit, 
  onDelete 
}: { 
  entry: JournalEntry; 
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, -50, 0], [0, 1, 1]);
  const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
  const deleteScale = useTransform(x, [-100, -50], [1, 0.8]);

  return (
    <div className="relative mb-4">
      <div className="absolute inset-0 bg-rose-500 rounded-3xl flex items-center justify-end px-8">
        <motion.div style={{ opacity: deleteOpacity, scale: deleteScale }} className="text-white flex items-center gap-2">
          <Trash2 size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
        </motion.div>
      </div>
      
      <motion.div 
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) {
            onDelete(entry.id);
          }
        }}
        onClick={() => onEdit(entry)}
        className="bg-card rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border/50 active:scale-[0.98] transition-all cursor-pointer group relative z-10"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-black text-text/30 uppercase tracking-[0.2em] font-sans">
            {entry.date}
          </span>
          {entry.mood && (
            <div className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-sm ring-4 ring-card">
              {moodEmojis[entry.mood]}
            </div>
          )}
        </div>
        <p className="text-text/60 text-sm leading-relaxed font-medium line-clamp-2 pr-4">
          {entry.content}
        </p>
      </motion.div>
    </div>
  );
};

export const JournalView = ({ entries, moodLogs, onAddEntry, onUpdateEntry, onDeleteEntry, onBack, onWritingModeChange }: JournalViewProps) => {
  const [isWriting, setIsWriting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastDeleted, setLastDeleted] = useState<{ id: string; entry: JournalEntry } | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Autosave logic
  useEffect(() => {
    if (onWritingModeChange) {
      onWritingModeChange(isWriting);
    }
    
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isWriting) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaveStatus('saving');
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 3000); 

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [content, selectedMood]);

  const handleAutoSave = async () => {
    if (!content.trim()) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');
    if (editingEntry && editingEntry.id !== 'temp-id') {
      onUpdateEntry(editingEntry.id, content, selectedMood);
    } else {
      const newId = await onAddEntry(content, selectedMood);
      if (newId) {
        setEditingEntry({ 
          id: newId, 
          content, 
          mood: selectedMood, 
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
        });
      } else {
        setEditingEntry({ id: 'temp-id', content, mood: selectedMood, date: new Date().toLocaleDateString() });
      }
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleEntryDelete = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    setLastDeleted({ id, entry });
    setUndoVisible(true);
    onDeleteEntry(id);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoVisible(false);
      setLastDeleted(null);
    }, 5000);
  };

  const handleUndo = () => {
    if (lastDeleted) {
      onAddEntry(lastDeleted.entry.content, lastDeleted.entry.mood);
      setUndoVisible(false);
      setLastDeleted(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const resetForm = async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    if (isWriting && content.trim()) {
      await handleAutoSave(); 
    }

    setContent('');
    setSelectedMood(undefined);
    setIsWriting(false);
    setEditingEntry(null);
    setSaveStatus('idle');
    isFirstRender.current = true;
  };

  const handleEdit = (entry: JournalEntry) => {
    isFirstRender.current = true; 
    setEditingEntry(entry);
    setContent(entry.content);
    setSelectedMood(entry.mood);
    setIsWriting(true);
  };

  return (
    <div className="min-h-screen bg-bg pb-40">
      <div className="max-w-md mx-auto px-6">
        <header className="pt-16 pb-12 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-text font-sans">Journal</h2>
            <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mt-1">Reflections</p>
          </div>
          <div className="flex gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInsights(!showInsights)}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                showInsights 
                  ? "bg-brand/10 border-brand/20 text-brand" 
                  : "bg-card border-border/50 text-text/30 hover:text-text/60"
              )}
            >
              <BarChart2 size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetForm();
                setIsWriting(true);
              }}
              className="w-12 h-12 bg-brand text-brand-dark rounded-2xl flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(45,212,191,0.2)]"
            >
              <Plus size={24} />
            </motion.button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {showInsights ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MoodInsights logs={moodLogs} />
            </motion.div>
          ) : (
            <motion.div
              key="entries"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4"
            >
              {entries.length === 0 ? (
                <div className="text-center py-40">
                  <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-border/40">
                    <PenLine className="text-brand/40" size={24} />
                  </div>
                  <h3 className="text-sm font-black text-text tracking-tight mb-1">Your Story Starts Here</h3>
                  <p className="text-[10px] font-bold text-text/20 uppercase tracking-[0.2em]">Pour your heart out</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {entries.map((entry) => (
                    <motion.div 
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: -100 }}
                    >
                      <JournalEntryItem 
                        entry={entry} 
                        onEdit={handleEdit} 
                        onDelete={handleEntryDelete}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Undo Toast */}
      <AnimatePresence>
        {undoVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-32 left-0 right-0 z-[150] px-6"
          >
            <div className="max-w-md mx-auto bg-text text-bg py-4 px-6 rounded-2xl flex items-center justify-between shadow-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <Trash2 size={16} className="text-bg/60" />
                <span className="text-xs font-black uppercase tracking-widest leading-none pt-0.5">Entry Deleted</span>
              </div>
              <button 
                onClick={handleUndo}
                className="flex items-center gap-2 bg-brand text-brand-dark py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
              >
                <Undo2 size={12} />
                Undo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWriting && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 400 }}
            className="fixed inset-0 bg-bg z-[200] flex flex-col"
          >
            <header className="flex items-center justify-between px-6 pt-16 pb-8">
              <button 
                onClick={resetForm} 
                className="w-10 h-10 flex items-center justify-center rounded-full text-text/20 hover:bg-card hover:text-text/40 transition-all active:scale-90"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-text/40 uppercase tracking-[0.3em] mb-1">
                  {editingEntry ? editingEntry.date : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <AnimatePresence mode="wait">
                  {saveStatus !== 'idle' && (
                    <motion.div 
                      key={saveStatus}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={cn(
                        "flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em]",
                        saveStatus === 'saving' ? "text-text/20" : "text-brand"
                      )}
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <Loader2 size={10} className="animate-spin" />
                          Auto-Saving
                        </>
                      ) : (
                        <>
                          <Check size={10} />
                          Saved
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-10 flex items-center justify-center">
                <span className="text-[10px] font-black text-text/10 uppercase tracking-widest">
                  {content.trim() ? content.trim().split(/\s+/).filter(w => w.length > 0).length : 0}
                </span>
              </div>
            </header>
            
            <div className="px-10 mb-10">
              <MoodTracker 
                selectedMood={selectedMood} 
                onSelectMood={setSelectedMood} 
              />
            </div>

            <div className="flex-1 px-10 pb-20">
              <textarea 
                autoFocus
                value={content}
                onChange={(e) => {
                  const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0);
                  if (words.length <= 1000) {
                    setContent(e.target.value);
                  }
                }}
                placeholder="How was your day? Speak your truth..."
                className="w-full h-full text-lg outline-none resize-none leading-relaxed text-text font-medium placeholder:text-text/5 bg-transparent selection:bg-brand/20 transition-all font-sans"
              />
            </div>
            
            <footer className="p-10 flex flex-col items-center gap-4">
              <div className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                (content.trim().split(/\s+/).filter(w => w.length > 0).length >= 950) ? "text-rose-500" : "text-text/10"
              )}>
                {content.trim().split(/\s+/).filter(w => w.length > 0).length} / 1000 Words
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetForm}
                className="bg-text text-bg px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl"
              >
                Finish Reflection
              </motion.button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
