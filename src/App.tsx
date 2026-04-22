import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { 
  Sparkles, 
  Loader2, 
  Play, 
  Pause, 
  X, 
  ChevronLeft, 
  RotateCcw, 
  RotateCw, 
  Heart, 
  Share2, 
  Volume2, 
  AlertCircle 
} from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { TherapyView } from './components/TherapyView';
import { JournalView } from './components/JournalView';
import { ProfileView } from './components/ProfileView';
import { ResourceView } from './components/ResourceView';
import { ResourceReader } from './components/ResourceReader';
import { SanctuaryMode } from './components/SanctuaryMode';
import { AddTaskModal } from './components/AddTaskModal';
import { HomeView } from './components/HomeView';
import { NasashoView } from './components/NasashoView';
import { ChallengesView } from './components/ChallengesView';
import { MoodCheckInOverlay } from './components/MoodCheckInOverlay';
import { AdminDashboard } from './components/AdminDashboard';
import { AchievementUnlockOverlay } from './components/AchievementUnlockOverlay';
import { AppState, Mood, ViewType, ThemeType, Task, JournalEntry, Badge, Milestone, Priority, Booking, Resource, UserProfile, AppNotification, FirestoreProfile, FirestoreTask, FirestoreJournalEntry, FirestoreMoodLog, MoodLog, Challenge, UserChallenge, NasashoContent, Therapist } from './types';
import { updateGamification, XP_CONFIG, SABR_POINTS_CONFIG, ACHIEVEMENTS, syncAchievements, checkUnlocks } from './services/gamificationService';
import { INITIAL_BADGES, INITIAL_MILESTONES } from './constants';
import { AnimatePresence, motion } from 'motion/react';
import { arrayMove } from '@dnd-kit/sortable';
import { auth, db, onAuthStateChanged, signOut, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, handleFirestoreError, OperationType } from './firebase';
import { Auth } from './components/Auth';
import { FocusTimer } from './components/FocusTimer';

