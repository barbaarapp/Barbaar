import { Badge, Milestone } from './types';

export const INITIAL_BADGES: Badge[] = [
  { id: '1', name: 'Early Bird', icon: '🌅', description: 'Complete a task before 9 AM', unlocked: true, category: 'consistency', progress: 1, maxProgress: 1 },
  { id: '2', name: 'Mood Master', icon: '🧘', description: 'Log your mood for 7 days straight', unlocked: true, category: 'mindset', progress: 7, maxProgress: 7 },
  { id: '3', name: 'Deep Thinker', icon: '🧠', description: 'Write 1,000 words in your journal', unlocked: false, category: 'mindset', progress: 0, maxProgress: 1000 },
  { id: '4', name: 'Growth Seeker', icon: '🌱', description: 'Complete 10 tasks', unlocked: false, category: 'growth', progress: 2, maxProgress: 10 },
  { id: '6', name: 'Night Owl', icon: '🦉', description: 'Complete a task after 10 PM', unlocked: false, category: 'consistency', progress: 0, maxProgress: 1 },
  { id: '8', name: 'Zen Master', icon: '🏮', description: 'Complete 5 therapy sessions', unlocked: false, category: 'mindset', progress: 0, maxProgress: 5 },
];

export const INITIAL_MILESTONES: Milestone[] = [
  { id: '1', title: 'First Steps', description: 'Reach 500 Sabr Points', targetPoints: 500, reward: 'New Avatar Frame', achieved: true },
  { id: '2', title: 'Steady Path', description: 'Reach 2,000 Sabr Points', targetPoints: 2000, reward: 'Custom Theme', achieved: false },
  { id: '3', title: 'Mountain Peak', description: 'Reach 5,000 Sabr Points', targetPoints: 5000, reward: 'Premium Resources', achieved: false },
];
