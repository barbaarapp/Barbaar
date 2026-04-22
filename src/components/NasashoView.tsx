import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  Search, 
  Music,
  CloudRain,
  Moon,
  Sun,
  Headphones
} from 'lucide-react';
import { NasashoContent, NasashoCategory } from '../types';
import { cn } from '../lib/utils';
import { db, collection, getDocs, query, where } from '../firebase';

interface NasashoViewProps {
  onBack: () => void;
  content: NasashoContent[];
  audio: {
    currentTrack: NasashoContent | null;
    setCurrentTrack: (track: NasashoContent | null) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    setIsFullScreen: (full: boolean) => void;
  };
}

export const NasashoView = ({ audio, content }: NasashoViewProps) => {
  const { currentTrack, setCurrentTrack, isPlaying, setIsPlaying, setIsFullScreen } = audio;
  const [activeCategory, setActiveCategory] = useState<NasashoCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const nasashoContent = content;

  const handleTrackSelect = (track: NasashoContent) => {
    const isArchive = track.embedUrl?.includes('archive.org');
    
    if (currentTrack?.id === track.id) {
      if (!track.embedUrl || isArchive) {
        setIsPlaying(!isPlaying);
      } else {
        setIsFullScreen(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      if (track.embedUrl && !isArchive) {
        setIsFullScreen(true);
      }
    }
  };

  const filteredContent = nasashoContent.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: { id: NasashoCategory | 'All', label: string, icon: React.ReactNode }[] = [
    { id: 'All', label: 'All', icon: <Music size={14} /> },
    { id: 'Podcast', label: 'Podcast', icon: <Headphones size={14} /> },
    { id: 'Quran', label: 'Quran', icon: <Sun size={14} /> },
    { id: 'Nature', label: 'Nature', icon: <CloudRain size={14} /> },
    { id: 'Sleep', label: 'Sleep', icon: <Moon size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-bg text-text pb-40">
      <main className="p-6 space-y-12">
        {/* Simplified Header - Pro Look */}
        <section className="space-y-8">
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-text leading-none mb-2 uppercase">Barbaar</h1>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.4em]">Nasasho</span>
               <div className="w-1 h-1 rounded-full bg-text/10" />
               <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.4em]">Relaxation</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                  activeCategory === cat.id 
                    ? "bg-text text-bg border-text" 
                    : "bg-card/40 text-text/40 border-border/50 hover:bg-bg"
                )}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20" size={18} />
            <input 
              type="text" 
              placeholder="Search for calm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-xs font-medium focus:ring-4 ring-brand/5 transition-all outline-none"
            />
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">Finding peace...</span>
          </div>
        ) : (
          <>
            {/* Featured Story Card (Restored Design) */}
            {activeCategory === 'All' && !searchQuery && nasashoContent.length > 0 && (
              <section>
                <h3 className="text-[11px] font-black text-text/40 uppercase tracking-[0.2em] mb-6">Stories</h3>
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTrackSelect(nasashoContent[0])}
                  className="relative h-80 rounded-[40px] overflow-hidden group cursor-pointer border border-border shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-card"
                >
                  <img 
                    src={nasashoContent[0].image} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[3000ms]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  
                  {/* Glassy Content Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 p-6 rounded-[32px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-2xl font-black text-white mb-0.5 tracking-tighter truncate">{nasashoContent[0].title}</h4>
                      <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em]">{nasashoContent[0].reciter || 'Selected Episode'}</p>
                    </div>
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-dark shadow-xl shrink-0">
                       <Play size={28} fill="currentColor" strokeWidth={0} />
                    </div>
                  </div>
                </motion.div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-8 px-1">
                <h3 className="text-[11px] font-black text-text/40 uppercase tracking-[0.2em]">Explore Content</h3>
                <span className="text-[10px] font-bold text-text/10 tracking-widest">{filteredContent.length} items</span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-12">
                {filteredContent
                  .filter(item => item.id !== nasashoContent[0]?.id || activeCategory !== 'All' || searchQuery)
                  .map((item) => (
                  <motion.div
                    key={`nasasho-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTrackSelect(item)}
                    className="flex flex-col cursor-pointer group text-left"
                  >
                    <div className="relative aspect-square rounded-[32px] overflow-hidden mb-5 border border-border shadow-sm transition-all duration-500 group-hover:shadow-2xl bg-card">
                      <img 
                        src={item.image} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-dark shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                          {currentTrack?.id === item.id && isPlaying ? (
                            <Pause size={28} fill="currentColor" strokeWidth={0} />
                          ) : (
                            <Play size={28} fill="currentColor" strokeWidth={0} className="ml-1" />
                          )}
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-xl">
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{item.duration}</span>
                      </div>
                    </div>
                    <div className="px-1 space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-brand uppercase tracking-widest">{item.category}</span>
                        <div className="w-1 h-1 rounded-full bg-text/10" />
                        <span className="text-[9px] font-bold text-text/30 uppercase tracking-widest truncate max-w-[80px]">{(item.reciter || 'Library').toUpperCase()}</span>
                      </div>
                      <h4 className="text-[15px] font-black text-text leading-tight tracking-tight line-clamp-2 uppercase group-hover:text-brand transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