const INITIAL_STATE: AppState = {
  view: 'home',
  theme: 'light',
  session: null,
  notifications: [
    { id: '1', type: 'achievement', title: 'Welcome!', content: 'You earned 50 Sabr points for joining.', timestamp: new Date().toISOString(), read: false, icon: '🎉' },
  ],
  user: {
    id: '',
    name: 'Alex',
    level: 1,
    experience: 0,
    nextLevelExp: 500,
    streak: 0,
    journalStreak: 0,
    points: 0,
    sabrPoints: 0,
    growthScore: 0,
    focusTimeTotal: 0,
    focusTimeToday: 0,
    dailyWins: 0,
    totalWins: 0,
    sabrPointsToday: 0,
    hasCheckedIn: false,
    moodLogCountToday: 0,
    encouragementsReceived: 0,
    unlockedFeatures: [],
    achievements: [],
    language: 'en',
    completedResources: [],
    savedResources: [],
    totalWordCount: 0,
    tasks: [],
    journalEntries: [],
    moodLogs: [],
    badges: INITIAL_BADGES,
    milestones: INITIAL_MILESTONES,
    bookings: [],
    userChallenges: []
  },
  nasashoContent: [],
  therapists: []
};

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'morning-routine',
    title: '7 Days Morning Mastery',
    description: 'Establish a rock-solid morning routine to conquer your day. Wake up early, hydrate, and move.',
    durationDays: 7,
    category: 'discipline',
    participantsCount: 1240,
    published: true,
    tasks: [
      { id: 'wake-up', title: 'Wake up before 6:00 AM' },
      { id: 'hydrate', title: 'Drink 500ml of water' },
      { id: 'move', title: '10 minutes of movement' }
    ]
  },
  {
    id: 'habit-formation',
    title: '21 Days Habit Forge',
    description: 'Science says it takes 21 days to form a habit. Choose one habit and stick to it relentlessly.',
    durationDays: 21,
    category: 'productivity',
    participantsCount: 850,
    published: true,
    tasks: [
      { id: 'deep-work', title: '90 minutes of Deep Work' },
      { id: 'read', title: 'Read 10 pages of a book' },
      { id: 'reflect', title: 'Evening reflection' }
    ]
  }
];

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isJournalWriting, setIsJournalWriting] = useState(false);
  const [focusingTaskId, setFocusingTaskId] = useState<string | null>(null);
  const [initialChallengeId, setInitialChallengeId] = useState<string | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Badge | null>(null);
  const unsubscribesRef = useRef<(() => void)[]>([]);
  const lastNotificationCountRef = useRef<number>(0);

  // Browser Notification Permission Request
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showLocalPush = (title: string, body: string, iconUrl?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: iconUrl || '/barbaar-icon.svg',
        tag: 'barbaar-notification',
      });
    }
  };

  // Global Audio State
  const [currentTrack, setCurrentTrack] = useState<NasashoContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreenPlayer, setIsFullScreenPlayer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Audio Processing Logic (moved from NasashoView)
  const getDirectAudioUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([^\/]+)/)?.[1] || url.match(/id=([^\&]+)/)?.[1];
      if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
  };

  useEffect(() => {
    let isMounted = true;
    const resolveUrl = async () => {
      if (!currentTrack) {
        setResolvedUrl('');
        return;
      }
      const url = currentTrack.embedUrl || currentTrack.audioUrl || '';
      if (!url) {
        setResolvedUrl('');
        return;
      }

      if (url.includes('archive.org/details/') || url.includes('archive.org/embed/')) {
        try {
          const parts = url.split('/');
          const idIndex = parts.findIndex(p => p === 'details' || p === 'embed') + 1;
          const id = parts[idIndex]?.split('?')[0];
          if (!id) {
            if (isMounted) setResolvedUrl(url);
            return;
          }
          const response = await fetch(`https://archive.org/metadata/${id}`);
          const data = await response.json();
          const mp3File = data.files?.find((f: any) => 
            f.name?.toLowerCase().endsWith('.mp3') && 
            (f.format?.toLowerCase().includes('mp3') || f.source === 'original')
          );
          if (mp3File && isMounted) {
            const fileName = encodeURIComponent(mp3File.name).replace(/%20/g, '+');
            setResolvedUrl(`https://archive.org/download/${id}/${fileName}`);
            return;
          }
          if (isMounted) setResolvedUrl(`https://archive.org/download/${id}/${id}.mp3`);
        } catch (err) {
          if (isMounted) setResolvedUrl(url);
        }
      } else {
        setResolvedUrl(getDirectAudioUrl(url));
      }
    };
    resolveUrl();
    return () => { isMounted = false; };
  }, [currentTrack]);

  useEffect(() => {
    let isMounted = true;
    if (audioRef.current && currentTrack && resolvedUrl) {
      const isYoutube = currentTrack.embedUrl?.includes('youtube.com');
      if (!isYoutube) {
        if (audioRef.current.src !== resolvedUrl) {
          audioRef.current.src = resolvedUrl;
          audioRef.current.load();
        }
        if (isPlaying) {
          audioRef.current.play().catch(() => {
            if (isMounted) setIsPlaying(false);
          });
        } else {
          audioRef.current.pause();
        }
      }
    }
    return () => { isMounted = false; };
  }, [isPlaying, currentTrack?.id, resolvedUrl]);

  // Media Session & Wake Lock
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.reciter || 'Barbaar Academy',
        album: currentTrack.category,
        artwork: [{ src: currentTrack.image || 'https://picsum.photos/seed/barbaar/512/512', sizes: '512x512', type: 'image/jpeg' }]
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('seekbackward', () => handleAudioSeek(-10));
      navigator.mediaSession.setActionHandler('seekforward', () => handleAudioSeek(10));
    }
  }, [currentTrack]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isPlaying) {
        try {
          if (wakeLockRef.current) return;
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null; });
        } catch (err) {}
      } else if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
    requestWakeLock();
    return () => { if (wakeLockRef.current) wakeLockRef.current.release(); };
  }, [isPlaying]);

  // Browser History Navigation (Mobile Back Button Support)
  useEffect(() => {
    // Initialize history state on load
    if (!window.history.state) {
      window.history.replaceState({ view: state.view, viewParams: state.viewParams }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { view, viewParams, selectedResource, isAddTaskOpen, isJournalWriting } = event.state;
        
        // Handle view state
        setState(prev => ({ 
          ...prev, 
          view: view || 'home', 
          viewParams: viewParams || null,
          user: {
            ...prev.user,
            selectedResource: selectedResource || undefined
          }
        }));

        // Sync local states with history
        setIsAddTaskOpen(!!isAddTaskOpen);
        setIsJournalWriting(!!isJournalWriting);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleAudioSeek = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioSeekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTogglePlay = () => setIsPlaying(!isPlaying);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('archive.org')) {
      const id = url.split('/').pop()?.split('?')[0];
      return `https://archive.org/embed/${id}`;
    }
    if (url.includes('drive.google.com')) {
      return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
    }
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  // Task Reminders Effect
  // Optimization: Throttled background tasks based on visibility and battery
  useEffect(() => {
    if (!state.session) return;

    let reminderInterval: NodeJS.Timeout | null = null;
    let challengeInterval: NodeJS.Timeout | null = null;
    let batteryInstance: any = null;
    let batteryHandler: (() => void) | null = null;

    const setupIntervals = (isLowPower: boolean = false) => {
      if (reminderInterval) clearInterval(reminderInterval);
      if (challengeInterval) clearInterval(challengeInterval);

      // Eco-Mode: even more aggressive throttling if battery is low or tab is hidden
      const isEco = isLowPower || state.ecoMode;
      
      const reminderFreq = isEco ? 600000 : 60000; // 10m vs 1m
      const challengeFreq = isEco ? 14400000 : 3600000; // 4h vs 1h

      const checkReminders = () => {
        if (!state.user.tasks.length) return;
        const now = new Date();
        state.user.tasks.forEach(task => {
          if (task.completed || !task.dueDate) return;
          const dueDate = new Date(task.dueDate);
          const diffMs = dueDate.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000);

          const thresholds = [15, 10, 5, 0];
          if (thresholds.includes(diffMins)) {
            const notifiedKey = `notified_${task.id}_${dueDate.getTime()}_${diffMins}`;
            if (!localStorage.getItem(notifiedKey)) {
              const title = diffMins === 0 ? 'Focus Time Now! 🎯' : 'Upcoming Focus ⏳';
              const content = diffMins === 0 
                ? `Time to start: "${task.title}"`
                : `"${task.title}" starts in ${diffMins} minutes. Ready?`;
              
              addNotification({ type: 'reminder', title, content, icon: diffMins === 0 ? '🎯' : '⏰' });
              showLocalPush(title, content);

              // Trigger in-app popup
              const newNotif: AppNotification = {
                id: `task-${task.id}-${diffMins}`,
                type: 'reminder',
                title,
                content,
                icon: diffMins === 0 ? '🎯' : '⏰',
                timestamp: new Date().toISOString(),
                read: false
              };
              setState(prev => ({ ...prev, activeNotification: newNotif }));
              setTimeout(() => setState(prev => ({ ...prev, activeNotification: null })), 6000);
              
              localStorage.setItem(notifiedKey, 'true');
            }
          }
        });
      };

      const checkChallengeOpening = () => {
        if (!state.user.userChallenges.length) return;
        const today = new Date().toLocaleDateString();
        if (!localStorage.getItem(`opened_challenges_${today}`)) {
          if (new Date().getHours() >= 10) {
            const title = 'Path Awaits You! 🛤️';
            const content = "You haven't checked your challenges today. Keep your momentum going!";
            showLocalPush(title, content);
            localStorage.setItem(`opened_challenges_${today}`, 'true');
            addNotification({ type: 'reminder', title, content, icon: '🛤️' });
          }
        }
      };

      reminderInterval = setInterval(checkReminders, reminderFreq);
      challengeInterval = setInterval(checkChallengeOpening, challengeFreq);
      
      checkReminders();
      checkChallengeOpening();
    };

    const handleVisibilityChange = () => {
      setupIntervals(document.hidden);
    };

    // Battery API for extra precision in power management
    const setupBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          batteryInstance = await (navigator as any).getBattery();
          batteryHandler = () => {
             // Low battery (below 20%) triggers Eco Mode even if tab is visible
            setState(prev => ({ ...prev, ecoMode: batteryInstance.level <= 0.2 && !batteryInstance.charging }));
          };
          batteryInstance.addEventListener('levelchange', batteryHandler);
          batteryInstance.addEventListener('chargingchange', batteryHandler);
          batteryHandler();
        } catch (e) { console.warn('Battery API not available'); }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    setupIntervals(document.hidden);
    setupBattery();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (batteryInstance && batteryHandler) {
        batteryInstance.removeEventListener('levelchange', batteryHandler);
        batteryInstance.removeEventListener('chargingchange', batteryHandler);
      }
      if (reminderInterval) clearInterval(reminderInterval);
      if (challengeInterval) clearInterval(challengeInterval);
    };
  }, [state.session, state.user.tasks, state.user.userChallenges, state.ecoMode]);

  const cleanupUnsubscribes = () => {
    unsubscribesRef.current.forEach(unsub => unsub());
    unsubscribesRef.current = [];
  };

  useEffect(() => {
    // Listen for auth changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setState(prev => ({ ...prev, session: user }));
      if (user) {
        fetchUserData(user.uid);
      } else {
        cleanupUnsubscribes();
        setState(INITIAL_STATE);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      cleanupUnsubscribes();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challengeId = params.get('challengeId');
    if (challengeId) {
      setInitialChallengeId(challengeId);
      setState(prev => ({ ...prev, view: 'challenges' }));
      // Clear the param from URL without reloading
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const addNotification = async (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    if (!state.session) return;
    
    const docRef = doc(collection(db, 'notifications'));
    const notificationId = docRef.id;

    const newNotification: AppNotification = {
      ...notification,
      id: notificationId,
      timestamp: new Date().toISOString(),
      read: false,
    };

    try {
      // Optimistic update first for snappy UI
      setState(prev => ({
        ...prev,
        notifications: [newNotification, ...prev.notifications].slice(0, 20),
      }));

      await setDoc(docRef, {
        user_id: state.session.uid,
        type: newNotification.type,
        title: newNotification.title,
        content: newNotification.content,
        icon: newNotification.icon,
        timestamp: newNotification.timestamp,
        read: newNotification.read,
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding notification:', error);
      // Revert if needed, but snapshots usually correct this
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
    
    if (state.session) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (error) {
        console.error('Error marking notification read:', error);
      }
    }
  };

  const handleClearNotifications = async () => {
    const oldNotifications = [...state.notifications];
    setState(prev => ({ ...prev, notifications: [] }));
    
    if (state.session) {
      try {
        // Simple batch delete isn't available easily here, so we clear them one by one or trust the user wants them gone
        // Actually best to just let them clear from view or implement a server-side cleanup
        const q = query(collection(db, 'notifications'), where('user_id', '==', state.session.uid));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await deleteDoc(doc(db, 'notifications', d.id));
        });
      } catch (error) {
        setState(prev => ({ ...prev, notifications: oldNotifications }));
      }
    }
  };

  const mapTaskFromFirestore = (doc: any): Task => {
    const data = doc.data() as FirestoreTask;
    return {
      id: doc.id,
      title: data.title,
      time: data.time,
      completed: data.completed,
      priority: data.priority,
      dueDate: data.due_date || (data as any).completed_date,
      createdAt: data.created_at?.toDate?.()?.toISOString() || (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString()),
      completedAt: data.completed_at,
      focusTimeSpent: data.focus_time_spent || 0
    };
  };

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const [nasashoSnap, therapistSnap] = await Promise.all([
          getDocs(query(collection(db, 'nasasho'), where('published', '==', true))),
          getDocs(query(collection(db, 'therapists'), where('published', '==', true)))
        ]);
        
        const fetchedNasasho = nasashoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NasashoContent));
        const fetchedTherapists = therapistSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Therapist));
        
        setState(prev => ({
          ...prev,
          nasashoContent: fetchedNasasho,
          therapists: fetchedTherapists
        }));
      } catch (err) {
        console.error('Error fetching global data:', err);
      }
    };
    
    fetchGlobalData();
  }, []);

  const fetchUserData = async (userId: string) => {
    if (!userId) return;
    cleanupUnsubscribes();
    setLoading(true);
    
    try {
      // Fetch Profile
      const docRef = doc(db, 'profiles', userId);
      let docSnap;
      
      try {
        docSnap = await getDoc(docRef);
      } catch (e: any) {
        console.warn('Initial doc fetch failed, retrying...', e.message);
        // On mobile, firestore sometimes needs a second to warm up
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          docSnap = await getDoc(docRef);
        } catch (retryError) {
          console.error('Final doc fetch failed:', retryError);
          // If we can't get the profile, we'll try to continue with limited state
          // instead of crashing the whole app
          setLoading(false);
          return;
        }
      }

      if (!docSnap.exists()) {
        const today = new Date().toLocaleDateString();
        const newProfile: FirestoreProfile = { 
          name: auth.currentUser?.displayName || 'New User',
          level: 1,
          experience: 0,
          next_level_exp: 500,
          streak: 1, // Start with streak of 1
          journal_streak: 0,
          points: 0,
          sabr_points: 0,
          sabr_points_today: 0,
          growth_score: 0,
          focus_time_total: 0,
          focus_time_today: 0,
          daily_wins: 0,
          total_wins: 0,
          has_checked_in: false,
          mood_log_count_today: 0,
          encouragements_received: 0,
          last_mood_log_date: '',
          last_active_date: today,
          unlocked_features: [],
          achievements: [],
          language: 'en',
          gender: 'other', // Default to other, will try to infer if needed
          completed_resources: [],
          saved_resources: [],
          updated_at: serverTimestamp()
        };
        await setDoc(docRef, newProfile);
        updateUserState({ ...newProfile, id: userId });
      } else {
        const data = docSnap.data() as FirestoreProfile;
        const today = new Date().toLocaleDateString();
        const isNewDay = data.last_active_date !== today;
        
        if (isNewDay) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString();
          
          const isYesterday = data.last_active_date === yesterdayStr;
          let newStreak = data.streak || 0;
          
          if (isYesterday) {
            newStreak += 1;
          } else {
            newStreak = 1; // Reset to 1 for the new active day
          }

          const resetData: FirestoreProfile = {
            ...data,
            streak: newStreak,
            sabr_points_today: 0,
            focus_time_today: 0,
            daily_wins: 0,
            has_checked_in: false,
            mood_log_count_today: 0,
            last_active_date: today,
            last_login_date: today
          };
          
          // Daily Welcome Back Reward
          const welcomeReward = updateGamification(state.user, 'DAILY_WELCOME');
          Object.assign(resetData, {
            experience: welcomeReward.experience,
            sabr_points: welcomeReward.sabrPoints,
            points: welcomeReward.points,
            level: welcomeReward.level,
            sabr_points_today: 100 // Starting today with 100
          });

          await updateDoc(docRef, {
            streak: newStreak,
            sabr_points_today: 100,
            focus_time_today: 0,
            daily_wins: 0,
            has_checked_in: false,
            mood_log_count_today: 0,
            last_active_date: today,
            last_login_date: today,
            experience: welcomeReward.experience,
            sabr_points: welcomeReward.sabrPoints,
            points: welcomeReward.points,
            level: welcomeReward.level
          });

          addNotification({
            type: 'achievement',
            title: 'Welcome Back!',
            content: 'You earned 100 Sabr points for your continuous growth.',
            icon: '🌟'
          });

          updateUserState({ ...resetData, id: userId });
        } else {
          updateUserState({ ...data, id: userId });
        }
      }

      // Fetch Tasks
      if (!userId) return;
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      
      const tasksUnsub = onSnapshot(tasksQuery, (snapshot) => {
        const tasks = snapshot.docs.map(mapTaskFromFirestore);
        setState(prev => ({
          ...prev,
          user: { ...prev.user, tasks }
        }));

        // Task Reminders logic - check for tasks due today
        const todayStr = new Date().toISOString().split('T')[0];
        const dueToday = tasks.filter(t => !t.completed && t.dueDate === todayStr);
        if (dueToday.length > 0 && tasks.length > 0) {
          // Wrap in a check to avoid spamming every snapshot
          const lastReminder = localStorage.getItem('last_task_reminder');
          if (lastReminder !== todayStr) {
            addNotification({
              type: 'reminder',
              title: 'Tasks Due Today',
              content: `You have ${dueToday.length} missions to complete today. Stay focused!`,
              icon: '🎯'
            });
            localStorage.setItem('last_task_reminder', todayStr);
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'tasks');
      });
      unsubscribesRef.current.push(tasksUnsub);

      // Fetch Journal Entries
      if (!userId) return;
      const journalQuery = query(
        collection(db, 'journal_entries'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const journalUnsub = onSnapshot(journalQuery, (snapshot) => {
        const journalEntries = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            created_at: data.created_at, // Keep original for updates
            createdAt: data.created_at?.toDate?.()?.toISOString() || (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString())
          };
        }) as JournalEntry[];
        setState(prev => ({
          ...prev,
          user: { ...prev.user, journalEntries }
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'journal_entries');
      });
      unsubscribesRef.current.push(journalUnsub);

      // Fetch Mood Logs
      if (!userId) return;
      const moodQuery = query(
        collection(db, 'mood_logs'),
        where('user_id', '==', userId),
        orderBy('date', 'desc')
      );

      const moodUnsub = onSnapshot(moodQuery, (snapshot) => {
        const moodLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MoodLog[];
        setState(prev => ({
          ...prev,
          user: { ...prev.user, moodLogs }
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'mood_logs');
      });
      unsubscribesRef.current.push(moodUnsub);
      
      // Fetch Notifications
      if (!userId) return;
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const notificationsUnsub = onSnapshot(notificationsQuery, (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            ...data,
            id: doc.id, 
            content: data.content || data.message || '',
            timestamp: data.created_at?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString()
          };
        }) as AppNotification[];
        
        // Show push for new unread notifications
        if (state.session && snapshot.docChanges().length > 0) {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added' && !change.doc.data().read) {
              const data = change.doc.data();
              // Don't show notifications that are older than current session start
              const createdAt = data.created_at?.toDate();
              if (createdAt && (Date.now() - createdAt.getTime() < 60000)) {
                showLocalPush(data.title || 'Barbaar', data.content || data.message || '');
                
                // Also trigger in-app popup
                const newNotif: AppNotification = {
                  id: change.doc.id,
                  type: data.type,
                  title: data.title,
                  content: data.content || data.message || '',
                  icon: data.icon,
                  timestamp: createdAt.toISOString(),
                  read: false
                };
                setState(prev => ({ ...prev, activeNotification: newNotif }));
                // Auto-hide after 5 seconds
                setTimeout(() => {
                  setState(prev => ({ ...prev, activeNotification: null }));
                }, 5000);
              }
            }
          });
        }

        setState(prev => ({
          ...prev,
          notifications
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      });
      unsubscribesRef.current.push(notificationsUnsub);

      // Fetch Challenges
      const challengesUnsub = onSnapshot(collection(db, 'challenges'), (snapshot) => {
        const fetchedChallenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Challenge[];
        if (fetchedChallenges.length > 0) {
          setChallenges(fetchedChallenges);
        } else {
          // Seed initial challenges if empty
          INITIAL_CHALLENGES.forEach(async (c) => {
            await setDoc(doc(db, 'challenges', c.id), c);
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'challenges');
      });
      unsubscribesRef.current.push(challengesUnsub);

      // Fetch User Challenges
      const userChallengesQuery = query(
        collection(db, 'user_challenges'),
        where('user_id', '==', userId)
      );
      const userChallengesUnsub = onSnapshot(userChallengesQuery, (snapshot) => {
        const userChallenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserChallenge[];
        setState(prev => ({
          ...prev,
          user: { ...prev.user, userChallenges }
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'user_challenges');
      });
      unsubscribesRef.current.push(userChallengesUnsub);

      // Fetch Bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const bookingsUnsub = onSnapshot(bookingsQuery, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
        setState(prev => ({
          ...prev,
          user: { ...prev.user, bookings }
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'bookings');
      });
      unsubscribesRef.current.push(bookingsUnsub);

    } catch (userErr) {
      console.error('Error fetching user data:', userErr);
      addNotification({
        type: 'achievement',
        title: 'Connection Issue',
        content: 'We are having trouble reaching the server. Some features may be limited.',
        icon: '⚠️'
      });
    } finally {
      setLoading(false);
    }
  };

  const mapToFirestore = (updates: Partial<UserProfile>): FirestoreProfile => {
    const firestoreUpdates: FirestoreProfile = {};
    const mapping: Record<string, keyof FirestoreProfile> = {
      avatarUrl: 'avatar_url',
      nextLevelExp: 'next_level_exp',
      journalStreak: 'journal_streak',
      moodStreak: 'mood_streak',
      sabrPoints: 'sabr_points',
      sabrPointsToday: 'sabr_points_today',
      growthScore: 'growth_score',
      focusTimeTotal: 'focus_time_total',
      focusTimeToday: 'focus_time_today',
      dailyWins: 'daily_wins',
      totalWins: 'total_wins',
      hasCheckedIn: 'has_checked_in',
      moodLogCountToday: 'mood_log_count_today',
      lastMoodLogDate: 'last_mood_log_date',
      unlockedFeatures: 'unlocked_features',
      completedResources: 'completed_resources',
      savedResources: 'saved_resources',
      encouragementsReceived: 'encouragements_received',
      lastActiveDate: 'last_active_date',
      lastRewardDate: 'last_reward_date',
      lastLoginDate: 'last_login_date',
      lastJournalDate: 'last_journal_date',
      totalWordCount: 'total_word_count'
    };

    Object.entries(updates).forEach(([key, value]) => {
      const firestoreKey = mapping[key] || key as keyof FirestoreProfile;
      (firestoreUpdates as any)[firestoreKey] = value;
    });

    return firestoreUpdates;
  };

  const mapFromFirestore = (data: any): Partial<UserProfile> => {
    const profile: any = {
      level: data.level || 1,
      experience: data.experience || 0,
      streak: data.streak || 0,
      journalStreak: data.journal_streak || 0,
      moodStreak: data.mood_streak || 0,
      sabrPoints: data.sabr_points || 0,
      totalWordCount: data.total_word_count || 0,
      totalWins: data.total_wins || 0,
      dailyWins: data.daily_wins || 0,
      achievements: data.achievements || [],
      unlockedFeatures: data.unlocked_features || [],
      completedResources: data.completed_resources || [],
      savedResources: data.saved_resources || []
    };
    const mapping: Record<string, keyof UserProfile> = {
      avatar_url: 'avatarUrl',
      next_level_exp: 'nextLevelExp',
      journal_streak: 'journalStreak',
      mood_streak: 'moodStreak',
      sabr_points: 'sabrPoints',
      sabr_points_today: 'sabrPointsToday',
      growth_score: 'growthScore',
      focus_time_total: 'focusTimeTotal',
      focus_time_today: 'focusTimeToday',
      daily_wins: 'dailyWins',
      total_wins: 'totalWins',
      has_checked_in: 'hasCheckedIn',
      mood_log_count_today: 'moodLogCountToday',
      last_mood_log_date: 'lastMoodLogDate',
      unlocked_features: 'unlockedFeatures',
      completed_resources: 'completedResources',
      saved_resources: 'savedResources',
      encouragements_received: 'encouragementsReceived',
      last_active_date: 'lastActiveDate',
      last_reward_date: 'lastRewardDate',
      last_login_date: 'lastLoginDate',
      last_journal_date: 'lastJournalDate',
      total_word_count: 'totalWordCount'
    };

    Object.entries(data).forEach(([key, value]) => {
      const camelKey = mapping[key] || key as keyof UserProfile;
      profile[camelKey] = value;
    });

    return profile;
  };

  const updateUserState = (profile: any) => {
    const mappedProfile = mapFromFirestore(profile) as UserProfile;
    
    // Ensure achievements and unlocks are in sync with current stats
    const currentAchievements = syncAchievements(mappedProfile);
    const currentUnlocks = checkUnlocks(mappedProfile.level);
    
    const needsSync = 
      JSON.stringify(currentAchievements) !== JSON.stringify(mappedProfile.achievements) ||
      JSON.stringify(currentUnlocks) !== JSON.stringify(mappedProfile.unlockedFeatures);

    const finalProfile = {
      ...mappedProfile,
      achievements: currentAchievements,
      unlockedFeatures: currentUnlocks,
      id: profile.id || state.user.id,
      name: profile.name || state.user.name,
    };

    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        ...finalProfile
      }
    }));

    // If we detected missing achievements or unlocks, sync them back to Firestore
    if (needsSync && state.session) {
      syncProfile({
        achievements: currentAchievements,
        unlockedFeatures: currentUnlocks
      });
    }
  };

  const syncProfile = async (updates: Partial<UserProfile>) => {
    if (!state.session) return;
    try {
      const docRef = doc(db, 'profiles', state.session.uid);
      const firestoreUpdates = {
        ...mapToFirestore(updates),
        updated_at: serverTimestamp()
      };
      await updateDoc(docRef, firestoreUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${state.session.uid}`);
    }
  };

  const handleViewChange = (view: ViewType, params?: any) => {
    if (state.view !== view) {
      window.history.pushState({ 
        view, 
        viewParams: params, 
        isAddTaskOpen: false, 
        isJournalWriting: false 
      }, '');
    }
    if (view === 'challenges') {
      localStorage.setItem(`opened_challenges_${new Date().toLocaleDateString()}`, 'true');
    }
    setState(prev => ({ ...prev, view, viewParams: params }));
  };

  const handleGamificationUpdate = (action: keyof typeof XP_CONFIG, metadata?: { wordCount?: number }) => {
    const updates = updateGamification(state.user, action, metadata);
    updateUserState(updates);
    syncProfile(updates);
    
    // Check for level up notification
    if (updates.level && updates.level > state.user.level) {
      addNotification({
        type: 'achievement',
        title: 'Level Up!',
        content: `Congratulations! You've reached Level ${updates.level}.`,
        icon: '🎉'
      });
    }

    // Check for new achievements
    const newAchievements = updates.achievements?.filter(a => !state.user.achievements.includes(a)) || [];
    newAchievements.forEach(id => {
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        addNotification({
          type: 'achievement',
          title: 'Achievement Unlocked!',
          content: `You've earned the "${achievement.name}" badge!`,
          icon: achievement.icon
        });
        // Set state for unlock animation
        setUnlockedAchievement(achievement);
      }
    });
  };

  const handleSelectMood = async (mood: Mood) => {
    if (!state.session) return;

    const now = new Date();
    const isoDate = now.toISOString();
    const newCount = state.user.moodLogCountToday + 1;

    // Limit to 2 logs per day for points
    const shouldAwardPoints = newCount <= 2;

    const moodLog = {
      user_id: state.session.uid,
      date: isoDate,
      mood,
      created_at: serverTimestamp()
    };

    try {
      // Don't await here to keep the UI snappy
      addDoc(collection(db, 'mood_logs'), moodLog).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, 'mood_logs');
      });
      
      addNotification({
        type: 'achievement',
        title: 'Mood Logged',
        content: `You earned ${shouldAwardPoints ? 25 : 0} Sabr points for checking in.`,
        icon: '🧘'
      });
    } catch (error) {
      console.error('Error logging mood:', error);
    }

    if (shouldAwardPoints) {
      // Calculate Mood Streak
      const today = new Date().toLocaleDateString();
      const lastLog = state.user.lastMoodLogDate ? new Date(state.user.lastMoodLogDate).toLocaleDateString() : null;
      
      let newMoodStreak = state.user.moodStreak || 0;
      
      if (!lastLog) {
        newMoodStreak = 1;
      } else if (lastLog !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString();
        
        if (lastLog === yesterdayStr) {
          newMoodStreak += 1;
        } else {
          newMoodStreak = 1;
        }
      }

      handleGamificationUpdate('MOOD_LOG');
      
      const finalProfileUpdates = {
        mood,
        hasCheckedIn: true,
        lastMoodLogDate: isoDate,
        moodLogCountToday: newCount,
        moodStreak: newMoodStreak
      };
      
      syncProfile(finalProfileUpdates as any);
      setState(prev => ({
        ...prev,
        user: { ...prev.user, moodLogs: [{ id: `mood-${Date.now()}`, userId: state.session?.uid || '', date: isoDate, mood }, ...prev.user.moodLogs] }
      }));
      updateUserState(finalProfileUpdates as any); 
    } else {
      const finalProfileUpdates = {
        mood,
        hasCheckedIn: true,
        lastMoodLogDate: isoDate,
        moodLogCountToday: newCount,
      };
      
      syncProfile(finalProfileUpdates as any);
      setState(prev => ({
        ...prev,
        user: { ...prev.user, moodLogs: [{ id: `mood-${Date.now()}`, userId: state.session?.uid || '', date: isoDate, mood }, ...prev.user.moodLogs] }
      }));
      updateUserState(finalProfileUpdates as any);
    }
  };

  const shouldShowMoodPopup = () => {
    const hour = new Date().getHours();
    const isEvening = hour >= 18;
    
    if (state.user.moodLogCountToday === 0) return true;
    
    if (state.user.moodLogCountToday === 1 && isEvening) {
      if (state.user.lastMoodLogDate) {
        const lastLog = new Date(state.user.lastMoodLogDate);
        const now = new Date();
        const diffHours = (now.getTime() - lastLog.getTime()) / (1000 * 60 * 60);
        return diffHours > 4;
      }
      return true;
    }
    
    return false;
  };

  const handleToggleTask = async (id: string) => {
    const task = state.user.tasks.find(t => t.id === id);
    if (!task) return;

    // Optimistically update UI first to prevent double-tap feeling
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        tasks: prev.user.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      }
    }));

    if (state.session) {
      try {
        const completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const completedDate = new Date().toISOString().split('T')[0];
        
        await updateDoc(doc(db, 'tasks', id), { 
          completed: !task.completed,
          completed_at: !task.completed ? completedAt : null,
          completed_date: !task.completed ? completedDate : null
        });

        if (!task.completed) {
          handleGamificationUpdate('TASK_COMPLETE');
          const totalWins = (state.user.totalWins || 0) + 1;
          syncProfile({ totalWins } as any);
          setState(prev => ({ 
            ...prev, 
            user: { 
              ...prev.user, 
              totalWins,
              tasks: prev.user.tasks.map(t => t.id === id ? { 
                ...t, 
                completed: true, 
                completedAt: completedAt,
                dueDate: t.dueDate || completedDate // Ensure it shows in "today" if no date was set
              } : t)
            } 
          }));
          addNotification({
            type: 'achievement',
            title: 'Task Completed',
            content: `Great job! "${task.title}" is done. +50 Sabr points.`,
            icon: '✅'
          });
        }
      } catch (error) {
        // Rollback on error
        setState(prev => ({
          ...prev,
          user: {
            ...prev.user,
            tasks: prev.user.tasks.map(t => t.id === id ? { ...t, completed: task.completed } : t)
          }
        }));
        handleFirestoreError(error, OperationType.UPDATE, 'tasks');
      }
    }
  };

  const handleStartFocus = (id: string) => {
    setFocusingTaskId(id);
  };

  const handleFocusComplete = async (timeSpent: number) => {
    if (!focusingTaskId || !state.session) return;

    const task = state.user.tasks.find(t => t.id === focusingTaskId);
    if (task) {
      try {
        const completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const completedDate = new Date().toISOString().split('T')[0];

        await updateDoc(doc(db, 'tasks', focusingTaskId), { 
          completed: true, 
          completed_at: completedAt,
          completed_date: completedDate,
          focus_time_spent: (task.focusTimeSpent || 0) + timeSpent
        });
        addNotification({
          type: 'achievement',
          title: 'Focus Session',
          content: `You focused for ${Math.floor(timeSpent / 60)} minutes. +50 Sabr points.`,
          icon: '⏱️'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'tasks');
      }
    }

    const updates = updateGamification(state.user, 'FOCUS_SESSION');
    const finalUpdates = {
      ...updates,
      focus_time_total: (state.user.focusTimeTotal || 0) + timeSpent,
      focus_time_today: (state.user.focusTimeToday || 0) + timeSpent,
      daily_wins: (state.user.dailyWins || 0) + 1,
      total_wins: (state.user.totalWins || 0) + 1,
      sabr_points: updates.sabrPoints,
      next_level_exp: updates.nextLevelExp,
      unlocked_features: updates.unlockedFeatures
    };
    
    syncProfile(finalUpdates as any);

    setState(prev => {
      const newTasks = prev.user.tasks.map(t => 
        t.id === focusingTaskId 
          ? { 
              ...t, 
              completed: true, 
              completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
              focusTimeSpent: (t.focusTimeSpent || 0) + timeSpent 
            } 
          : t
      );

      return {
        ...prev,
        user: {
          ...prev.user,
          ...updates,
          focusTimeTotal: (prev.user.focusTimeTotal || 0) + timeSpent,
          focusTimeToday: (prev.user.focusTimeToday || 0) + timeSpent,
          dailyWins: (prev.user.dailyWins || 0) + 1,
          totalWins: (prev.user.totalWins || 0) + 1,
          tasks: newTasks
        }
      };
    });
    setFocusingTaskId(null);
  };

  const handleDeleteTask = async (id: string) => {
    if (state.session) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'tasks');
      }
    }
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        tasks: prev.user.tasks.filter(t => t.id !== id)
      }
    }));
  };

  const handleReorderTasks = (activeId: string, overId: string) => {
    setState(prev => {
      const oldIndex = prev.user.tasks.findIndex(t => t.id === activeId);
      const newIndex = prev.user.tasks.findIndex(t => t.id === overId);
      return {
        ...prev,
        user: {
          ...prev.user,
          tasks: arrayMove(prev.user.tasks, oldIndex, newIndex)
        }
      };
    });
  };

  const handleAddTask = async (title: string, time: string, priority: Priority, dueDate: string) => {
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTask: Task = {
      id: newId,
      title,
      time,
      completed: false,
      priority,
      dueDate,
      createdAt: new Date().toISOString(),
      focusTimeSpent: 0
    };

    if (state.session) {
      try {
        const docRef = await addDoc(collection(db, 'tasks'), {
          user_id: state.session.uid,
          title,
          time,
          priority,
          due_date: dueDate,
          created_at: serverTimestamp(),
          completed: false,
          focus_time_spent: 0
        });
        
        setFocusingTaskId(docRef.id);
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'tasks');
      }
    }

    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        tasks: [newTask, ...prev.user.tasks]
      }
    }));
    setFocusingTaskId(newId);
  };

  const handleAddJournal = async (content: string, mood?: Mood): Promise<string> => {
    if (!state.session) return '';

    const newEntry = {
      user_id: state.session.uid,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content,
      mood: mood || state.user.mood,
      created_at: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, 'journal_entries'), newEntry);
      
      const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
      handleGamificationUpdate('JOURNAL_ENTRY', { wordCount });

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'journal_entries');
      return '';
    }
  };

  const handleUpdateJournal = async (id: string, content: string, mood?: Mood) => {
    if (!state.session) return;

    const entry = state.user.journalEntries.find(e => e.id === id);
    if (!entry) return;

    const oldWordCount = entry.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const newWordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const diff = newWordCount - oldWordCount;

    try {
      await updateDoc(doc(db, 'journal_entries', id), {
        content,
        mood: mood || entry.mood,
        updated_at: serverTimestamp()
      });

      // Update word count in gamification without adding XP again
      const updates = updateGamification(state.user, 'JOURNAL_ENTRY', { wordCount: diff });
      delete updates.experience;
      delete updates.points;
      delete updates.sabrPoints;
      
      updateUserState(updates);
      syncProfile(updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'journal_entries');
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!state.session) return;
    try {
      await deleteDoc(doc(db, 'journal_entries', id));
      addNotification({
        type: 'encouragement',
        title: 'Entry Removed',
        content: 'Your journal entry has been deleted.',
        icon: '🗑️'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `journal_entries/${id}`);
    }
  };

  const handleToggleLanguage = () => {
    const newLang = state.user.language === 'en' ? 'so' : 'en';
    setState(prev => ({
      ...prev,
      user: { ...prev.user, language: newLang }
    }));
    if (state.session?.uid) {
      updateDoc(doc(db, 'profiles', state.session.uid), { language: newLang }).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, `profiles/${state.session?.uid}`);
      });
    }
  };

  const handleCompleteResource = (resourceId: string) => {
    if (state.user.completedResources.includes(resourceId)) return;

    const newCompleted = [...state.user.completedResources, resourceId];
    const gamificationUpdate = updateGamification(state.user, 'ARTICLE_READ');
    
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        ...gamificationUpdate,
        completedResources: newCompleted
      }
    }));

    if (state.session?.uid) {
      updateDoc(doc(db, 'profiles', state.session.uid), {
        experience: gamificationUpdate.experience,
        sabr_points: gamificationUpdate.sabrPoints,
        points: gamificationUpdate.points,
        level: gamificationUpdate.level,
        next_level_exp: gamificationUpdate.nextLevelExp,
        unlocked_features: gamificationUpdate.unlockedFeatures,
        achievements: gamificationUpdate.achievements,
        completed_resources: newCompleted,
        growth_score: gamificationUpdate.growthScore
      }).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, `profiles/${state.session?.uid}`);
      });
    }
  };

  const handleReadResource = async (resource: Resource) => {
    if (!state.session) return;

    const isAlreadyCompleted = state.user.completedResources?.includes(resource.id);
    const completedResources = isAlreadyCompleted 
      ? state.user.completedResources 
      : [...(state.user.completedResources || []), resource.id];

    const updates = updateGamification(state.user, 'ARTICLE_READ');
    const finalUpdates = {
      ...updates,
      completed_resources: completedResources,
      daily_wins: state.user.dailyWins + 1,
      total_wins: (state.user.totalWins || 0) + 1,
      sabr_points: updates.sabrPoints,
      next_level_exp: updates.nextLevelExp,
      unlocked_features: updates.unlockedFeatures
    };

    syncProfile(finalUpdates as any);

    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        ...updates,
        completedResources,
        dailyWins: prev.user.dailyWins + 1
      }
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setState(INITIAL_STATE);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBookTherapist = async (booking: Booking) => {
    if (!state.session) return;
    
    try {
      await addDoc(collection(db, 'bookings'), {
        user_id: state.session.uid,
        ...booking,
        created_at: serverTimestamp()
      });
      
      addNotification({
        type: 'reminder',
        title: 'Session Booked',
        content: `Your session is confirmed for ${booking.date} at ${booking.time}.`,
        icon: '📅'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const handleThemeChange = (theme: ThemeType) => {
    setState(prev => ({ ...prev, theme }));
  };

  const completedCount = state.user.tasks.filter(t => t.completed).length;
  const totalCount = state.user.tasks.length > 8 ? state.user.tasks.length : 8;

  const todayDate = new Date();
  const hour = todayDate.getHours();
  let greeting = 'Hey';
  if (hour < 12) greeting = 'Maalin wanaagsan'; // Good morning/day
  else if (hour < 18) greeting = 'Galab wanaagsan'; // Good afternoon
  else greeting = 'Habeen wanaagsan'; // Good evening

  const dateString = todayDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleSanctuaryComplete = async (points: number) => {
    if (!state.session) return;
    
    const updates = updateGamification(state.user, 'FOCUS_SESSION'); // Reuse focus session for points
    const timeSpent = 180; // Sanctuary session is roughly 3 mins
    
    const finalUpdates = {
      ...updates,
      focus_time_total: (state.user.focusTimeTotal || 0) + timeSpent,
      focus_time_today: (state.user.focusTimeToday || 0) + timeSpent,
      sabr_points: (state.user.sabrPoints || 0) + points,
      sabr_points_today: (state.user.sabrPointsToday || 0) + points,
      total_wins: (state.user.totalWins || 0) + 1
    };

    syncProfile(finalUpdates as any);
    updateUserState(finalUpdates);
    
    addNotification({
      type: 'encouragement',
      title: 'Haruun Sanctuary Complete',
      content: `You've emerged from the sanctuary with patience. +${points} Sabr points.`,
      icon: '🌿'
    });
    
    handleViewChange('home');
  };

  const handleOpenAddTask = () => {
    window.history.pushState({ ...window.history.state, isAddTaskOpen: true }, '');
    setIsAddTaskOpen(true);
  };

  const handleCloseAddTask = () => {
    if (isAddTaskOpen) {
      window.history.back();
    }
  };

  const handleSetJournalWriting = (writing: boolean) => {
    if (writing) {
      window.history.pushState({ ...window.history.state, isJournalWriting: true }, '');
    } else if (isJournalWriting) {
      window.history.back();
      return; // popstate will handle state update
    }
    setIsJournalWriting(writing);
  };

  const handleSelectResource = (resource: Resource) => {
    window.history.pushState({ 
      view: state.view, 
      viewParams: state.viewParams, 
      selectedResource: resource 
    }, '');
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        selectedResource: resource
      }
    }));
  };

  const handleToggleSaveResource = async (resourceId: string) => {
    if (!state.user.id) return;
    try {
      const isSaved = state.user.savedResources?.includes(resourceId);
      const newSaved = isSaved 
        ? state.user.savedResources.filter(id => id !== resourceId)
        : [...(state.user.savedResources || []), resourceId];
      
      const profileId = state.user.id || state.session?.uid;
      if (!profileId) throw new Error('No user profile ID found');

      await updateDoc(doc(db, 'profiles', profileId), {
        savedResources: newSaved
      });

      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          savedResources: newSaved
        }
      }));

      addNotification({
        type: 'achievement',
        title: isSaved ? 'Removed from Saved' : 'Saved for Later',
        content: isSaved ? 'Resource removed from your library.' : 'Resource added to your library.',
        icon: isSaved ? '🗑️' : '🔖'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'profiles');
    }
  };

  const handleBackFromReader = () => {
    window.history.back(); // Use browser history to go back
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!state.session) return;
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + challenge.durationDays);

    const newUserChallenge: Partial<UserChallenge> = {
      user_id: state.session.uid,
      challengeId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      currentDay: 1,
      dailyProgress: {},
      streak: 0
    };

    try {
      await addDoc(collection(db, 'user_challenges'), newUserChallenge);
      addNotification({
        type: 'achievement',
        title: 'Challenge Accepted!',
        content: `You've started the ${challenge.title}. Stay disciplined!`,
        icon: '🛡️'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'user_challenges');
    }
  };

  const handleCheckInChallenge = async (userChallengeId: string, taskId: string) => {
    if (!state.session) return;
    const userChallenge = state.user.userChallenges.find(uc => uc.id === userChallengeId);
    if (!userChallenge) return;

    const challenge = challenges.find(c => c.id === userChallenge.challengeId);
    if (!challenge) return;

    const today = new Date().toLocaleDateString();
    const currentProgress = userChallenge.dailyProgress[today] || { completedTasks: [], percentage: 0 };
    
    const isCheckingIn = !currentProgress.completedTasks.includes(taskId);
    const newCompletedTasks = isCheckingIn
      ? [...currentProgress.completedTasks, taskId]
      : currentProgress.completedTasks.filter(id => id !== taskId);
    
    const newPercentage = (newCompletedTasks.length / challenge.tasks.length) * 100;

    const updatedProgress = {
      ...userChallenge.dailyProgress,
      [today]: {
        completedTasks: newCompletedTasks,
        percentage: newPercentage
      }
    };

    try {
      await updateDoc(doc(db, 'user_challenges', userChallengeId), {
        dailyProgress: updatedProgress,
        streak: (newPercentage === 100 && isCheckingIn) ? userChallenge.streak + 1 : userChallenge.streak,
        lastCheckInDate: new Date().toISOString()
      });

      if (newPercentage === 100 && isCheckingIn) {
        handleGamificationUpdate('TASK_COMPLETE'); // Reward for finishing daily roadmap
        const totalWins = (state.user.totalWins || 0) + 1;
        syncProfile({ totalWins } as any);
        setState(prev => ({ 
          ...prev, 
          user: { ...prev.user, totalWins } 
        }));
        addNotification({
          type: 'achievement',
          title: 'Roadmap Complete!',
          content: 'You finished all tasks for today. Keep it up!',
          icon: '🔥'
        });
      }

      if (isCheckingIn) {
        handleGamificationUpdate('CHALLENGE_CHECKIN');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'user_challenges');
      // Revert optimistic update on error? For now, let's keep it simple.
    }
  };

  const handleLeaveChallenge = async (userChallengeId: string) => {
    if (!state.session) return;
    try {
      await deleteDoc(doc(db, 'user_challenges', userChallengeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'user_challenges');
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!state.session) return;
    try {
      await deleteDoc(doc(db, 'challenges', challengeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'challenges');
    }
  };

  const handleCreateChallenge = async (challengeData: Partial<Challenge>) => {
    if (!state.session) return;
    
    const newChallenge = {
      ...challengeData,
      createdBy: state.session.uid,
      participantsCount: 1,
      published: false,
      terms: challengeData.terms || []
    };

    try {
      const docRef = await addDoc(collection(db, 'challenges'), newChallenge);
      handleJoinChallenge(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'challenges');
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.session) return;
    
    try {
      const profileRef = doc(db, 'profiles', state.session.uid);
      const firestoreUpdates: any = {};
      
      if (updates.name) firestoreUpdates.name = updates.name;
      if (updates.gender) firestoreUpdates.gender = updates.gender;
      if (updates.avatarUrl) firestoreUpdates.avatar_url = updates.avatarUrl;
      
      await updateDoc(profileRef, {
        ...firestoreUpdates,
        updated_at: serverTimestamp()
      });
      
      addNotification({
        type: 'achievement',
        title: 'Profile Updated',
        content: 'Your identity settings have been saved.',
        icon: '👤'
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, 'profiles');
    }
  };

  const handleSendEncouragement = async (targetUserId: string, message: string) => {
    if (!state.session) return;
    
    // 1. One encouragement per day per person
    const today = new Date().toISOString().split('T')[0];
    const clapKey = `clap_${state.session.uid}_${targetUserId}_${today}`;
    
    if (localStorage.getItem(clapKey)) {
      addNotification({
        type: 'encouragement',
        title: 'Daily Limit Reached',
        content: 'You can already sent support to this user today. Keep it valuable!',
        icon: '⏳'
      });
      return;
    }

    const isNudge = message.includes('rooting for you');

    try {
      await addDoc(collection(db, 'notifications'), {
        user_id: targetUserId,
        type: isNudge ? 'nudge' : 'encouragement',
        title: isNudge ? 'Nudge Received! ⚡' : 'New Clap Received! 👏',
        content: message,
        icon: isNudge ? '⚡' : '👏',
        read: false,
        created_at: serverTimestamp()
      });

      // Increment encouragementsReceived for the target user
      const targetProfileRef = doc(db, 'profiles', targetUserId);
      const targetProfileSnap = await getDoc(targetProfileRef);
      if (targetProfileSnap.exists()) {
        const currentData = targetProfileSnap.data();
        await updateDoc(targetProfileRef, {
          encouragements_received: (currentData.encouragements_received || 0) + 1
        });
      }

      localStorage.setItem(clapKey, 'true');

      addNotification({
        type: 'achievement',
        title: 'Applauded Partner',
        content: `You sent a clap to your partner. Support is everything!`,
        icon: '👏'
      });
      handleGamificationUpdate('COMMUNITY_INTERACTION'); // Small reward for supporting others
    } catch (error) {
      console.error('Error sending encouragement:', error);
    }
  };

  const renderView = () => {
    switch (state.view) {
      case 'home':
        return (
          <HomeView 
            userName={state.user.name}
            gender={state.user.gender}
            level={state.user.level}
            tasks={state.user.tasks}
            userChallenges={state.user.userChallenges}
            journalEntries={state.user.journalEntries}
            moodLogs={state.user.moodLogs}
            bookings={state.user.bookings}
            onToggleTask={handleToggleTask}
            onStartFocus={handleStartFocus}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={handleReorderTasks}
            onAddTask={handleOpenAddTask}
            totalPoints={state.user.sabrPoints}
            totalWords={state.user.totalWordCount}
            totalWins={state.user.totalWins}
            onSelectMood={handleSelectMood}
            onViewChange={handleViewChange}
            growthScore={state.user.growthScore}
            streak={state.user.streak}
          />
        );
      case 'journal':
        return (
          <motion.div key="journal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <JournalView 
              entries={state.user.journalEntries} 
              moodLogs={state.user.moodLogs}
              onAddEntry={handleAddJournal} 
              onUpdateEntry={handleUpdateJournal}
              onDeleteEntry={handleDeleteJournal}
              onBack={() => handleViewChange('home')}
              onWritingModeChange={handleSetJournalWriting}
            />
          </motion.div>
        );
      case 'therapy':
        return (
          <TherapyView 
            user={state.user}
            therapists={state.therapists}
            onBack={() => handleViewChange('home')} 
            onBookTherapist={handleBookTherapist}
            initialTab={state.viewParams?.tab}
          />
        );
      case 'profile':
        return (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfileView 
              name={state.user.name} 
              level={state.user.level}
              experience={state.user.experience}
              nextLevelExp={state.user.nextLevelExp}
              streak={state.user.streak} 
              points={state.user.points} 
              badges={state.user.badges} 
              milestones={state.user.milestones}
              tasks={state.user.tasks}
              bookings={state.user.bookings}
              unlockedFeatures={state.user.unlockedFeatures}
              userAchievements={state.user.achievements}
              encouragementsReceived={state.user.encouragementsReceived}
              totalWordCount={state.user.totalWordCount}
              totalWins={state.user.totalWins}
              gender={state.user.gender}
              isAdmin={state.session?.email === 'qaalidibrahim.996@gmail.com'}
              onAdminClick={() => handleViewChange('admin')}
              onUpdateProfile={handleUpdateProfile}
              onBack={() => handleViewChange('home')}
              onLogout={handleLogout}
            />
          </motion.div>
        );
      case 'admin':
        return (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminDashboard onBack={() => handleViewChange('profile')} />
          </motion.div>
        );
      case 'nasasho':
        return (
          <motion.div key="nasasho" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NasashoView 
              content={state.nasashoContent}
              onBack={() => handleViewChange('home')} 
              audio={{
                currentTrack,
                setCurrentTrack,
                isPlaying,
                setIsPlaying,
                setIsFullScreen: setIsFullScreenPlayer
              }}
            />
          </motion.div>
        );
      case 'challenges':
        return (
          <motion.div key="challenges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ChallengesView 
              challenges={challenges}
              userChallenges={state.user.userChallenges}
              userAchievements={state.user.achievements}
              sabrPoints={state.user.sabrPoints}
              points={state.user.points}
              isAdmin={state.session?.email === 'qaalidibrahim.996@gmail.com'}
              onJoinChallenge={handleJoinChallenge}
              onLeaveChallenge={handleLeaveChallenge}
              onCheckIn={handleCheckInChallenge}
              onCreateChallenge={handleCreateChallenge}
              onDeleteChallenge={handleDeleteChallenge}
              onSendEncouragement={handleSendEncouragement}
              onBack={() => handleViewChange('home')}
              initialChallengeId={initialChallengeId || undefined}
            />
          </motion.div>
        );
      case 'resources':
        return (
          <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {state.user.selectedResource ? (
              <ResourceReader 
                resource={state.user.selectedResource} 
                onBack={handleBackFromReader} 
                onComplete={handleReadResource}
                theme={state.theme}
                onThemeChange={handleThemeChange}
              />
            ) : (
              <ResourceView 
                onSelectResource={handleSelectResource} 
                onBack={() => handleViewChange('home')}
                savedResources={state.user.savedResources || []}
                completedResources={state.user.completedResources || []}
                onToggleSave={handleToggleSaveResource}
              />
            )}
          </motion.div>
        );
      case 'sanctuary':
        return (
          <SanctuaryMode 
            onComplete={handleSanctuaryComplete}
            onExit={() => handleViewChange('home')}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={48} />
      </div>
    );
  }

  if (!state.session) {
    return <Auth onAuthSuccess={(user) => setState(prev => ({ ...prev, session: user }))} />;
  }

  return (
    <div className="h-screen max-w-md mx-auto bg-bg text-text relative overflow-hidden flex flex-col antialiased transition-colors duration-500">
      {state.view !== 'sanctuary' && !state.user.selectedResource && (
        <Header 
          theme={state.theme} 
          onThemeChange={handleThemeChange} 
          notifications={state.notifications}
          onMarkRead={handleMarkNotificationRead}
          onClearAll={handleClearNotifications}
          activeView={state.view}
          onViewChange={handleViewChange}
        />
      )}
      
      <AnimatePresence>
        {shouldShowMoodPopup() && (
          <MoodCheckInOverlay onSelectMood={handleSelectMood} />
        )}
        {focusingTaskId && (
          <FocusTimer 
            taskTitle={state.user.tasks.find(t => t.id === focusingTaskId)?.title || ''}
            onComplete={handleFocusComplete}
            onCancel={() => setFocusingTaskId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <motion.div 
          key={state.view} 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto custom-scrollbar pb-24"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {unlockedAchievement && (
          <AchievementUnlockOverlay 
            achievement={unlockedAchievement} 
            onClose={() => setUnlockedAchievement(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-0 right-0 z-[200] max-w-sm mx-auto px-4 pointer-events-none"
          >
            <div 
              className="bg-card/95 backdrop-blur-md border border-brand/20 p-4 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex items-center justify-between gap-4 pointer-events-auto cursor-pointer active:scale-95 transition-transform"
              onClick={() => {
                setState(prev => ({ ...prev, activeNotification: null, view: 'home' })); // Could route to notifications
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-xl shadow-inner">
                  {state.activeNotification.icon || '🔔'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-text uppercase tracking-tight truncate">{state.activeNotification.title}</h4>
                  <p className="text-[10px] font-bold text-text/40 truncate">{state.activeNotification.content}</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setState(prev => ({ ...prev, activeNotification: null }));
                }}
                className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center text-text/20 hover:text-text hover:bg-text/10"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(state.view === 'home' || state.view === 'journal' || state.view === 'resources' || state.view === 'nasasho' || state.view === 'profile' || state.view === 'challenges') && !state.user.selectedResource && !isJournalWriting && (
        <BottomNav 
          activeView={state.view} 
          onViewChange={handleViewChange} 
        />
      )}

      <AnimatePresence>
        {isAddTaskOpen && (
          <AddTaskModal 
            onClose={handleCloseAddTask} 
            onAdd={handleAddTask} 
          />
        )}
      </AnimatePresence>

      {/* Global Audio Player - Mini Player (Persistent) */}
      <AnimatePresence>
        {currentTrack && !isFullScreenPlayer && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-[92px] left-4 right-4 z-[60]"
          >
            <div 
              onClick={() => setIsFullScreenPlayer(true)}
              className="bg-white/80 backdrop-blur-2xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[24px] p-2 flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-sm relative bg-card">
                <img src={currentTrack.image} alt="" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                {isBuffering && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={16} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-[13px] font-black truncate tracking-tight text-text">{currentTrack.title}</h4>
                <div className="flex items-center gap-1.5 opacity-40">
                  <span className="text-[9px] font-black uppercase tracking-widest text-text">{currentTrack.category}</span>
                  <div className="w-0.5 h-0.5 bg-text/40 rounded-full" />
                  <span className="text-[9px] font-bold uppercase tracking-widest truncate text-text">{currentTrack.reciter || 'Academy'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 pr-1" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={handleTogglePlay}
                  className="w-10 h-10 bg-brand text-brand-dark rounded-xl flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-lg shadow-brand/10"
                >
                  {isPlaying ? (
                    <Pause size={18} fill="currentColor" strokeWidth={0} />
                  ) : (
                    <Play size={18} fill="currentColor" strokeWidth={0} className="ml-0.5" />
                  )}
                </button>
                <button 
                  onClick={() => { setCurrentTrack(null); setIsPlaying(false); }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-text/20 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Progress Detail */}
              <div className="absolute bottom-0 left-0 h-[3px] w-full bg-black/5 rounded-full overflow-hidden">
                <motion.div 
                   className="h-full bg-brand" 
                   style={{ width: `${progress}%` }} 
                   transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Audio Player - Full Screen */}
      <AnimatePresence>
        {isFullScreenPlayer && currentTrack && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-bg flex flex-col pt-safe"
          >
            {/* Immersive Background Blur - Recipe 7 */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
              <div 
                className="absolute inset-0 blur-[100px] opacity-20 transition-all duration-1000 scale-150"
                style={{ 
                  background: `radial-gradient(circle at 50% 50%, var(--color-brand) 0%, transparent 70%)` 
                }}
              />
            </div>

            <header className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
              <button 
                onClick={() => setIsFullScreenPlayer(false)}
                className="w-10 h-10 rounded-2xl bg-white border border-border/50 flex items-center justify-center text-text/40 hover:text-brand transition-all active:scale-90 shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <span className="text-[9px] font-black text-brand uppercase tracking-[0.4em] mb-0.5 block">Now Playing</span>
                <span className="text-[11px] font-black text-text/20 uppercase tracking-[0.2em]">{currentTrack.category}</span>
              </div>
              <button 
                onClick={() => { setIsFullScreenPlayer(false); setCurrentTrack(null); setIsPlaying(false); }}
                className="w-10 h-10 rounded-2xl bg-white border border-border/50 flex items-center justify-center text-text/20 hover:text-rose-500 transition-all active:scale-90 shadow-sm"
              >
                <X size={20} />
              </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-8 pb-12 max-w-xl mx-auto w-full">
              {currentTrack.embedUrl && !currentTrack.embedUrl.includes('archive.org') ? (
                <div className="w-full aspect-video rounded-[32px] overflow-hidden border border-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] bg-card mb-12 relative">
                  <iframe 
                    src={getEmbedUrl(currentTrack.embedUrl)} 
                    className="w-full h-full object-cover" 
                    allow="autoplay; encrypted-media" 
                    title={currentTrack.title} 
                  />
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  {/* High Precision Image - Rounded 32px */}
                  <motion.div 
                    layoutId={`player-image-${currentTrack.id}`}
                    className="w-full max-w-[320px] aspect-square rounded-[40px] overflow-hidden shadow-[0_48px_96px_-24px_rgba(118,176,110,0.25)] border border-white mb-12 relative bg-card group"
                  >
                    <img 
                      src={currentTrack.image} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[5000ms]" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                  </motion.div>

                  <div className="w-full text-center mb-10">
                    <h3 className="text-3xl font-black mb-3 tracking-tighter text-text leading-tight">{currentTrack.title}</h3>
                    <div className="flex items-center justify-center gap-3">
                      <span className="px-3 py-1 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-widest rounded-full">{currentTrack.category}</span>
                      <span className="w-1 h-1 rounded-full bg-text/10" />
                      <p className="text-[11px] text-text/40 font-black uppercase tracking-[0.2em]">{currentTrack.reciter || 'Voice of Academy'}</p>
                    </div>

                    {playbackError && (
                      <div className="mt-8 inline-flex items-center gap-2 text-rose-500 text-[10px] font-bold bg-rose-50 px-5 py-2.5 rounded-full border border-rose-100 animate-pulse">
                        <AlertCircle size={14} />
                        {playbackError}
                      </div>
                    )}
                  </div>

                  <div className="w-full space-y-10">
                    {/* Professional Range Slider */}
                    <div className="space-y-4">
                      <div className="relative group px-1">
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime || 0}
                          onChange={(e) => handleAudioSeekTo(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-black/5 rounded-full appearance-none cursor-pointer outline-none active:h-2 transition-all"
                          style={{
                             background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${progress}%, rgba(0,0,0,0.05) ${progress}%, rgba(0,0,0,0.05) 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-black text-text/30 tracking-[0.2em] uppercase px-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{currentTrack.duration || '0:00'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <button 
                        onClick={() => {
                          const speeds = [1, 1.25, 1.5, 2];
                          const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                          setPlaybackSpeed(speeds[nextIndex]);
                        }} 
                        className="w-12 h-12 flex flex-col items-center justify-center group active:scale-95 transition-transform"
                      >
                        <span className="text-[8px] font-black text-text/20 uppercase tracking-widest group-hover:text-text/40 mb-1">Speed</span>
                        <span className="text-[12px] font-black text-brand">{playbackSpeed}x</span>
                      </button>
                      
                      <div className="flex items-center gap-8">
                        <button onClick={() => handleAudioSeek(-10)} className="w-12 h-12 flex items-center justify-center text-text/20 hover:text-brand transition-all active:scale-90">
                          <RotateCcw size={28} strokeWidth={2.5} />
                        </button>
                        
                        <button 
                          onClick={handleTogglePlay}
                          className="w-20 h-20 bg-brand text-brand-dark rounded-[30px] flex items-center justify-center shadow-[0_20px_40px_rgba(118,176,110,0.3)] hover:scale-105 active:scale-95 transition-all text-white border-2 border-white/20"
                        >
                          {isPlaying ? (
                            <Pause size={32} fill="currentColor" strokeWidth={0} />
                          ) : (
                            <Play size={32} fill="currentColor" strokeWidth={0} className="ml-1.5" />
                          )}
                        </button>
                        
                        <button onClick={() => handleAudioSeek(10)} className="w-12 h-12 flex items-center justify-center text-text/20 hover:text-brand transition-all active:scale-90">
                          <RotateCw size={28} strokeWidth={2.5} />
                        </button>
                      </div>

                      <button className="w-12 h-12 flex items-center justify-center text-text/20 hover:text-rose-400 transition-all active:scale-95">
                        <Heart size={24} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>

            <footer className="p-8 pb-12 shrink-0">
               <div className="max-w-xs mx-auto grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: currentTrack.title, url: window.location.href }).catch(() => {});
                        }
                    }}
                    className="flex items-center justify-center gap-3 py-4 rounded-3xl bg-white border border-border shadow-sm text-text/40 hover:text-brand transition-all group active:scale-95"
                  >
                    <Share2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                  </button>
                  <div className="flex items-center justify-center gap-3 py-4 rounded-3xl bg-white border border-border shadow-sm text-text/20">
                     <Volume2 size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Adaptive</span>
                  </div>
               </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <audio 
        ref={audioRef}
        {...({ referrerPolicy: 'no-referrer' } as any)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            setCurrentTime(current);
            if (!isNaN(total) && total > 0) {
              setProgress((current / total) * 100);
              setDuration(total);
            }
          }
        }}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onError={(e) => {
          const error = (e.target as HTMLAudioElement).error;
          setIsPlaying(false);
          setPlaybackError(error?.code === 4 ? "Audio format or source restricted." : "Playback failed.");
        }}
        className="hidden"
      />
    </div>
  );
}
