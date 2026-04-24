import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Music, 
  Plus, 
  Trash2, 
  Edit2, 
  BarChart3, 
  ArrowLeft, 
  Save, 
  X, 
  Image as ImageIcon, 
  Mic, 
  FileText, 
  TrendingUp, 
  Activity,
  Heart,
  ShieldCheck,
  Search,
  Filter,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, query, orderBy, serverTimestamp, limit, getCountFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Resource, Therapist, NasashoContent, ViewType } from '../types';
import { AdminChatManager } from './AdminChatManager';
import { cn } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminTab = 'insights' | 'library' | 'therapy' | 'nasasho' | 'chat';

export const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('insights');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [nasasho, setNasasho] = useState<NasashoContent[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [therapistsCount, setTherapistsCount] = useState(0);
  const [nasashoCount, setNasashoCount] = useState(0);
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [recentTherapists, setRecentTherapists] = useState<Therapist[]>([]);
  const [recentNasasho, setRecentNasasho] = useState<NasashoContent[]>([]);
  const [editingItem, setEditingItem] = useState<{ type: AdminTab, id: string } | null>(null);
  
  // Form states
  const [resourceForm, setResourceForm] = useState<Partial<Resource>>({
    title: '',
    type: 'Article',
    category: 'Wellness',
    image: '',
    duration: '',
    content: '',
    author: '',
    language: 'en',
    published: true
  });

  const [therapistForm, setTherapistForm] = useState<Partial<Therapist>>({
    name: '',
    specialty: '',
    bio: '',
    image: '',
    rate: '',
    rating: 5.0,
    availableSlots: ['9:00 AM', '2:00 PM', '5:00 PM'],
    published: true
  });

  const [nasashoForm, setNasashoForm] = useState<Partial<NasashoContent>>({
    title: '',
    category: 'Quran',
    audioUrl: '',
    embedUrl: '',
    duration: '',
    image: '',
    description: '',
    reciter: '',
    published: true
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'insights') {
        const [userCountRes, resourceCountRes, therapistCountRes, nasashoCountRes] = await Promise.all([
          getCountFromServer(collection(db, 'profiles')),
          getCountFromServer(collection(db, 'resources')),
          getCountFromServer(collection(db, 'therapists')),
          getCountFromServer(collection(db, 'nasasho'))
        ]);
        
        setUserCount(userCountRes.data().count);
        setResourcesCount(resourceCountRes.data().count);
        setTherapistsCount(therapistCountRes.data().count);
        setNasashoCount(nasashoCountRes.data().count);

        // Fetch recent items for activity
        const recentResQ = query(collection(db, 'resources'), orderBy('createdAt', 'desc'), limit(2));
        const recentTherQ = query(collection(db, 'therapists'), orderBy('createdAt', 'desc'), limit(2));
        const recentNasQ = query(collection(db, 'nasasho'), orderBy('createdAt', 'desc'), limit(2));

        const [recentResSnap, recentTherSnap, recentNasSnap] = await Promise.all([
          getDocs(recentResQ),
          getDocs(recentTherQ),
          getDocs(recentNasQ)
        ]);

        setRecentResources(recentResSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
        setRecentTherapists(recentTherSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Therapist)));
        setRecentNasasho(recentNasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NasashoContent)));
      } else if (activeTab === 'library') {
        try {
          const q = query(collection(db, 'resources'), orderBy('title'));
          const snap = await getDocs(q);
          setResources(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, 'resources');
        }
      } else if (activeTab === 'therapy') {
        try {
          const q = query(collection(db, 'therapists'), orderBy('name'));
          const snap = await getDocs(q);
          setTherapists(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Therapist)));
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, 'therapists');
        }
      } else if (activeTab === 'nasasho') {
        try {
          const q = query(collection(db, 'nasasho'), orderBy('title'));
          const snap = await getDocs(q);
          setNasasho(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NasashoContent)));
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, 'nasasho');
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
    setLoading(false);
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || loading) return;
    setLoading(true);
    try {
      const { id, ...formData } = resourceForm as any;
      if (editingItem) {
        await updateDoc(doc(db, 'resources', editingItem.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'resources'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      setShowAddModal(false);
      setEditingItem(null);
      setResourceForm({ title: '', type: 'Article', category: 'Wellness', image: '', duration: '', content: '', author: '', language: 'en', published: true });
      fetchData();
    } catch (err) {
      console.error('Error saving resource:', err);
    }
    setLoading(false);
  };

  const handleAddTherapist = async () => {
    if (!therapistForm.name || loading) return;
    setLoading(true);
    try {
      const { id, ...formData } = therapistForm as any;
      if (editingItem) {
        await updateDoc(doc(db, 'therapists', editingItem.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'therapists'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      setShowAddModal(false);
      setEditingItem(null);
      setTherapistForm({ name: '', specialty: '', bio: '', image: '', rate: '', rating: 5.0, availableSlots: ['9:00 AM', '2:00 PM', '5:00 PM'], published: true });
      fetchData();
    } catch (err) {
      console.error('Error saving therapist:', err);
    }
    setLoading(false);
  };

  const handleAddNasasho = async () => {
    if (!nasashoForm.title || loading) return;
    setLoading(true);
    try {
      const { id, ...formData } = nasashoForm as any;
      if (editingItem) {
        await updateDoc(doc(db, 'nasasho', editingItem.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'nasasho'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      setShowAddModal(false);
      setEditingItem(null);
      setNasashoForm({ title: '', category: 'Podcast', audioUrl: '', embedUrl: '', duration: '', image: '', description: '', reciter: '', published: true });
      fetchData();
    } catch (err) {
      console.error('Error saving nasasho:', err);
    }
    setLoading(false);
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ coll: string, id: string } | null>(null);

  const handleDelete = async (coll: string, id: string) => {
    setLoading(true);
    try {
      console.log(`Attempting to delete ${id} from ${coll}`);
      await deleteDoc(doc(db, coll, id));
      console.log(`Successfully deleted ${id}`);
      fetchData();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      handleFirestoreError(err, OperationType.DELETE, `${coll}/${id}`);
    }
    setLoading(false);
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const sampleNasasho: Partial<NasashoContent>[] = [
        {
          title: 'Frog and Toad All Year',
          category: 'Podcast',
          embedUrl: 'https://archive.org/embed/107frogandtoadallyear_202004',
          duration: '15:00',
          image: 'https://picsum.photos/seed/frog/800/600',
          description: 'A classic collection of stories about friendship and the seasons.',
          reciter: 'Archive.org',
          published: true
        },
        {
          title: 'Selected Short Stories',
          category: 'Podcast',
          embedUrl: 'https://archive.org/details/LevNikolayevichTolstoy-SelectedShortStories',
          duration: '45:00',
          image: 'https://picsum.photos/seed/tolstoy/800/600',
          description: 'Classic short stories by Leo Tolstoy, exploring human nature and morality.',
          reciter: 'Leo Tolstoy',
          published: true
        }
      ];

      for (const item of sampleNasasho) {
        await addDoc(collection(db, 'nasasho'), {
          ...item,
          createdAt: serverTimestamp()
        });
      }
      fetchData();
      alert('Sample podcast added to Nasasho!');
    } catch (err) {
      console.error('Error seeding data:', err);
    }
    setLoading(false);
  };

  const renderInsights = () => {
    const activityData = [
      { name: 'Mon', value: 400 },
      { name: 'Tue', value: 300 },
      { name: 'Wed', value: 600 },
      { name: 'Thu', value: 800 },
      { name: 'Fri', value: 500 },
      { name: 'Sat', value: 900 },
      { name: 'Sun', value: 1100 },
    ];

    const stats = [
      { label: 'Community Members', value: userCount, icon: Users, color: 'text-brand', bg: 'bg-brand/10', trend: '+12%' },
      { label: 'Library Resources', value: resourcesCount, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: 'Active' },
      { label: 'Pro Therapists', value: therapistsCount, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10', trend: 'Verified' },
      { label: 'Nasasho Audio', value: nasashoCount, icon: Music, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'Growing' }
    ];

    const allRecent = [
      ...recentResources.map(r => ({ label: `Resource: ${r.title}`, icon: BookOpen, color: 'text-brand', time: 'New Content' })),
      ...recentTherapists.map(t => ({ label: `Specialist: ${t.name}`, icon: Heart, color: 'text-rose-500', time: 'Profile Added' })),
      ...recentNasasho.map(n => ({ label: `Audio: ${n.title}`, icon: Music, color: 'text-emerald-500', time: 'New Upload' }))
    ].slice(0, 4);

    return (
      <div className="space-y-8 pb-12">
        {/* Platform Overview Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 bg-brand rounded-full" />
            <h3 className="text-sm font-black text-text uppercase tracking-widest">Platform Core Overview</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-2xl border border-border shadow-sm group hover:border-brand/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", stat.bg)}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg", stat.color, stat.bg)}>
                    {stat.trend}
                  </span>
                </div>
                <div className="text-3xl font-black text-text mb-1">{stat.value.toLocaleString()}</div>
                <div className="text-[9px] font-black text-text/40 uppercase tracking-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <section className="bg-white p-8 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text uppercase tracking-widest">Growth Analytics</h3>
                  <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Weekly Community Engagement</p>
                </div>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--color-brand)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Usage Stats List */}
          <section className="bg-white p-8 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-text uppercase tracking-widest">Usage Metrics</h3>
                <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Real-time Performance</p>
              </div>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Community Engagement', value: 88, color: 'bg-brand' },
                { label: 'Library Retention', value: 65, color: 'bg-emerald-500' },
                { label: 'Session Conversion', value: 42, color: 'bg-amber-500' },
                { label: 'Active Recordings', value: 94, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                    <span className="text-text/60">{item.label}</span>
                    <span className="text-text">{item.value}%</span>
                  </div>
                  <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      className={cn("h-full rounded-full", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity Feed */}
          <section className="lg:col-span-2 bg-white p-8 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-text uppercase tracking-widest">Global Live Activity</h3>
                <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Recent Database Events</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allRecent.length > 0 ? allRecent.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border/50 group hover:border-brand transition-all">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm shrink-0", item.color)}>
                      <item.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-text truncate">{item.label}</p>
                      <p className="text-[8px] font-black text-text/30 uppercase tracking-widest">{item.time}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 py-10 text-center border-2 border-dashed border-border rounded-2xl">
                  <p className="text-[10px] font-black text-text/20 uppercase tracking-widest">No activity tracked in last 24h</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Platform Health Section */}
        <section className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-brand">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Infrastructure Status</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Health & Verification</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 w-fit">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Operational Secure</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {[
                { label: 'Network Latency', value: '42ms', progress: 15, color: 'bg-emerald-500' },
                { label: 'Memory Load', value: '18%', progress: 18, color: 'bg-brand' },
                { label: 'Data Processing', value: '2.4 GB', progress: 24, color: 'bg-amber-500' },
              ].map((m) => (
                <div key={m.label} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">{m.label}</p>
                      <p className="text-xl font-black">{m.value}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.progress}%` }}
                      className={cn("h-full rounded-full", m.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderLibrary = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-black text-text">Library Content</h3>
        <button 
          onClick={() => { setCreateType('library'); setShowAddModal(true); }}
          className="bg-brand text-brand-dark px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20"
        >
          <Plus size={14} /> Add Content
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res) => (
          <div key={res.id} className="bg-card p-4 rounded-3xl border border-border flex items-center gap-4 group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-bg shrink-0">
              {res.image ? (
                <img src={res.image} alt={res.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand/5 text-brand">
                  <BookOpen size={24} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-text truncate">{res.title}</h4>
              <p className="text-[10px] font-black text-brand uppercase tracking-widest">{res.type} • {res.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setEditingItem({ type: 'library', id: res.id });
                  setResourceForm(res);
                  setCreateType('library');
                  setShowAddModal(true);
                }}
                className="p-2 text-text/20 hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => setDeleteConfirm({ coll: 'resources', id: res.id })}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTherapy = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-black text-text">Therapists</h3>
        <button 
          onClick={() => { setCreateType('therapy'); setShowAddModal(true); }}
          className="bg-brand text-brand-dark px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20"
        >
          <Plus size={14} /> Add Therapist
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {therapists.map((t) => (
          <div key={t.id} className="bg-card p-4 rounded-3xl border border-border flex items-center gap-4 group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-bg shrink-0">
              {t.image ? (
                <img src={t.image} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand/5 text-brand">
                  <Users size={24} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-text truncate">{t.name}</h4>
              <p className="text-[10px] font-black text-brand uppercase tracking-widest">{t.specialty}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setEditingItem({ type: 'therapy', id: t.id });
                  setTherapistForm(t);
                  setCreateType('therapy');
                  setShowAddModal(true);
                }}
                className="p-2 text-text/20 hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => setDeleteConfirm({ coll: 'therapists', id: t.id })}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNasasho = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-black text-text">Nasasho Audio</h3>
        <div className="flex gap-2">
          <button 
            onClick={handleSeedData}
            className="bg-bg border border-border text-text/60 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-card transition-all"
          >
            <Plus size={14} /> Seed Sample
          </button>
          <button 
            onClick={() => { setCreateType('nasasho'); setShowAddModal(true); }}
            className="bg-brand text-brand-dark px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20"
          >
            <Plus size={14} /> Add Audio
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nasasho.map((n) => (
          <div key={n.id} className="bg-card p-4 rounded-3xl border border-border flex items-center gap-4 group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-bg shrink-0">
              {n.image ? (
                <img src={n.image} alt={n.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand/5 text-brand">
                  <Music size={24} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-text truncate">{n.title}</h4>
              <p className="text-[10px] font-black text-brand uppercase tracking-widest">{n.category} • {n.reciter || 'Ambient'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setEditingItem({ type: 'nasasho', id: n.id });
                  setNasashoForm(n);
                  setCreateType('nasasho');
                  setShowAddModal(true);
                }}
                className="p-2 text-text/20 hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => setDeleteConfirm({ coll: 'nasasho', id: n.id })}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const [createType, setCreateType] = useState<'library' | 'therapy' | 'nasasho' | null>(null);

  return (
    <div className="min-h-screen bg-bg flex flex-col lg:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-72 bg-card border-r border-border flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="text-brand" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black text-text tracking-tight">Admin</h1>
              <p className="text-[10px] font-black text-brand uppercase tracking-widest">Console v2.0</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'insights', label: 'Insights', icon: BarChart3 },
              { id: 'library', label: 'Library', icon: BookOpen },
              { id: 'therapy', label: 'Therapy', icon: Heart },
              { id: 'chat', label: 'Support Chat', icon: MessageSquare },
              { id: 'nasasho', label: 'Nasasho', icon: Music },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === tab.id 
                    ? "bg-brand text-brand-dark shadow-lg shadow-brand/20" 
                    : "text-text/40 hover:bg-bg hover:text-text"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-border">
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all"
          >
            <ArrowLeft size={18} />
            Exit Console
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-40 px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-bg rounded-xl transition-colors">
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-black text-text tracking-tight">Admin</h1>
            </div>
            <div className="w-10 h-10 bg-brand/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="text-brand" size={20} />
            </div>
          </div>

          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'insights', label: 'Insights', icon: BarChart3 },
              { id: 'library', label: 'Library', icon: BookOpen },
              { id: 'therapy', label: 'Therapy', icon: Heart },
              { id: 'chat', label: 'Support Chat', icon: MessageSquare },
              { id: 'nasasho', label: 'Nasasho', icon: Music },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-brand text-brand-dark shadow-lg shadow-brand/20" 
                    : "bg-white border border-border text-text/40 hover:border-brand/30"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="p-6 lg:p-12 max-w-7xl mx-auto w-full pb-32 lg:pb-12">
          {loading && !showAddModal ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-text/40 uppercase tracking-widest">Syncing Data...</p>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {activeTab === 'insights' && renderInsights()}
              {activeTab === 'library' && renderLibrary()}
              {activeTab === 'therapy' && renderTherapy()}
              {activeTab === 'chat' && <AdminChatManager />}
              {activeTab === 'nasasho' && renderNasasho()}
            </motion.div>
          )}
        </main>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-card rounded-t-[3rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-text tracking-tight">
                    {editingItem ? 'Edit' : 'Add'} {createType === 'library' ? 'Content' : createType === 'therapy' ? 'Therapist' : 'Audio'}
                  </h2>
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest">{editingItem ? 'Update Existing' : 'New Entry Creation'}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }} 
                  className="p-2 hover:bg-bg rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {createType === 'library' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Title</label>
                      <input 
                        type="text" 
                        value={resourceForm.title}
                        onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                        className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                        placeholder="Article or Podcast Title"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Type</label>
                        <select 
                          value={resourceForm.type}
                          onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value as any })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                        >
                          <option value="Article">Article</option>
                          <option value="Course">Course</option>
                          <option value="Book Summary">Book Summary</option>
                          <option value="Podcast">Podcast</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Language</label>
                        <select 
                          value={resourceForm.language}
                          onChange={(e) => setResourceForm({ ...resourceForm, language: e.target.value as any })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                        >
                          <option value="en">English</option>
                          <option value="so">Somali</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Cover Image URL</label>
                      <input 
                        type="text" 
                        value={resourceForm.image}
                        onChange={(e) => setResourceForm({ ...resourceForm, image: e.target.value })}
                        className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                        placeholder="https://..."
                      />
                    </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Category</label>
                        <select 
                          value={resourceForm.category}
                          onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value as any })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                        >
                          <option value="Wellness">Wellness</option>
                          <option value="Growth">Growth</option>
                          <option value="Productivity">Productivity</option>
                          <option value="Habits">Habits</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Content / Description</label>
                        <textarea 
                          value={resourceForm.content}
                          onChange={(e) => setResourceForm({ ...resourceForm, content: e.target.value })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors min-h-[120px]"
                          placeholder="Content body..."
                        />
                      </div>
                    <div className="flex items-center gap-3 px-4">
                      <input 
                        type="checkbox" 
                        id="pub-res"
                        checked={resourceForm.published}
                        onChange={(e) => setResourceForm({ ...resourceForm, published: e.target.checked })}
                        className="w-5 h-5 rounded border-border text-brand focus:ring-brand"
                      />
                      <label htmlFor="pub-res" className="text-sm font-bold text-text">Publish immediately</label>
                    </div>
                    <button 
                      onClick={handleAddResource}
                      className="w-full bg-brand text-brand-dark py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-brand/20 flex items-center justify-center gap-3"
                    >
                      <Save size={20} /> {editingItem ? 'Update' : 'Save'} Content
                    </button>
                  </>
                )}

                {createType === 'therapy' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                      <div className="w-40 h-40 sm:w-32 sm:h-32 rounded-[2.5rem] bg-bg border-4 border-card shadow-inner flex items-center justify-center overflow-hidden shrink-0 group relative">
                        {therapistForm.image ? (
                          <img src={therapistForm.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={40} className="text-text/10" />
                        )}
                        <input 
                          type="file" 
                          id="therapist-image-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setTherapistForm({ ...therapistForm, image: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button 
                          onClick={() => document.getElementById('therapist-image-upload')?.click()}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                          <ImageIcon size={24} className="text-white" />
                        </button>
                      </div>
                      <div className="flex-1 w-full space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Profile Image URL (External)</label>
                          <input 
                            type="text" 
                            value={therapistForm.image && !therapistForm.image.startsWith('data:') ? therapistForm.image : ''}
                            onChange={(e) => setTherapistForm({ ...therapistForm, image: e.target.value })}
                            className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors text-sm"
                            placeholder="Paste external link or use upload button..."
                          />
                        </div>
                        <button 
                          onClick={() => document.getElementById('therapist-image-upload')?.click()}
                          className="w-full sm:w-auto px-6 py-3 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-bg transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={14} /> Upload from device
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Full Name</label>
                      <input 
                        type="text" 
                        value={therapistForm.name}
                        onChange={(e) => setTherapistForm({ ...therapistForm, name: e.target.value })}
                        className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors text-sm"
                        placeholder="Dr. Ahmed Ali"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Specialist Type</label>
                        <input 
                          type="text" 
                          value={therapistForm.specialty}
                          onChange={(e) => setTherapistForm({ ...therapistForm, specialty: e.target.value })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors text-sm"
                          placeholder="e.g. Trauma & Youth"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Session Rate</label>
                        <input 
                          type="text" 
                          value={therapistForm.rate}
                          onChange={(e) => setTherapistForm({ ...therapistForm, rate: e.target.value })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors text-sm"
                          placeholder="$20/session"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Professional Bio</label>
                      <textarea 
                        value={therapistForm.bio}
                        onChange={(e) => setTherapistForm({ ...therapistForm, bio: e.target.value })}
                        className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors text-sm min-h-[120px] resize-none"
                        placeholder="Detailed professional background and approach..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Initial Rating</label>
                        <input 
                          type="number" 
                          step="0.1"
                          max="5"
                          value={therapistForm.rating}
                          onChange={(e) => setTherapistForm({ ...therapistForm, rating: parseFloat(e.target.value) })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Status</label>
                        <div className="flex items-center gap-3 bg-bg border border-border rounded-2xl px-6 py-4 h-full">
                          <input 
                            type="checkbox" 
                            id="pub-ther"
                            checked={therapistForm.published}
                            onChange={(e) => setTherapistForm({ ...therapistForm, published: e.target.checked })}
                            className="w-5 h-5 accent-brand"
                          />
                          <label htmlFor="pub-ther" className="text-[10px] font-black uppercase tracking-widest text-text/60">Publish Profile</label>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleAddTherapist}
                      className="w-full bg-brand text-brand-dark py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Save size={20} /> {editingItem ? 'Update' : 'Verify & Save'} Profile
                    </button>
                  </div>
                )}

                {createType === 'nasasho' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Audio Title</label>
                      <input 
                        type="text" 
                        value={nasashoForm.title}
                        onChange={(e) => setNasashoForm({ ...nasashoForm, title: e.target.value })}
                        className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                        placeholder="Surah, Nature Sound, etc."
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Category</label>
                        <select 
                          value={nasashoForm.category}
                          onChange={(e) => setNasashoForm({ ...nasashoForm, category: e.target.value as any })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                        >
                          <option value="Podcast">Podcast</option>
                          <option value="Quran">Quran</option>
                          <option value="Nature">Nature</option>
                          <option value="Sleep">Sleep</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Duration</label>
                        <input 
                          type="text" 
                          value={nasashoForm.duration}
                          onChange={(e) => setNasashoForm({ ...nasashoForm, duration: e.target.value })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                          placeholder="15:00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Audio URL (Direct MP3)</label>
                        <input 
                          type="text" 
                          value={nasashoForm.audioUrl}
                          onChange={(e) => setNasashoForm({ ...nasashoForm, audioUrl: e.target.value })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                          placeholder="https://example.com/audio.mp3"
                        />
                        <p className="text-[8px] text-text/30 px-4">Use direct links to .mp3 or .wav files for the native player.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Embed URL (Drive/YouTube)</label>
                        <input 
                          type="text" 
                          value={nasashoForm.embedUrl}
                          onChange={(e) => setNasashoForm({ ...nasashoForm, embedUrl: e.target.value })}
                          className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                          placeholder="https://drive.google.com/..."
                        />
                        <p className="text-[8px] text-text/30 px-4">Use for Google Drive preview links or YouTube video links.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Cover Image URL</label>
                      <input 
                        type="text" 
                        value={nasashoForm.image}
                        onChange={(e) => setNasashoForm({ ...nasashoForm, image: e.target.value })}
                        className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Reciter / Artist</label>
                      <input 
                        type="text" 
                        value={nasashoForm.reciter}
                        onChange={(e) => setNasashoForm({ ...nasashoForm, reciter: e.target.value })}
                        className="w-full bg-bg border border-border rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-brand transition-colors"
                        placeholder="Name of reciter"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-4">
                      <input 
                        type="checkbox" 
                        id="pub-nas"
                        checked={nasashoForm.published}
                        onChange={(e) => setNasashoForm({ ...nasashoForm, published: e.target.checked })}
                        className="w-5 h-5 rounded border-border text-brand focus:ring-brand"
                      />
                      <label htmlFor="pub-nas" className="text-sm font-bold text-text">Publish immediately</label>
                    </div>
                    <button 
                      onClick={handleAddNasasho}
                      className="w-full bg-brand text-brand-dark py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-brand/20 flex items-center justify-center gap-3"
                    >
                      <Save size={20} /> {editingItem ? 'Update' : 'Save'} Audio
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-[2.5rem] p-8 max-w-sm w-full relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-text mb-2">Are you sure?</h3>
              <p className="text-sm text-text/40 font-medium mb-8">This action cannot be undone. This item will be permanently removed.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-bg text-text/40 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm.coll, deleteConfirm.id)}
                  className="flex-1 py-4 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
