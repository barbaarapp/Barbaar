import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area } from 'recharts';
import { MoodLog, Mood } from '../types';
import { motion } from 'framer-motion';

interface MoodInsightsProps {
  logs: MoodLog[];
}

const MOOD_VALUES: Record<Mood, number> = {
  'very-sad': 1,
  'sad': 2,
  'neutral': 3,
  'happy': 4,
  'very-happy': 5,
};

const MOOD_LABELS: Record<Mood, string> = {
  'very-sad': 'Low',
  'sad': 'Down',
  'neutral': 'Fair',
  'happy': 'Good',
  'very-happy': 'Peak',
};

const MOOD_COLORS: Record<Mood, string> = {
  'very-sad': '#F43F5E', 
  'sad': '#F97316',     
  'neutral': '#F59E0B',  
  'happy': '#10B981',    
  'very-happy': '#00BFA5', 
};

export const MoodInsights: React.FC<MoodInsightsProps> = ({ logs }) => {
  const chartData = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7) 
      .map(log => ({
        date: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
        value: MOOD_VALUES[log.mood],
        mood: log.mood,
        label: MOOD_LABELS[log.mood]
      }));
  }, [logs]);

  const moodDistribution = useMemo(() => {
    const counts: Record<Mood, number> = {
      'very-sad': 0,
      'sad': 0,
      'neutral': 0,
      'happy': 0,
      'very-happy': 0,
    };
    logs.forEach(log => {
      counts[log.mood] = (counts[log.mood] || 0) + 1;
    });
    return Object.entries(counts).map(([mood, count]) => ({
      mood,
      label: MOOD_LABELS[mood as Mood],
      count,
      color: MOOD_COLORS[mood as Mood],
    }));
  }, [logs]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-text text-bg p-3 rounded-xl shadow-2xl border border-white/10">
          <p className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-1">{data.date}</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MOOD_COLORS[data.mood as Mood] }} />
            <p className="text-xs font-black uppercase tracking-widest">{data.label}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={MOOD_COLORS[payload.mood as Mood]} 
        stroke="var(--card-bg)" 
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border/50 p-8 rounded-[2.5rem] shadow-sm overflow-hidden relative"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-text tracking-tight font-sans">Emotional Rhythm</h3>
            <p className="text-[10px] font-black text-text/30 uppercase tracking-[0.3em] mt-1">Past 7 Reflections</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand/5 border border-brand/20 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="w-1 h-1 bg-brand rounded-full"
            />
          </div>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -35, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00BFA5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#00BFA5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 10" vertical={false} stroke="currentColor" className="text-text/5" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 900 }} 
                className="text-text/20 font-sans"
                dy={15}
              />
              <YAxis 
                domain={[0, 6]} 
                ticks={[1, 3, 5]} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => {
                  const labels: Record<number, string> = { 1: '—', 3: '•', 5: '+' };
                  return labels[value] || '';
                }}
                tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 900 }}
                className="text-text/10"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,191,165,0.2)', strokeWidth: 2 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00BFA5"
                fillOpacity={1}
                fill="url(#colorMood)"
                strokeWidth={4}
                dot={<CustomizedDot />}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#00BFA5' }}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-between mt-10 pt-8 border-t border-border/40">
          {Object.entries(MOOD_COLORS).map(([mood, color]) => (
            <div key={mood} className="flex flex-col items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[7px] font-black text-text/20 uppercase tracking-[0.2em]">{MOOD_LABELS[mood as Mood]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border/50 p-8 rounded-[2.5rem] shadow-sm"
      >
        <div className="mb-10">
          <h3 className="text-xl font-black text-text tracking-tight font-sans">Core Landscape</h3>
          <p className="text-[10px] font-black text-text/30 uppercase tracking-[0.3em] mt-1">Mood Distribution</p>
        </div>

        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moodDistribution} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-text text-bg p-3 rounded-xl shadow-2xl border border-white/10">
                        <p className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-1">{payload[0].payload.label}</p>
                        <p className="text-xs font-black uppercase tracking-widest">{payload[0].value} Times</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={24}>
                {moodDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-5 gap-3 mt-8">
          {moodDistribution.map((item) => (
            <div key={item.mood} className="space-y-3">
              <div className="text-xs font-black text-text leading-none">{item.count}</div>
              <div className="w-full h-1 bg-text/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${logs.length > 0 ? (item.count / logs.length) * 100 : 0}%` }}
                  transition={{ duration: 1.5, ease: 'circOut' }}
                  className="h-full" 
                  style={{ backgroundColor: item.color }} 
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
