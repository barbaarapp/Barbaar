/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Shield, 
  HelpCircle, 
  Mail, 
  User as UserIcon, 
  Clock, 
  CheckCircle,
  Trash2,
  Users,
  Plus,
  MessageCircle,
  Search,
  CheckCheck,
  Sparkles,
  RefreshCw,
  Info,
  Calendar,
  CreditCard,
  HeartHandshake,
  MessageSquareText
} from "lucide-react";
import { ClientProfile, SupportMessage } from "../../types";
import { colors } from "../../constants";
import { translateText as t, Language } from "../../utils/translations";
import { uid } from "../../utils";
import { db, collection, doc, setDoc, query, where, onSnapshot } from "../../lib/firebase";
import { deleteDoc } from "firebase/firestore";
import Button from "../ui/Button";
import Card from "../ui/Card";
import TextField from "../ui/TextField";

interface SupportSectionProps {
  clientProfile: ClientProfile;
  setClientProfile: (profile: ClientProfile) => void;
  onBack: () => void;
  lang: Language;
  userRole?: "client" | "therapist" | "admin" | null;
}

interface Conversation {
  clientEmail: string;
  clientName: string;
  latestMessage: SupportMessage;
  messages: SupportMessage[];
}

interface TeamMember {
  email: string;
  addedBy: string;
  addedAt: string;
}

const categories = [
  {
    id: "booking",
    title_en: "Booking & Scheduling",
    title_so: "Ballamaha & Jadwalka",
    desc_en: "Help with booking, rescheduling, or managing therapist appointments",
    desc_so: "Dalbo, baddal ama maamul ballamaha dhakhtarka",
    icon: "📅",
    color: "#EFF6FF",
    textColor: "#1D4ED8",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    id: "payment",
    title_en: "Payment & Refunds",
    title_so: "Lacag-bixinta & Celinta",
    desc_en: "Questions about fees, invoices, card payments, or refund status",
    desc_so: "Su'aalaha khidmadaha, kaadhadhka ama lacag-celinta",
    icon: "💳",
    color: "#FEF2F2",
    textColor: "#B91C1C",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    id: "aid",
    title_en: "Financial Aid Assistance",
    title_so: "Gargaarka Dhaqaalaha",
    desc_en: "Inquire about community subsidies, discounts, and aid programs",
    desc_so: "Codsashada taageerada dhaqaalaha ama qiimo-dhimista",
    icon: "🤝",
    color: "#FFFBEB",
    textColor: "#B45309",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    id: "general",
    title_en: "General Inquiries",
    title_so: "Su'aalaha Guud",
    desc_en: "General questions about Barbaar services, therapists, and care",
    desc_so: "Macluumaad guud oo ku saabsan adeegyada iyo daryeelka Barbaar",
    icon: "💬",
    color: "#F0FDF4",
    textColor: "#15803D",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-100",
  }
];

// Quick response templates for staff
const QUICK_RESPONSES = [
  { label: "Greeting (EN)", text: "Hello! Welcome to Barbaar Support. How can we assist you today?" },
  { label: "Salaan (SO)", text: "Salaamu calaykum! Ku soo dhowow xarunta caawinaada Barbaar. Sideen kuu caawin karnaa maanta?" },
  { label: "Booking Help", text: "I can help you reschedule or confirm your specialist appointment. Which date works best for you?" },
  { label: "Payment Info", text: "Thank you for reaching out regarding your transaction. Let me verify the details for you right now." },
  { label: "Aid Application", text: "Our financial aid program provides subsidized care for community members. We will review your request promptly." },
];

