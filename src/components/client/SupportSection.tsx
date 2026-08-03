/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
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
  MessageCircle
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
    title_en: "Booking & Scheduling Help",
    title_so: "Gargaarka Ballamaha & Jadwalka",
    desc_en: "Help with booking, rescheduling, or canceling session appointments",
    desc_so: "Dalbo, baddal ama baajiso ballamaha kulanka",
    icon: "📅",
    color: "#e0f2fe", // light blue
    textColor: "#0369a1",
  },
  {
    id: "payment",
    title_en: "Payment & Refunds",
    title_so: "Lacag-bixinta & Lacag-celinta",
    desc_en: "Questions about fees, transaction history, or refund requests",
    desc_so: "Su'aalaha ku saabsan khidmadaha ama lacag-celinta",
    icon: "💳",
    color: "#fee2e2", // light red
    textColor: "#b91c1c",
  },
  {
    id: "aid",
    title_en: "Financial Aid Assistance",
    title_so: "Cawinaada Gargaarka Dhaqaalaha",
    desc_en: "Inquire about financial aid discounts and applications",
    desc_so: "Codsashada gargaarka dhaqaalaha ama helida qiimo-dhimista",
    icon: "🤝",
    color: "#fef3c7", // light amber
    textColor: "#b45309",
  },
  {
    id: "general",
    title_en: "General Inquiries",
    title_so: "Su'aalaha Guud",
    desc_en: "General questions about Barbaar services and experts",
    desc_so: "Wixii macluumaad guud ah ee ku saabsan adeegyada Barbaar",
    icon: "💬",
    color: "#f0fdf4", // light green
    textColor: "#15803d",
  }
];

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

  // --- TEAM MEMBER MANAGEMENT STATES ---
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

  // --- TEAM MEMBER ADMISTRATION ACTION HANDLERS ---
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
  const conversationsMap: Record<string, Conversation> = {};
  allMessages.forEach((msg) => {
    const email = msg.clientEmail.trim().toLowerCase();
    if (!conversationsMap[email]) {
      conversationsMap[email] = {
        clientEmail: msg.clientEmail,
        clientName: msg.clientName || "Guest Client",
        latestMessage: msg,
        messages: [],
      };
    }
    conversationsMap[email].messages.push(msg);
    conversationsMap[email].latestMessage = msg;
  });

  const conversationsList = Object.values(conversationsMap).sort(
    (a, b) => b.latestMessage.time.localeCompare(a.latestMessage.time)
  );

  const activeConversation = selectedEmail ? conversationsMap[selectedEmail.toLowerCase()] : null;

  // --- RENDER ADMIN / SUPPORT TEAM INTERFACE ---
  if (isAdminView) {
    return (
      <div className="flex flex-col md:flex-row h-[80vh] md:h-[680px] pop-in bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Sidebar: Chat list or Team list */}
        <div className={`w-full md:w-85 border-r border-gray-100 flex flex-col bg-slate-50/50 ${selectedEmail ? "hidden md:flex" : "flex h-full"}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-white flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={onBack}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  style={{ color: colors.ink }}
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <span>Support Desk</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                      {isOwner ? "Owner" : "Staff Team"}
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-400">Barbaar Wellness Support</p>
                </div>
              </div>
            </div>

            {/* Sub-navigation tabs: Conversations vs Team management */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setAdminTab("chats")}
                className={`flex-1 py-1.5 rounded-md font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  adminTab === "chats" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <MessageCircle size={13} />
                <span>Inbox ({conversationsList.length})</span>
              </button>
              <button
                onClick={() => setAdminTab("team")}
                className={`flex-1 py-1.5 rounded-md font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  adminTab === "team" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Users size={13} />
                <span>Staff Team ({teamMembers.length + 1})</span>
              </button>
            </div>
          </div>

          {/* Conversations tab */}
          {adminTab === "chats" && (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {conversationsList.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No support conversations found.
                </div>
              ) : (
                conversationsList.map((convo) => {
                  const isActive = selectedEmail?.toLowerCase() === convo.clientEmail.toLowerCase();
                  const isLatestFromUser = convo.latestMessage.from === "client";
                  
                  // Extract conversation category
                  const convoCategory = convo.messages.find(m => m.category)?.category;
                  const catDetails = categories.find(c => c.id === convoCategory);

                  return (
                    <button
                      key={convo.clientEmail}
                      onClick={() => setSelectedEmail(convo.clientEmail)}
                      className={`w-full text-left p-4 transition-all flex flex-col gap-1 hover:bg-slate-50/80 cursor-pointer ${
                        isActive ? "bg-white border-l-4 border-[#384c43] pl-3" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-xs font-bold text-gray-800 truncate max-w-[140px]">
                          {convo.clientName}
                        </span>
                        <span className="text-[9px] text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(convo.latestMessage.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                          {convo.clientEmail}
                        </span>
                        {catDetails && (
                          <span 
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                            style={{ backgroundColor: catDetails.color, color: catDetails.textColor }}
                          >
                            {catDetails.icon} {lang === "so" ? catDetails.title_so.split(" ")[0] : catDetails.title_en.split(" ")[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className={`text-xs truncate w-full max-w-[200px] ${
                          isLatestFromUser ? "font-semibold text-gray-900" : "text-gray-400"
                        }`}>
                          {isLatestFromUser ? "User: " : "Staff: "}{convo.latestMessage.text}
                        </p>
                        {isLatestFromUser && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse ml-1" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Staff team tab */}
          {adminTab === "team" && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Add member form (Owner only) */}
              {isOwner ? (
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                  <h4 className="text-xs font-bold text-gray-800 mb-2">Authorize Team Email</h4>
                  <form onSubmit={handleAddTeamMemberSubmit} className="flex gap-1.5">
                    <input
                      type="email"
                      required
                      value={newTeamEmail}
                      onChange={(e) => setNewTeamEmail(e.target.value)}
                      placeholder="team-member@email.com"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:border-[#384c43]"
                    />
                    <button
                      type="submit"
                      className="bg-[#384c43] hover:opacity-90 text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </form>
                  {teamError && <p className="text-[10px] text-red-500 mt-1.5">{teamError}</p>}
                  {teamSuccess && <p className="text-[10px] text-emerald-600 mt-1.5">{teamSuccess}</p>}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                  🔒 Staff access only. Only primary owner (<strong>barbaaryp@gmail.com</strong>) can register or delete support team members.
                </div>
              )}

              {/* Members List */}
              <div className="flex-1">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Active Team Personnel</h4>
                <div className="space-y-2">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-50 shadow-2xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs">
                        👑
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-gray-800 truncate">barbaaryp@gmail.com</p>
                        <p className="text-[9px] text-gray-400">Primary Administrator / Owner</p>
                      </div>
                    </div>
                  </div>

                  {/* Registered Team */}
                  {teamMembers.map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-50 shadow-2xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs uppercase">
                          {member.email.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-gray-800 truncate">{member.email}</p>
                          <p className="text-[9px] text-gray-400">Authorized Support Agent</p>
                        </div>
                      </div>

                      {isOwner && (
                        <button
                          onClick={() => handleRemoveTeamMember(member.email)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors cursor-pointer"
                          title="Remove team access"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}

                  {teamMembers.length === 0 && (
                    <p className="text-[11px] text-center text-gray-400 py-4">No additional staff members authorized yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Panel */}
        <div className={`flex-1 flex flex-col bg-white ${!selectedEmail ? "hidden md:flex h-full" : "flex h-full"}`}>
          {activeConversation ? (
            <>
              {/* Active Thread Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/10">
                <div className="flex items-center gap-3 truncate">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer md:hidden"
                    style={{ color: colors.ink }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                    {activeConversation.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{activeConversation.clientName}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{activeConversation.clientEmail}</p>
                  </div>
                </div>

                {/* Show conversation category */}
                {(() => {
                  const convoCategory = activeConversation.messages.find(m => m.category)?.category;
                  const catDetails = categories.find(c => c.id === convoCategory);
                  if (!catDetails) return null;
                  return (
                    <div 
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{ backgroundColor: catDetails.color, color: catDetails.textColor }}
                    >
                      <span>{catDetails.icon}</span>
                      <span>{lang === "so" ? catDetails.title_so : catDetails.title_en}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Chat History */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20"
              >
                {activeConversation.messages.map((msg) => {
                  const isAdminMsg = msg.from === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isAdminMsg ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <span className="text-[9px] text-gray-400 mb-0.5 px-1 font-semibold">
                        {isAdminMsg ? "Staff Agent" : activeConversation.clientName}
                      </span>
                      <div
                        className={`rounded-2xl px-4 py-2 text-[12.5px] leading-relaxed break-words shadow-sm ${
                          isAdminMsg
                            ? "text-white rounded-tr-sm"
                            : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                        }`}
                        style={{
                          backgroundColor: isAdminMsg ? "#384c43" : "#ffffff",
                          color: isAdminMsg ? "#ffffff" : colors.ink,
                        }}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-gray-400 mt-0.5 px-1">
                        {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Composer */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2">
                  <textarea
                    value={adminDraft}
                    onChange={(e) => setAdminDraft(e.target.value)}
                    onKeyDown={handleAdminKeyPress}
                    placeholder="Type reply to client..."
                    rows={1}
                    className="flex-1 resize-none bg-gray-50 border border-gray-200 focus:border-[#384c43] focus:bg-white rounded-xl py-2 px-3.5 text-xs outline-none transition-all duration-150"
                    style={{ maxHeight: "100px" }}
                  />
                  <button
                    onClick={handleAdminSend}
                    disabled={!adminDraft.trim() || adminSending}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      adminDraft.trim() && !adminSending
                        ? "bg-[#384c43] text-white hover:opacity-90 active:scale-95 cursor-pointer"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/10 h-full">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <MessageSquare size={22} />
              </div>
              <h4 className="text-xs font-bold text-gray-800">No Chat Selected</h4>
              <p className="text-[11px] text-gray-400 max-w-xs mt-1 leading-relaxed">
                Select an active customer support ticket from the inbox sidebar to respond to your clients in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- CLIENT NAME & EMAIL INPUT FORM ---
  if (!activeEmail) {
    return (
      <div className="pop-in max-w-md mx-auto" style={{ padding: "20px 20px 40px" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: colors.indigo,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            padding: "4px 0",
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={16} /> {t("Back to settings", lang)}
        </button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: colors.indigoSoft,
              color: colors.indigo,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <MessageSquare size={26} />
          </div>
          <h1 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: colors.ink }}>
            {lang === "so" ? "La hadal Kooxda Caawinaada" : "Talk with Barbaar Team"}
          </h1>
          <p style={{ fontSize: 13, color: colors.inkSoft, marginTop: 6, padding: "0 12px", lineHeight: 1.45 }}>
            {lang === "so" 
              ? "Ku qor magacaaga iyo iimaylkaaga hoos si aad u bilowdo wadahadal toos ah oo aad la yeelanayso kooxdeena caawinaada." 
              : "Please provide your name and email address below to start a live support conversation with our team."}
          </p>
        </div>

        <form onSubmit={handleStartChat}>
          <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {formError && (
              <div style={{ background: `${colors.danger}10`, border: `1px solid ${colors.danger}30`, padding: "10px 12px", borderRadius: 10, fontSize: "12px", color: colors.danger }}>
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
          </Card>

          <Button full type="submit">
            {lang === "so" ? "Bilow Wadahadalka" : "Start Conversation"}
          </Button>
        </form>
      </div>
    );
  }

  // --- CLIENT CATEGORY SELECTION SCREEN ---
  if (activeEmail && !selectedCategory) {
    return (
      <div className="pop-in max-w-xl mx-auto" style={{ padding: "24px 20px 48px" }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-none border-none text-gray-500 font-bold text-[13px] cursor-pointer hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft size={16} /> {lang === "so" ? "Kula laabo" : "Back to Settings"}
        </button>

        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900" style={{ color: colors.ink }}>
            {lang === "so" ? "Sideen ku caawin karnaa maanta?" : "How can we help you today?"}
          </h1>
          <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
            {lang === "so"
              ? "Fadlan dooro qaybta ku habboon su'aashaada si aan kuugu xirno kooxda saxda ah."
              : "Please select a category that matches your inquiry to start a real-time conversation."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-start text-left p-5 rounded-2xl border border-gray-100 hover:border-emerald-600/40 hover:shadow-md transition-all duration-200 bg-white group cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mr-4 flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              >
                {cat.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-[13.5px] font-bold text-gray-900 group-hover:text-[#384c43] transition-colors">
                  {lang === "so" ? cat.title_so : cat.title_en}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  {lang === "so" ? cat.desc_so : cat.desc_en}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- CLIENT ACTIVE SUPPORT CHAT VIEW ---
  const activeCategoryDetails = categories.find(c => c.id === selectedCategory);

  return (
    <div className="flex flex-col min-h-[500px] h-[72vh] sm:h-[600px] md:h-[650px] pop-in bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Support Chat Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: colors.paper }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            style={{ color: colors.ink }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-display text-[15px] font-bold text-gray-900" style={{ color: colors.ink }}>
              {lang === "so" ? "Caawinaada Barbaar" : "Barbaar Support Team"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-gray-500 font-medium">
                {lang === "so" ? "Wadahadal toos ah" : "Live real-time support"}
              </span>
            </div>
          </div>
        </div>

        {/* Current Active Category Pill */}
        {activeCategoryDetails && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-[10px] text-gray-400 hover:text-gray-700 font-bold transition-all bg-none border-none cursor-pointer px-1 py-0.5"
              title={lang === "so" ? "Baddal qaybta" : "Change category"}
            >
              ({lang === "so" ? "Baddal" : "Change"})
            </button>
            <div 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: activeCategoryDetails.color, color: activeCategoryDetails.textColor }}
            >
              <span>{activeCategoryDetails.icon}</span>
              <span className="max-w-[100px] truncate sm:max-w-none">
                {lang === "so" ? activeCategoryDetails.title_so : activeCategoryDetails.title_en}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Message History area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <HelpCircle size={22} />
            </div>
            <p className="text-[13.5px] font-semibold text-gray-800" style={{ color: colors.ink }}>
              {lang === "so" ? "Ku soo dhowow Caawinaada Barbaar!" : "Welcome to Barbaar Support!"}
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
              {lang === "so" 
                ? "Weydii su'aal kasta oo ku saabsan ballamaha, dhakhaatiirta, ama gargaarka dhaqaalaha. Kooxdayadu waxay kuugu soo jawaabi doonaan halkan." 
                : "Ask us anything about bookings, clinical experts, or financial aid. Our support specialists will respond right here."}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdminSender = msg.from === "admin";
            return (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isAdminSender ? "mr-auto items-start" : "ml-auto items-end"}`}
              >
                {/* Sender Name tag */}
                <span className="text-[10px] text-gray-400 font-medium mb-1 px-1">
                  {isAdminSender ? (lang === "so" ? "Kooxda Barbaar" : "Barbaar Team") : (lang === "so" ? "Adiga" : "You")}
                </span>

                {/* Message Bubble */}
                <div 
                  className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed break-words shadow-sm ${
                    isAdminSender 
                      ? "bg-white text-gray-800 border border-gray-100 rounded-tl-sm" 
                      : "text-white rounded-tr-sm"
                  }`}
                  style={{ 
                    backgroundColor: isAdminSender ? "#ffffff" : "#384c43",
                    color: isAdminSender ? colors.ink : "#ffffff"
                  }}
                >
                  {msg.text}
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-gray-400 mt-1 px-1">
                  {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Composer Zone */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={lang === "so" ? "Ku qor fariintaada halkan..." : "Write your question here..."}
            rows={1}
            className="flex-1 bg-gray-50/80 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-emerald-600 rounded-2xl py-2 px-3.5 text-sm outline-none transition-all duration-150"
            style={{ 
              minHeight: "42px", 
              maxHeight: "120px", 
              resize: "none", 
              lineHeight: "22px" 
            }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || loading}
            className={`w-[42px] h-[42px] rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              draft.trim() && !loading
                ? "bg-[#384c43] text-white hover:opacity-95 active:scale-95 cursor-pointer shadow-sm"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-[10px] text-gray-400 mt-2 text-center">
          {lang === "so" 
            ? "Fariimaha si ammaan ah ayaa loo gudbiyaa." 
            : "Your chats are encrypted and securely synchronized."}
        </div>
      </div>
    </div>
  );
}