// Helper to generate consistent avatar background colors
function getAvatarColor(name: string): { bg: string; text: string; border: string } {
  const palettes = [
    { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
    { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
    { bg: "bg-stone-100", text: "text-stone-800", border: "border-stone-200" },
    { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
    { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
    { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
}

export default function SupportSection({
  clientProfile,
  setClientProfile,
  onBack,
  lang,
  userRole = null,
}: SupportSectionProps) {
  const currentUserEmail = (clientProfile.email || "").trim().toLowerCase();

  // --- SUPPORT TEAM SYNC ---
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [adminTab, setAdminTab] = useState<"chats" | "team">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const q = collection(db, "support_team");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: TeamMember[] = [];
        const emails: string[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            email: docSnap.id,
            addedBy: data.addedBy || "",
            addedAt: data.addedAt || "",
          });
          emails.push(docSnap.id.toLowerCase());
        });
        setTeamMembers(list);
        setTeamEmails(emails);
      },
      (error) => {
        console.error("Error syncing support team emails:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Determine if current user is admin/team member
  const isOwner = currentUserEmail === "barbaaryp@gmail.com";
  const isTeam = teamEmails.includes(currentUserEmail);
  const isAdminView = isOwner || isTeam || userRole === "admin";

  // --- CLIENT VIEW STATES ---
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameInput, setNameInput] = useState(clientProfile.name || "");
  const [emailInput, setEmailInput] = useState(clientProfile.email || "");
  const [formError, setFormError] = useState<string | null>(null);

  // --- ADMIN VIEW STATES ---
  const [allMessages, setAllMessages] = useState<SupportMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [adminDraft, setAdminDraft] = useState("");
  const [adminSending, setAdminSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // --- TEAM MEMBER ADMINISTRATION STATES ---
  const [newTeamEmail, setNewTeamEmail] = useState("");
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeEmail = clientProfile.email?.trim().toLowerCase();

  // 1. Client Mode: Sync messages for the current user
  useEffect(() => {
    if (isAdminView || !activeEmail) return;

    const q = query(
      collection(db, "support_messages"),
      where("clientEmail", "==", activeEmail)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SupportMessage[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SupportMessage);
        });
        list.sort((a, b) => a.time.localeCompare(b.time));
        setMessages(list);
      },
      (error) => {
        console.error("Error syncing client support messages:", error);
      }
    );

    return () => unsubscribe();
  }, [activeEmail, isAdminView]);

  // Load category from client message history if available
  useEffect(() => {
    if (messages.length > 0 && !selectedCategory) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].category) {
          setSelectedCategory(messages[i].category);
          break;
        }
      }
    }
  }, [messages, selectedCategory]);

  // 2. Admin Mode: Sync ALL messages
  useEffect(() => {
    if (!isAdminView) return;

    const q = collection(db, "support_messages");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SupportMessage[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SupportMessage);
        });
        list.sort((a, b) => a.time.localeCompare(b.time));
        setAllMessages(list);
      },
      (error) => {
        console.error("Error syncing all support messages for admin:", error);
      }
    );

    return () => unsubscribe();
  }, [isAdminView]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, allMessages, selectedEmail, selectedCategory]);

  // --- CLIENT ACTION HANDLERS ---
  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setFormError(t("Please enter your name.", lang));
      return;
    }
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setFormError(t("Please enter a valid email address.", lang));
      return;
    }

    setFormError(null);
    setClientProfile({
      ...clientProfile,
      name: nameInput.trim(),
      email: emailInput.trim().toLowerCase(),
    });
  };

  const handleSend = async () => {
    if (!draft.trim() || !activeEmail) return;

    const textToSend = draft;
    setDraft("");
    setLoading(true);

    try {
      const msgId = uid("sm");
      const newMsg: SupportMessage = {
        id: msgId,
        clientEmail: activeEmail,
        clientName: clientProfile.name || "Guest Client",
        from: "client",
        text: textToSend,
        time: new Date().toISOString(),
        category: selectedCategory || "general",
      };

      await setDoc(doc(db, "support_messages", msgId), newMsg);
    } catch (err) {
      console.error("Failed to send support message:", err);
      setDraft(textToSend);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- ADMIN ACTION HANDLERS ---
  const handleAdminSend = async () => {
    if (!adminDraft.trim() || !selectedEmail || !activeConversation) return;

    const replyText = adminDraft;
    setAdminDraft("");
    setAdminSending(true);

    try {
      const replyId = uid("sm");
      const replyMsg: SupportMessage = {
        id: replyId,
        clientEmail: activeConversation.clientEmail,
        clientName: activeConversation.clientName,
        from: "admin",
        text: replyText,
        time: new Date().toISOString(),
        category: activeConversation.messages.find(m => m.category)?.category || "general",
      };

      await setDoc(doc(db, "support_messages", replyId), replyMsg);
    } catch (err) {
      console.error("Failed to send admin support reply:", err);
      setAdminDraft(replyText);
    } finally {
      setAdminSending(false);
    }
  };

  const handleAdminKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdminSend();
    }
  };

  // --- TEAM MEMBER ADMINISTRATION ACTION HANDLERS ---
  const handleAddTeamMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError(null);
    setTeamSuccess(null);

    const cleanEmail = newTeamEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    if (!cleanEmail.includes("@")) {
      setTeamError(t("Please enter a valid email address.", lang));
      return;
    }

    if (cleanEmail === "barbaaryp@gmail.com") {
      setTeamError(t("This email is already the owner account.", lang));
      return;
    }

    if (teamEmails.includes(cleanEmail)) {
      setTeamError(t("This email is already on the team list.", lang));
      return;
    }

    try {
      setTeamLoading(true);
      await setDoc(doc(db, "support_team", cleanEmail), {
        email: cleanEmail,
        addedBy: currentUserEmail || "Owner",
        addedAt: new Date().toISOString(),
      });
      setNewTeamEmail("");
      setTeamSuccess(t("Team member successfully added!", lang));
    } catch (err) {
      console.error("Error adding team member:", err);
      setTeamError(t("Failed to add team member. Access denied.", lang));
    } finally {
      setTeamLoading(false);
    }
  };

  const handleRemoveTeamMember = async (emailToRemove: string) => {
    if (!confirm(t("Are you sure you want to remove this team member?", lang))) return;
    try {
      await deleteDoc(doc(db, "support_team", emailToRemove.toLowerCase()));
      setTeamSuccess(t("Team member successfully removed.", lang));
    } catch (err) {
      console.error("Error removing team member:", err);
      setTeamError(t("Failed to remove team member.", lang));
    }
  };

  // Group messages into conversations for admin view
  const conversationsMap: Record<string, Conversation> = useMemo(() => {
    const map: Record<string, Conversation> = {};
    allMessages.forEach((msg) => {
      const email = msg.clientEmail.trim().toLowerCase();
      if (!map[email]) {
        map[email] = {
          clientEmail: msg.clientEmail,
          clientName: msg.clientName || "Guest Client",
          latestMessage: msg,
          messages: [],
        };
      }
      map[email].messages.push(msg);
      map[email].latestMessage = msg;
    });
    return map;
  }, [allMessages]);

  // Filtered & Sorted Conversation List
  const conversationsList = useMemo(() => {
    let list = Object.values(conversationsMap).sort(
      (a, b) => b.latestMessage.time.localeCompare(a.latestMessage.time)
    );

    // Apply Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        c => c.clientName.toLowerCase().includes(q) ||
             c.clientEmail.toLowerCase().includes(q) ||
             c.messages.some(m => m.text.toLowerCase().includes(q))
      );
    }

    // Apply Category Filter
    if (categoryFilter !== "all") {
      list = list.filter(c => {
        const cat = c.messages.find(m => m.category)?.category;
        return cat === categoryFilter;
      });
    }

    // Apply Status Filter (unread = latest message is from client)
    if (statusFilter === "unread") {
      list = list.filter(c => c.latestMessage.from === "client");
    }

    return list;
  }, [conversationsMap, searchQuery, categoryFilter, statusFilter]);

  const activeConversation = selectedEmail ? conversationsMap[selectedEmail.toLowerCase()] : null;

  // Unread / Awaiting response count
  const unreadCount = useMemo(() => {
    return Object.values(conversationsMap).filter(c => c.latestMessage.from === "client").length;
  }, [conversationsMap]);

  // --- RENDER ADMIN / SUPPORT TEAM INTERFACE ---
  if (isAdminView) {
    return (
      <div className="flex flex-col md:flex-row h-[84vh] md:h-[700px] pop-in bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden text-stone-900 font-sans">
        
        {/* ================= LEFT SIDEBAR (Inbox & Staff List) ================= */}
        <div className={`w-full md:w-[380px] lg:w-[410px] border-r border-stone-200/80 flex flex-col bg-[#FAF9F7] ${selectedEmail ? "hidden md:flex" : "flex h-full"}`}>
          
          {/* Header Bar */}
          <div className="p-4 border-b border-stone-200/80 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer border border-stone-200/60"
                  aria-label="Go back"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 tracking-tight">Support Desk</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#384c43]/10 text-[#384c43]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#384c43] animate-pulse" />
                      {isOwner ? "Owner" : "Staff Specialist"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium">Barbaar Wellness Care Center</p>
                </div>
              </div>
            </div>

            {/* Segmented Navigation: Inbox vs Team */}
            <div className="grid grid-cols-2 p-1 bg-stone-100/90 rounded-xl gap-1 text-xs">
              <button
                type="button"
                onClick={() => setAdminTab("chats")}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  adminTab === "chats"
                    ? "bg-white text-stone-900 shadow-xs border border-stone-200/40"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <MessageCircle size={14} />
                <span>Inbox</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  unreadCount > 0 ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-600"
                }`}>
                  {conversationsList.length}
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => setAdminTab("team")}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  adminTab === "team"
                    ? "bg-white text-stone-900 shadow-xs border border-stone-200/40"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Users size={14} />
                <span>Staff Team</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-stone-200 text-stone-600">
                  {teamMembers.length + 1}
                </span>
              </button>
            </div>

            {/* Search and Category Filters (Only in chats tab) */}
            {adminTab === "chats" && (
              <div className="mt-3 space-y-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by client name, email..."
                    className="w-full bg-stone-50 border border-stone-200 focus:border-[#384c43] focus:bg-white rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 hover:text-stone-600 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  <button
                    type="button"
                    onClick={() => { setCategoryFilter("all"); setStatusFilter("all"); }}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      categoryFilter === "all" && statusFilter === "all"
                        ? "bg-[#384c43] text-white"
                        : "bg-white text-stone-600 border border-stone-200/70 hover:bg-stone-50"
                    }`}
                  >
                    All
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter(prev => prev === "unread" ? "all" : "unread")}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                      statusFilter === "unread"
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-stone-600 border border-stone-200/70 hover:bg-stone-50"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Unanswered ({unreadCount})
                  </button>

                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryFilter(prev => prev === c.id ? "all" : c.id)}
                      className={`px-2 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                        categoryFilter === c.id
                          ? "bg-stone-800 text-white"
                          : "bg-white text-stone-600 border border-stone-200/70 hover:bg-stone-50"
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span>{c.title_en.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ================= CONVERSATIONS LIST ================= */}
          {adminTab === "chats" && (
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
              {conversationsList.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
                    <MessageSquare size={20} />
                  </div>
                  <p className="text-xs font-bold text-stone-700">No conversations found</p>
                  <p className="text-[11px] text-stone-400 mt-1 max-w-[200px] leading-relaxed">
                    {searchQuery || categoryFilter !== "all"
                      ? "Try adjusting your search or category filters."
                      : "New incoming support requests from clients will appear here."}
                  </p>
                </div>
              ) : (
                conversationsList.map((convo) => {
                  const isActive = selectedEmail?.toLowerCase() === convo.clientEmail.toLowerCase();
                  const isAwaitingReply = convo.latestMessage.from === "client";
                  const avatarColor = getAvatarColor(convo.clientName || convo.clientEmail);
                  
                  // Extract conversation category
                  const convoCategory = convo.messages.find(m => m.category)?.category;
                  const catDetails = categories.find(c => c.id === convoCategory);

                  // Extract initial
                  const initial = (convo.clientName || convo.clientEmail || "U").charAt(0).toUpperCase();

                  return (
                    <button
                      key={convo.clientEmail}
                      type="button"
                      onClick={() => setSelectedEmail(convo.clientEmail)}
                      className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer relative group ${
                        isActive
                          ? "bg-white shadow-xs border-l-4 border-[#384c43]"
                          : isAwaitingReply
                          ? "bg-emerald-50/25 hover:bg-emerald-50/50"
                          : "hover:bg-stone-50/80 bg-[#FAF9F7]"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 border ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border} shadow-2xs`}>
                        {initial}
                      </div>

                      {/* Conversation Details */}
                      <div className="flex-1 min-w-0">
                        {/* Row 1: Name, Category Chip, Time */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs truncate font-bold ${
                            isAwaitingReply ? "text-stone-900 font-extrabold" : "text-stone-800"
                          }`}>
                            {convo.clientName || "Client"}
                          </span>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {catDetails && (
                              <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${catDetails.badgeBg}`}>
                                <span>{catDetails.icon}</span>
                                <span className="hidden sm:inline">{catDetails.title_en.split(" ")[0]}</span>
                              </span>
                            )}
                            <span className="text-[10px] text-stone-400 font-medium">
                              {new Date(convo.latestMessage.time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Clean Email */}
                        <div className="text-[11px] text-stone-400 truncate mt-0.5 font-normal">
                          {convo.clientEmail}
                        </div>

                        {/* Row 3: Latest Message Snippet & Unread Dot */}
                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          <p className={`text-xs truncate leading-snug ${
                            isAwaitingReply
                              ? "font-semibold text-stone-900"
                              : "text-stone-500 font-normal"
                          }`}>
                            <span className={`text-[10px] uppercase tracking-wider font-bold mr-1 ${
                              isAwaitingReply ? "text-emerald-700" : "text-stone-400"
                            }`}>
                              {isAwaitingReply ? "Client:" : "Staff:"}
                            </span>
                            {convo.latestMessage.text}
                          </p>

                          {isAwaitingReply && (
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full flex-shrink-0 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* ================= STAFF TEAM TAB ================= */}
          {adminTab === "team" && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Add member form (Owner only) */}
              {isOwner ? (
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-[#384c43]" />
                    <h4 className="text-xs font-bold text-stone-900">Authorize Staff Member</h4>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-3 leading-relaxed">
                    Authorized staff members gain access to view client support threads and answer questions in real-time.
                  </p>
                  <form onSubmit={handleAddTeamMemberSubmit} className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={newTeamEmail}
                      onChange={(e) => setNewTeamEmail(e.target.value)}
                      placeholder="specialist@barbaar.org"
                      className="flex-1 bg-stone-50 border border-stone-200 focus:bg-white focus:border-[#384c43] rounded-lg px-3 py-2 text-xs outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={teamLoading || !newTeamEmail.trim()}
                      className="bg-[#384c43] hover:opacity-90 disabled:opacity-50 text-white rounded-lg px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 flex-shrink-0 shadow-xs"
                    >
                      <Plus size={13} />
                      <span>{teamLoading ? "Adding..." : "Add"}</span>
                    </button>
                  </form>
                  {teamError && <p className="text-[11px] text-rose-600 font-medium mt-2">{teamError}</p>}
                  {teamSuccess && <p className="text-[11px] text-emerald-700 font-semibold mt-2">{teamSuccess}</p>}
                </div>
              ) : (
                <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2.5">
                  <Info size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Staff Access Active</strong>. Only the primary administrator account (<code>barbaaryp@gmail.com</code>) can register or remove team members.
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="flex-1">
                <h4 className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider mb-2.5">
                  Active Support Specialists ({teamMembers.length + 1})
                </h4>
                
                <div className="space-y-2">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        👑
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-stone-900 truncate">barbaaryp@gmail.com</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Owner</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-0.5">Primary Administrator & Clinic Manager</p>
                      </div>
                    </div>
                  </div>

                  {/* Registered Team */}
                  {teamMembers.map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-stone-200/80 shadow-2xs hover:border-stone-300 transition-colors">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs uppercase flex-shrink-0 border border-indigo-100">
                          {member.email.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-stone-900 truncate">{member.email}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">Authorized Support Specialist</p>
                        </div>
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(member.email)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors cursor-pointer"
                          title="Remove support access"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  {teamMembers.length === 0 && (
                    <div className="text-center p-6 bg-white rounded-xl border border-dashed border-stone-200">
                      <p className="text-xs text-stone-400">No additional staff members added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT PANEL: ACTIVE THREAD CHAT ================= */}
        <div className={`flex-1 flex flex-col bg-[#FAF9F7] ${!selectedEmail ? "hidden md:flex h-full" : "flex h-full"}`}>
          {activeConversation ? (
            <>
              {/* Thread Top Bar */}
              <div className="px-5 py-3.5 border-b border-stone-200/80 bg-white flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedEmail(null)}
                    className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer md:hidden text-stone-700 border border-stone-200"
                    aria-label="Back to inbox"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 border ${getAvatarColor(activeConversation.clientName).bg} ${getAvatarColor(activeConversation.clientName).text} ${getAvatarColor(activeConversation.clientName).border}`}>
                    {activeConversation.clientName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                        {activeConversation.clientName}
                      </h4>
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active Client
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 truncate">{activeConversation.clientEmail}</p>
                  </div>
                </div>

                {/* Show conversation category badge */}
                {(() => {
                  const convoCategory = activeConversation.messages.find(m => m.category)?.category;
                  const catDetails = categories.find(c => c.id === convoCategory);
                  if (!catDetails) return null;
                  return (
                    <div className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${catDetails.badgeBg}`}>
                      <span>{catDetails.icon}</span>
                      <span className="hidden sm:inline">{lang === "so" ? catDetails.title_so : catDetails.title_en}</span>
                      <span className="sm:hidden">{catDetails.title_en.split(" ")[0]}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Chat Message History */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8F7F4]"
              >
                {/* Conversation Start Timestamp Marker */}
                <div className="text-center my-2">
                  <span className="text-[10px] font-semibold tracking-wide text-stone-400 bg-white/80 border border-stone-200/60 px-3 py-1 rounded-full shadow-2xs">
                    Conversation with {activeConversation.clientName}
                  </span>
                </div>

                {activeConversation.messages.map((msg, index) => {
                  const isAdminMsg = msg.from === "admin";
                  const prevMsg = index > 0 ? activeConversation.messages[index - 1] : null;
                  const isSameSender = prevMsg && prevMsg.from === msg.from;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[88%] sm:max-w-[75%] ${
                        isAdminMsg ? "ml-auto items-end" : "mr-auto items-start"
                      } ${isSameSender ? "mt-1.5" : "mt-3.5"}`}
                    >
                      {!isSameSender && (
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-stone-500">
                            {isAdminMsg ? "Staff Specialist" : activeConversation.clientName}
                          </span>
                          <span className="text-[9px] text-stone-400">
                            {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed break-words shadow-xs transition-all ${
                          isAdminMsg
                            ? "bg-[#384c43] text-white rounded-tr-xs"
                            : "bg-white text-stone-900 border border-stone-200/90 rounded-tl-xs"
                        }`}
                      >
                        {msg.text}
                      </div>

                      {isSameSender && (
                        <span className="text-[8.5px] text-stone-400 mt-0.5 px-1">
                          {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Drawer / Suggestions */}
              <div className="px-4 py-2 bg-stone-50 border-t border-stone-200/60 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1 flex-shrink-0">
                    <Sparkles size={11} className="text-emerald-600" />
                    Quick reply:
                  </span>
                  {QUICK_RESPONSES.map((qr) => (
                    <button
                      key={qr.label}
                      type="button"
                      onClick={() => setAdminDraft(qr.text)}
                      className="text-[10.5px] font-medium bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-stone-200/80 text-stone-700 px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Composer Bar */}
              <div className="p-3 sm:p-4 border-t border-stone-200/80 bg-white">
                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-stone-50 border border-stone-200 focus-within:border-[#384c43] focus-within:bg-white rounded-2xl p-1.5 transition-all">
                    <textarea
                      value={adminDraft}
                      onChange={(e) => setAdminDraft(e.target.value)}
                      onKeyDown={handleAdminKeyPress}
                      placeholder={`Reply to ${activeConversation.clientName}... (Press Enter ↵ to send)`}
                      rows={1}
                      className="w-full resize-none bg-transparent py-1.5 px-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 outline-none leading-relaxed"
                      style={{ maxHeight: "120px", minHeight: "36px" }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAdminSend}
                    disabled={!adminDraft.trim() || adminSending}
                    className={`h-11 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-xs flex-shrink-0 ${
                      adminDraft.trim() && !adminSending
                        ? "bg-[#384c43] text-white hover:opacity-95 active:scale-95 cursor-pointer"
                        : "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200/50"
                    }`}
                  >
                    <span>{adminSending ? "Sending..." : "Send"}</span>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#FAF9F7] h-full">
              <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200/80 text-[#384c43] flex items-center justify-center mb-3 shadow-xs">
                <MessageSquareText size={24} />
              </div>
              <h4 className="text-sm font-bold text-stone-900">Select a Conversation</h4>
              <p className="text-xs text-stone-500 max-w-sm mt-1.5 leading-relaxed">
                Choose an active client ticket from the left sidebar to read message history, provide assistance, and resolve questions in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= CLIENT EXPERIENCE =================

  // 1. Guest Registration / Identity Prompt
  if (!activeEmail) {
    return (
      <div className="pop-in max-w-md mx-auto" style={{ padding: "20px 20px 40px" }}>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft size={16} /> {t("Back to settings", lang)}
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#384c43] flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
            <MessageSquare size={24} />
          </div>
          <h1 className="font-display text-xl font-bold text-stone-900">
            {lang === "so" ? "La hadal Kooxda Caawinaada" : "Talk with Barbaar Team"}
          </h1>
          <p className="text-xs text-stone-500 mt-2 leading-relaxed px-2">
            {lang === "so" 
              ? "Ku qor magacaaga iyo iimaylkaaga hoos si aad u bilowdo wadahadal toos ah oo aad la yeelanayso kooxdeena caawinaada." 
              : "Please provide your name and email address below to start a live support conversation with our specialists."}
          </p>
        </div>

        <form onSubmit={handleStartChat}>
          <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4 mb-4 shadow-xs">
            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}
            
            <TextField
              label={lang === "so" ? "Magacaaga" : "Your Name"}
              value={nameInput}
              onChange={setNameInput}
              icon={UserIcon}
              placeholder={lang === "so" ? "Tusaale. Axmed Cali" : "e.g. Ahmed Ali"}
            />

            <TextField
              label={lang === "so" ? "Iimaylkaaga" : "Your Email"}
              value={emailInput}
              onChange={setEmailInput}
              icon={Mail}
              type="email"
              placeholder="name@example.com"
            />
          </div>

          <Button full type="submit">
            {lang === "so" ? "Bilow Wadahadalka" : "Start Conversation"}
          </Button>
        </form>
      </div>
    );
  }

  // 2. Topic / Category Picker Screen
  if (activeEmail && !selectedCategory) {
    return (
      <div className="pop-in max-w-xl mx-auto py-6 px-4 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft size={16} /> {lang === "so" ? "Kula laabo" : "Back to Settings"}
        </button>

        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {lang === "so" ? "Caawinaad Toos Ah" : "Live Care Desk"}
          </span>
          <h1 className="font-display text-2xl font-bold text-stone-900">
            {lang === "so" ? "Sideen ku caawin karnaa maanta?" : "How can we help you today?"}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-md mx-auto leading-relaxed">
            {lang === "so"
              ? "Fadlan dooro qaybta ku habboon su'aashaada si aan kuugu xirno khabiirka saxda ah."
              : "Select a topic below to connect with a specialized Barbaar support specialist."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-start text-left p-4 sm:p-5 rounded-2xl border border-stone-200/90 hover:border-[#384c43] hover:shadow-md transition-all duration-200 bg-white group cursor-pointer"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mr-3.5 flex-shrink-0 shadow-2xs"
                style={{ backgroundColor: cat.color }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#384c43] transition-colors">
                  {lang === "so" ? cat.title_so : cat.title_en}
                </h3>
                <p className="text-[11px] text-stone-400 mt-1 leading-normal">
                  {lang === "so" ? cat.desc_so : cat.desc_en}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 3. Client Active Support Thread View
  const activeCategoryDetails = categories.find(c => c.id === selectedCategory);

  return (
    <div className="flex flex-col min-h-[520px] h-[75vh] sm:h-[620px] md:h-[660px] pop-in bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden text-stone-900">
      {/* Support Chat Header */}
      <div className="px-5 py-3.5 border-b border-stone-200/80 bg-white flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer border border-stone-200/60"
            aria-label="Back to settings"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-stone-900">
              {lang === "so" ? "Caawinaada Barbaar" : "Barbaar Support Team"}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-stone-500 font-medium">
                {lang === "so" ? "Wadahadal toos ah oo furan" : "Specialist online & ready"}
              </span>
            </div>
          </div>
        </div>

        {/* Current Active Category Pill */}
        {activeCategoryDetails && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="text-[11px] text-stone-400 hover:text-stone-700 font-bold transition-all bg-none border-none cursor-pointer px-1 py-0.5"
              title={lang === "so" ? "Baddal qaybta" : "Change category"}
            >
              {lang === "so" ? "Baddal" : "Change"}
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${activeCategoryDetails.badgeBg}`}>
              <span>{activeCategoryDetails.icon}</span>
              <span className="hidden sm:inline">
                {lang === "so" ? activeCategoryDetails.title_so : activeCategoryDetails.title_en}
              </span>
              <span className="sm:hidden">{activeCategoryDetails.title_en.split(" ")[0]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Message History area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8F7F4]"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#384c43] flex items-center justify-center mb-3 shadow-2xs">
              <HelpCircle size={26} />
            </div>
            <p className="text-sm font-bold text-stone-900">
              {lang === "so" ? "Ku soo dhowow Caawinaada Barbaar!" : "Welcome to Barbaar Support!"}
            </p>
            <p className="text-xs text-stone-500 mt-1.5 max-w-xs leading-relaxed">
              {lang === "so" 
                ? "Weydii su'aal kasta oo ku saabsan ballamaha, khuburada ama gargaarka dhaqaalaha. Kooxdayadu waxay kuugu soo jawaabi doonaan halkan." 
                : "Ask us anything about bookings, therapists, or financial aid. A Barbaar specialist will reply right here."}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isAdminSender = msg.from === "admin";
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isSameSender = prevMsg && prevMsg.from === msg.from;

            return (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                  isAdminSender ? "mr-auto items-start" : "ml-auto items-end"
                } ${isSameSender ? "mt-1.5" : "mt-3.5"}`}
              >
                {!isSameSender && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-stone-500">
                      {isAdminSender 
                        ? (lang === "so" ? "Kooxda Barbaar" : "Barbaar Specialist") 
                        : (lang === "so" ? "Adiga" : "You")}
                    </span>
                    <span className="text-[9px] text-stone-400">
                      {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}

                {/* Message Bubble */}
                <div 
                  className={`rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed break-words shadow-xs ${
                    isAdminSender 
                      ? "bg-white text-stone-900 border border-stone-200/90 rounded-tl-xs" 
                      : "bg-[#384c43] text-white rounded-tr-xs"
                  }`}
                >
                  {msg.text}
                </div>

                {isSameSender && (
                  <span className="text-[8.5px] text-stone-400 mt-0.5 px-1">
                    {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Composer Zone */}
      <div className="p-3 sm:p-4 border-t border-stone-200/80 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-stone-50 border border-stone-200 focus-within:border-[#384c43] focus-within:bg-white rounded-2xl p-1.5 transition-all">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={lang === "so" ? "Ku qor fariintaada halkan..." : "Write your message here... (Enter ↵ to send)"}
              rows={1}
              className="w-full resize-none bg-transparent py-1.5 px-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 outline-none leading-relaxed"
              style={{ maxHeight: "120px", minHeight: "36px" }}
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || loading}
            className={`h-11 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-xs flex-shrink-0 ${
              draft.trim() && !loading
                ? "bg-[#384c43] text-white hover:opacity-95 active:scale-95 cursor-pointer"
                : "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200/50"
            }`}
          >
            <span>{loading ? "Sending..." : "Send"}</span>
            <Send size={14} />
          </button>
        </div>

        <div className="text-[10.5px] text-stone-400 mt-2 text-center flex items-center justify-center gap-1">
          <Shield size={11} className="text-emerald-600" />
          <span>
            {lang === "so" 
              ? "Wadahadalkaagu waa mid sir ah oo ammaan ah." 
              : "Your support conversations are private and end-to-end encrypted."}
          </span>
        </div>
      </div>
    </div>
  );
}
