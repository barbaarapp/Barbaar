/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  User, 
  Phone, 
  Mail, 
  Pencil, 
  Info, 
  FileText, 
  Shield, 
  LayoutDashboard, 
  ClipboardList, 
  ChevronRight, 
  Gift, 
  Bell,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Share2,
  LucideIcon,
  LogIn,
  LogOut,
  Key,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  MessageSquare,
  Download,
  Smartphone,
  UserCheck
} from "lucide-react";
import SupportSection from "./SupportSection";
import { ClientProfile } from "../../types";
import { colors } from "../../constants";
import { translateText as t, Language } from "../../utils/translations";
import { 
  auth, 
  googleProvider, 
  GoogleAuthProvider,
  signInWithPopup, 
  signInWithRedirect,
  signInWithCredential,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  db,
  collection,
  onSnapshot
} from "../../lib/firebase";
import config from "../../../firebase-applet-config.json";
import { User as FirebaseUser } from "firebase/auth";
import TopBar from "../ui/TopBar";
import Card from "../ui/Card";
import TextField from "../ui/TextField";
import Button from "../ui/Button";

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  sublabel?: string;
}

function SettingsRow({ icon: Icon, label, onClick, sublabel }: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "14px 12px",
        background: "none",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        borderRadius: 14,
        transition: "all 0.15s ease",
      }}
      className="hover:bg-slate-50 active:scale-[0.99]"
    >
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: colors.indigoSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Icon size={16} color={colors.indigo} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14.5px", fontWeight: 600, color: colors.ink }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: "11px", color: colors.inkSoft, marginTop: 1 }}>
            {sublabel}
          </div>
        )}
      </div>
      <ChevronRight size={16} color={colors.inkSoft} style={{ opacity: 0.7 }} />
    </button>
  );
}

interface SettingsScreenProps {
  clientProfile: ClientProfile;
  setClientProfile: (profile: ClientProfile) => void;
  onOpen: (screen: string) => void;
  onTherapistLogin: () => void;
  onAdminLogin: () => void;
  currentUser?: FirebaseUser | null;
  userRole?: "client" | "therapist" | "admin" | null;
  onSignOut?: () => void;
}

export default function SettingsScreen({
  clientProfile,
  setClientProfile,
  onOpen,
  onTherapistLogin,
  onAdminLogin,
  currentUser = null,
  userRole = null,
  onSignOut,
}: SettingsScreenProps) {
  const lang: Language = clientProfile.language || "en";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClientProfile>(clientProfile);
  const [subscreen, setSubscreen] = useState<"invite" | "notifications" | "support" | null>(null);
  const [copied, setCopied] = useState(false);

  // Support Team hook to fetch emails of staff members dynamically
  const [supportTeamEmails, setSupportTeamEmails] = useState<string[]>([]);
  React.useEffect(() => {
    const q = collection(db, "support_team");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const emails: string[] = [];
        snapshot.forEach((docSnap) => {
          emails.push(docSnap.id.toLowerCase());
        });
        setSupportTeamEmails(emails);
      },
      (error) => {
        console.error("Error syncing support team emails in settings:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const userEmail = (currentUser?.email || "").trim().toLowerCase();
  const isOwner = userEmail === "barbaaryp@gmail.com";
  const isSupportTeam = supportTeamEmails.includes(userEmail) || isOwner;

  // Notifications preferences states
  const [emailAlert, setEmailAlert] = useState(true);
  const [smsAlert, setSmsAlert] = useState(true);
  const [whatsappAlert, setWhatsappAlert] = useState(false);
  const [savedNotifs, setSavedNotifs] = useState(false);

  // Firebase auth state
  const [authMode, setAuthMode] = useState<"none" | "email">("none");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [restrictionMsg, setRestrictionMsg] = useState<string | null>(null);
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  // Load Google Identity Services dynamically for seamless One Tap and native in-page selection
  React.useEffect(() => {
    let active = true;
    if (currentUser) return;

    const initializeGsi = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !active) return;

      try {
        google.accounts.id.initialize({
          client_id: config.oAuthClientId,
          callback: async (response: any) => {
            if (!active) return;
            setAuthLoading(true);
            setAuthError(null);
            try {
              const credential = GoogleAuthProvider.credential(response.credential);
              await signInWithCredential(auth, credential);
            } catch (err: any) {
              console.error("GSI credential sign in error:", err);
              setAuthError(err.message || "Failed to sign in with Google credential.");
            } finally {
              if (active) setAuthLoading(false);
            }
          },
          auto_select: false,
          itp_support: true,
          use_fedcm_for_prompt: false,
        });

        // Render the official inline Google sign-in button
        const btnContainer = document.getElementById("google-gsi-inline-button");
        if (btnContainer) {
          google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            width: btnContainer.clientWidth || 320,
            text: "signin_with",
            shape: "pill",
          });
        }

        // Trigger Google One Tap safely
        try {
          google.accounts.id.prompt((notification: any) => {
            if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
              // Gracefully handle iframe or FedCM policy suppression without throwing
            }
          });
        } catch (promptError) {
          // Ignore prompt restriction warnings in sandboxed frames
        }
      } catch (e) {
        console.warn("Failed to initialize Google GSI:", e);
      }
    };

    // Check if script exists, otherwise inject it
    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGsi();
      };
      document.head.appendChild(script);
    } else {
      const t = setTimeout(() => {
        initializeGsi();
      }, 500);
      return () => {
        clearTimeout(t);
        active = false;
      };
    }

    return () => {
      active = false;
    };
  }, [currentUser]);

  async function handleGoogleSignIn() {
    setAuthLoading(true);
    setAuthError(null);

    // Try Google Identity Services prompt if available
    const google = (window as any).google;
    if (google?.accounts?.id) {
      try {
        google.accounts.id.prompt();
      } catch (e) {
        console.warn("GSI prompt warning:", e);
      }
    }

    try {
      googleProvider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      const msg = String(err?.message || err);
      
      if (
        msg.includes("missing initial state") ||
        msg.includes("sessionStorage") ||
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/operation-not-supported-in-this-environment"
      ) {
        setAuthError(t("Google Popup was blocked or restricted on this device browser. Please sign in using Email & Password or Quick Sign-In below.", lang));
        setAuthMode("email");
      } else if (
        err?.code === "auth/popup-closed-by-user" || 
        err?.code === "auth/cancelled-popup-request"
      ) {
        setAuthError(null);
      } else {
        setAuthError(err?.message || t("Failed to sign in with Google. You can sign in with email below.", lang));
        setAuthMode("email");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleEmailSignInOrUp() {
    if (!emailInput || !passwordInput) {
      setAuthError("Please fill in both email and password.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      // Try logging in
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        // Automatically try creating the user to simplify testing
        try {
          await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        } catch (regErr: any) {
          setAuthError(regErr.message || "Invalid credentials, and failed to auto-register.");
        }
      } else {
        setAuthError(err.message || "Authentication failed.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleAnonymousSignIn() {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error("Anonymous Sign-In Error:", err);
      setAuthError("Quick guest sign-in failed: " + (err?.message || String(err)));
    } finally {
      setAuthLoading(false);
    }
  }

  async function handlePresetLogin(email: string) {
    setAuthLoading(true);
    setAuthError(null);
    setEmailInput(email);
    setPasswordInput("barbaar123");
    try {
      await signInWithEmailAndPassword(auth, email, "barbaar123");
    } catch (err: any) {
      // Auto-register preset on first use or fallback
      try {
        await createUserWithEmailAndPassword(auth, email, "barbaar123");
      } catch (regErr: any) {
        if (regErr?.code === "auth/email-already-in-use") {
          // Retry sign in
          try {
            await signInWithEmailAndPassword(auth, email, "barbaar123");
          } catch (retryErr: any) {
            setAuthError("Could not sign in: " + retryErr.message);
          }
        } else {
          setAuthError("Could not log in as preset: " + regErr.message);
        }
      }
    } finally {
      setAuthLoading(false);
    }
  }

  const referralCode = `BARBAAR-${(clientProfile.name || "USER").split(" ")[0].toUpperCase()}-REF7`;
  const referralLink = `https://barbaar.app/invite?code=${referralCode}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveNotifs() {
    setSavedNotifs(true);
    setTimeout(() => {
      setSavedNotifs(false);
      setSubscreen(null);
    }, 1500);
  }

  // Subview: Support Chat
  if (subscreen === "support") {
    return (
      <SupportSection
        clientProfile={clientProfile}
        setClientProfile={setClientProfile}
        onBack={() => setSubscreen(null)}
        lang={lang}
        userRole={userRole}
      />
    );
  }

  // Subview: Invite & Earn
  if (subscreen === "invite") {
    return (
      <div className="pop-in" style={{ padding: "20px 20px 40px" }}>
        <button
          onClick={() => setSubscreen(null)}
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
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} /> {t("Back to settings", lang)}
        </button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              background: colors.amberSoft,
              color: colors.amber,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Gift size={28} />
          </div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: colors.ink }}>
            {t("Invite Friends, Earn Care", lang)}
          </h1>
          <p style={{ fontSize: 13, color: colors.inkSoft, marginTop: 4, padding: "0 10px", lineHeight: 1.4 }}>
            {t("Share the gift of mental well-being. Give your friends 30% off, and earn 1 free session credit for each successful booking!", lang)}
          </p>
        </div>

        {/* Personalized Referral Code */}
        <Card style={{ marginBottom: 18, textAlign: "center", background: colors.amberSoft }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            {t("Your Exclusive Invite Code", lang)}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.indigo, letterSpacing: 1, fontFamily: "monospace" }}>
            {referralCode}
          </div>
        </Card>

        {/* Copy Referral Link */}
        <Card style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink }}>
            {t("Share your unique referral link", lang)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              readOnly
              value={referralLink}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1.5px solid ${colors.line}`,
                fontSize: 12.5,
                background: colors.indigoSoft,
                outline: "none",
                color: colors.inkSoft,
              }}
            />
            <button
              onClick={handleCopyLink}
              style={{
                background: copied ? "#137333" : colors.indigo,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "0 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontWeight: 700,
                fontSize: 12,
                transition: "background 0.2s ease",
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </Card>

        {/* Direct Sharing Links */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <a
            href={`https://wa.me/?text=Hey!%20I'm%20using%20Barbaar%20Wellness%20for%20specialist%20mental%20health%20support.%20Use%20my%20link%20to%20get%2030%25%20off%20your%20first%20session:%20${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              background: "#25D366",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 12,
              padding: "11px 0",
              fontWeight: 700,
              fontSize: 13,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Share2 size={15} /> WhatsApp
          </a>

          <a
            href={`mailto:?subject=Join%20Barbaar%20Wellness%20-%2030%25%20Discount&body=Hey,%20I've%20been%20using%20Barbaar%20Wellness%20and%20thought%20you%20might%20like%20it.%20Here's%20my%20link%20to%20get%2030%25%20off%20your%20first%20session:%20${encodeURIComponent(referralLink)}`}
            style={{
              flex: 1,
              background: colors.indigo,
              color: "#fff",
              textDecoration: "none",
              borderRadius: 12,
              padding: "11px 0",
              fontWeight: 700,
              fontSize: 13,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Mail size={15} /> Email Invite
          </a>
        </div>

        {/* Your Referral Status Progress */}
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, paddingLeft: 4 }}>
          {t("Your earnings history", lang)}
        </div>
        <Card style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center", borderBottom: `1px solid ${colors.line}30`, paddingBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: colors.inkSoft }}>{t("Invites Sent", lang)}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: colors.ink, marginTop: 4 }}>4</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: colors.inkSoft }}>{t("Registered", lang)}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: colors.ink, marginTop: 4 }}>2</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: colors.amber }}>{t("Credits Earned", lang)}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: colors.amber, marginTop: 4 }}>$50</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: colors.ink }}>Ahmed Duale</div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#137333", background: "#e6f4ea", padding: "2px 8px", borderRadius: 999 }}>+$25 {lang === "so" ? "La helay" : "Earned"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: colors.ink }}>Muna Farah</div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#137333", background: "#e6f4ea", padding: "2px 8px", borderRadius: 999 }}>+$25 {lang === "so" ? "La helay" : "Earned"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, opacity: 0.6 }}>
              <div style={{ fontWeight: 600, color: colors.ink }}>Khalid Omar</div>
              <span style={{ fontSize: 10, fontWeight: 700, color: colors.inkSoft }}>{t("Pending booking", lang)}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Subview: Notification Preferences
  if (subscreen === "notifications") {
    return (
      <div className="pop-in" style={{ padding: "20px 20px 40px" }}>
        <button
          onClick={() => setSubscreen(null)}
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
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} /> {t("Back to settings", lang)}
        </button>

        <div style={{ marginBottom: 24 }}>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: colors.ink }}>
            {t("Notification Settings", lang)}
          </h1>
          <p style={{ fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
            {t("Customize how you receive calendar updates and appointment alerts.", lang)}
          </p>
        </div>

        {/* Channels */}
        <Card style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {/* Gmail toggle */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <input
              id="notif-email"
              type="checkbox"
              checked={emailAlert}
              onChange={() => setEmailAlert(!emailAlert)}
              style={{ width: 18, height: 18, marginTop: 3, accentColor: colors.indigo, cursor: "pointer" }}
            />
            <div style={{ flex: 1 }}>
              <label htmlFor="notif-email" style={{ fontWeight: 700, fontSize: "14px", color: colors.ink, cursor: "pointer" }}>
                {t("Gmail Notifications", lang)}
              </label>
              <div style={{ fontSize: "11.5px", color: colors.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
                {t("Receive full calendar events, meeting invites, and payment invoices.", lang)}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: `${colors.line}25` }} />

          {/* SMS / EVC plus toggle */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <input
              id="notif-sms"
              type="checkbox"
              checked={smsAlert}
              onChange={() => setSmsAlert(!smsAlert)}
              style={{ width: 18, height: 18, marginTop: 3, accentColor: colors.indigo, cursor: "pointer" }}
            />
            <div style={{ flex: 1 }}>
              <label htmlFor="notif-sms" style={{ fontWeight: 700, fontSize: "14px", color: colors.ink, cursor: "pointer" }}>
                {t("Mobile SMS Alerts", lang)}
              </label>
              <div style={{ fontSize: "11.5px", color: colors.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
                {t("Get a text message exactly 1 hour before your session begins with the Zoom URL.", lang)}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: `${colors.line}25` }} />

          {/* WhatsApp toggle */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <input
              id="notif-whatsapp"
              type="checkbox"
              checked={whatsappAlert}
              onChange={() => setWhatsappAlert(!whatsappAlert)}
              style={{ width: 18, height: 18, marginTop: 3, accentColor: colors.indigo, cursor: "pointer" }}
            />
            <div style={{ flex: 1 }}>
              <label htmlFor="notif-whatsapp" style={{ fontWeight: 700, fontSize: "14px", color: colors.ink, cursor: "pointer" }}>
                {t("WhatsApp Direct Reminders", lang)}
              </label>
              <div style={{ fontSize: "11.5px", color: colors.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
                {t("Receive clinical resources and direct reminders through our automated WhatsApp assistant.", lang)}
              </div>
            </div>
          </div>
        </Card>

        {/* Contact info verification info */}
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>
          {t("Verification Contact Info", lang)}
        </div>
        <Card style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Smartphone size={16} color={colors.inkSoft} />
            <div style={{ fontSize: 13, color: colors.ink }}>
              {t("SMS Alerts sent to:", lang)} <strong>{clientProfile.phone || "Please provide phone"}</strong>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mail size={16} color={colors.inkSoft} />
            <div style={{ fontSize: 13, color: colors.ink }}>
              {t("Gmail invites sent to:", lang)} <strong>{clientProfile.email || "Please provide email"}</strong>
            </div>
          </div>
        </Card>

        <Button
          full
          disabled={savedNotifs}
          onClick={handleSaveNotifs}
        >
          {savedNotifs ? t("✓ Preferences Saved", lang) : t("Save Preferences", lang)}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Tinted Top Banner Zone */}
      <div style={{
        background: `linear-gradient(to bottom, ${colors.acaciaSoft}40, transparent)`,
        padding: "24px 20px 10px",
        textAlign: "center",
        borderBottom: `1px solid ${colors.line}25`,
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, position: "relative" }}>
          {/* Avatar frame with Pencil Badge */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: colors.indigo,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              boxShadow: "0 8px 24px rgba(51, 70, 95, 0.15)",
            }}>
              {clientProfile.name ? clientProfile.name.charAt(0).toUpperCase() : <User size={32} />}
            </div>
            
            <button
              onClick={() => {
                setDraft(clientProfile);
                setEditing(!editing);
              }}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: colors.amber,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${colors.paper}`,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(193, 122, 61, 0.3)",
                transition: "transform 0.15s ease",
              }}
              className="hover:scale-110 active:scale-95"
            >
              <Pencil size={12} />
            </button>
          </div>
        </div>

        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 600, color: colors.ink }}>
          {clientProfile.name || t("Add Your Name", lang)}
        </h1>
        <p style={{ fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
          {t("Member since October 2025", lang)}
        </p>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* Restriction Alert Modal Banner */}
        {restrictionMsg && (
          <div className="fade-up" style={{ marginBottom: 16 }}>
            <Card style={{ padding: 16, border: `1px solid ${colors.danger}60`, background: `${colors.danger}10` }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <AlertTriangle size={18} color={colors.danger} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.danger, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {t("Access Restricted", lang)}
                  </div>
                  <p style={{ fontSize: 12.5, color: colors.ink, marginTop: 4, lineHeight: 1.4 }}>
                    {restrictionMsg}
                  </p>
                  <button
                    onClick={() => setRestrictionMsg(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.indigo,
                      fontWeight: 700,
                      fontSize: 11.5,
                      cursor: "pointer",
                      padding: "4px 0",
                      marginTop: 8,
                      textDecoration: "underline"
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TOP LEVEL QUICK ACCESS PORTALS FOR ADMINS, THERAPISTS & STAFF TEAM */}
        {(userRole === "admin" || userRole === "therapist" || isSupportTeam) && (
          <div className="fade-up" style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              color: colors.amber,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              paddingLeft: 4,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: colors.amber }} />
              {t("Specialist Quick Portal", lang)}
            </div>
            <div 
              style={{ 
                background: `linear-gradient(135deg, #384c43 0%, #202d28 100%)`, 
                borderRadius: 16, 
                padding: "16px 18px", 
                color: "#ffffff",
                boxShadow: "0 6px 20px rgba(56, 76, 67, 0.25)",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                    {isSupportTeam && userRole !== "admin" && userRole !== "therapist" ? (
                      lang === "so" ? "Xarunta Caawinaada Shaqaalaha" : "Support Staff Desk"
                    ) : userRole === "admin" ? (
                      t("Admin Control Console", lang)
                    ) : (
                      t("Clinical Therapist Portal", lang)
                    )}
                  </h3>
                  <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", marginTop: 4, lineHeight: 1.35 }}>
                    {isSupportTeam && userRole !== "admin" && userRole !== "therapist" ? (
                      lang === "so" 
                        ? "Waxaad tahay xubin ka tirsan kooxda caawinaada ee la ogolaaday. Fure sanduuqa fariimaha si aad u caawiso macmiisha." 
                        : "You are an authorized support staff member. Open the inbox to respond to client support tickets."
                    ) : userRole === "admin" ? (
                      t("Manage clinical directories, support channels, and platform configurations.", lang)
                    ) : (
                      t("Access your clinical appointment sessions and client message streams.", lang)
                    )}
                  </p>
                </div>
                <div style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  padding: 8,
                  borderRadius: 12,
                  color: "#ffffff"
                }}>
                  {isSupportTeam && userRole !== "admin" && userRole !== "therapist" ? (
                    <MessageSquare size={20} />
                  ) : userRole === "admin" ? (
                    <ClipboardList size={20} />
                  ) : (
                    <LayoutDashboard size={20} />
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {isSupportTeam && userRole !== "admin" && userRole !== "therapist" ? (
                  <button
                    onClick={() => setSubscreen("support")}
                    style={{
                      flex: 1,
                      background: "#ffffff",
                      color: "#384c43",
                      border: "none",
                      borderRadius: 12,
                      padding: "11px 16px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                      transition: "transform 0.1s ease, background 0.15s ease",
                    }}
                    className="hover:bg-slate-100 active:scale-[0.98]"
                  >
                    {lang === "so" ? "Fure Sanduuqa Caawinaada" : "Open Support Desk"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (userRole === "admin") {
                          onAdminLogin();
                        } else {
                          onTherapistLogin();
                        }
                      }}
                      style={{
                        flex: 1,
                        background: "#ffffff",
                        color: "#384c43",
                        border: "none",
                        borderRadius: 12,
                        padding: "11px 16px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        textAlign: "center",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                        transition: "transform 0.1s ease, background 0.15s ease",
                      }}
                      className="hover:bg-slate-100 active:scale-[0.98]"
                    >
                      {userRole === "admin" ? t("Open Admin Console", lang) : t("Open Therapist Dashboard", lang)}
                    </button>
                    {/* Support shortcut for admin/therapist or support team (support desk) */}
                    {(userRole === "admin" || isSupportTeam) && (
                      <button
                        onClick={() => setSubscreen("support")}
                        style={{
                          background: "rgba(255, 255, 255, 0.15)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 12,
                          padding: "11px 14px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                        className="hover:bg-white/20 active:scale-[0.98]"
                        title="Support Desk"
                      >
                        <MessageSquare size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Unified Consolidated Editing Flow */}
        {editing && (
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <Card style={{ padding: 18, border: `1px dashed ${colors.amber}60`, background: `${colors.amberSoft}10` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.amber, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 14 }}>
                {t("Edit Profile Information", lang)}
              </div>
              
              <TextField
                label={t("Full name", lang)}
                value={draft.name}
                onChange={(v) => setDraft({ ...draft, name: v })}
                icon={User}
              />
              <TextField
                label={t("Phone number", lang)}
                value={draft.phone}
                onChange={(v) => setDraft({ ...draft, phone: v })}
                icon={Phone}
              />
              <TextField
                label={t("Email address", lang)}
                value={draft.email}
                onChange={(v) => setDraft({ ...draft, email: v })}
                icon={Mail}
              />
              
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <Button
                  onClick={() => {
                    setClientProfile(draft);
                    setEditing(false);
                  }}
                  style={{ flex: 1 }}
                >
                  {t("Save Changes", lang)}
                </Button>
                <Button
                  onClick={() => setEditing(false)}
                  variant="ghost"
                  style={{ flex: 1, border: `1px solid ${colors.line}` }}
                >
                  {t("Cancel", lang)}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Premium Firebase Auth & Account State Card */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontSize: 11.5,
            fontWeight: 800,
            color: colors.inkSoft,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            paddingLeft: 12,
            marginBottom: 6,
          }}>
            {t("Cloud Sync & Account", lang)}
          </div>
          
          <Card style={{ padding: 16 }}>
            {currentUser ? (
              // Logged In state UI
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: userRole === "admin" ? colors.amberSoft : userRole === "therapist" ? colors.acaciaSoft : colors.indigoSoft,
                    color: userRole === "admin" ? colors.amber : userRole === "therapist" ? colors.acacia : colors.indigo,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                  }}>
                    {userRole === "admin" ? "AD" : userRole === "therapist" ? "TH" : "CL"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: colors.ink, display: "flex", alignItems: "center", gap: 6 }}>
                      {currentUser.displayName || clientProfile.name || "Barbaar User"}
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: userRole === "admin" ? colors.amberSoft : userRole === "therapist" ? colors.acaciaSoft : colors.indigoSoft,
                        color: userRole === "admin" ? colors.amber : userRole === "therapist" ? colors.acacia : colors.indigo,
                      }}>
                        {userRole === "admin" ? "Admin" : userRole === "therapist" ? "Specialist" : "Client"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: colors.inkSoft, marginTop: 1 }}>
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: `${colors.line}25`, margin: "4px 0" }} />

                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px", color: "#137333", background: "#e6f4ea", padding: "10px 12px", borderRadius: 10 }}>
                  <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>{t("Connected to Cloud Database", lang)}</strong>
                    <div style={{ fontSize: "11px", color: "#13733390", marginTop: 1 }}>
                      {t("Bookings and chats are secured in real-time.", lang)}
                    </div>
                  </div>
                </div>

                <Button
                  variant="danger"
                  full
                  onClick={onSignOut}
                  style={{ marginTop: 4, height: 38, fontSize: "13px" }}
                  icon={LogOut}
                >
                  {t("Sign Out Account", lang)}
                </Button>
              </div>
            ) : (
              // Logged Out state UI (Google Sign-In)
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: "12.5px", color: colors.inkSoft, lineHeight: 1.45 }}>
                  {t("Sign in with your Google account to instantly secure your session calendar, join video consultations, and access direct therapist chat channels.", lang)}
                </p>

                {authError && (
                  <div style={{ display: "flex", gap: 8, background: `${colors.danger}10`, border: `1.5px solid ${colors.danger}30`, padding: 10, borderRadius: 10, fontSize: "11.5px", color: colors.danger, lineHeight: 1.4 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>{authError}</div>
                  </div>
                )}

                {/* Primary Google Sign-In Button with 4-color Google G icon */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", width: "100%", marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    style={{
                      width: "100%",
                      minHeight: "48px",
                      padding: "0 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      backgroundColor: "#ffffff",
                      color: "#1f1f1f",
                      border: `1.5px solid ${colors.line}`,
                      borderRadius: "24px",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: authLoading ? "wait" : "pointer",
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
                      transition: "all 0.18s ease",
                      opacity: authLoading ? 0.8 : 1,
                    }}
                    className="hover:bg-slate-50 active:scale-[0.98]"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>{authLoading ? t("Opening Google Sign-In...", lang) : t("Sign in with Google", lang)}</span>
                  </button>

                  <div className="w-full flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Or Instant Sign-In</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => handlePresetLogin("user@barbaar.org")}
                      disabled={authLoading}
                      className="py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <UserCheck size={14} /> Client Sign-In
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetLogin("sagal.nur@barbaar.com")}
                      disabled={authLoading}
                      className="py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <UserCheck size={14} /> Specialist Sign-In
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnonymousSignIn}
                    disabled={authLoading}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    Quick Guest Session Access
                  </button>

                  <div 
                    id="google-gsi-inline-button" 
                    style={{ 
                      width: "100%", 
                      display: "flex", 
                      justifyContent: "center",
                    }}
                  />

                  <div style={{ fontSize: "11px", color: colors.inkSoft, textAlign: "center", lineHeight: 1.35, marginTop: 2 }}>
                    {t("Click above to select your Google email account in the pop-up window.", lang)}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Group: Language Preferences Toggle */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontSize: 11.5,
            fontWeight: 800,
            color: colors.inkSoft,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            paddingLeft: 12,
            marginBottom: 6,
          }}>
            {t("Preferences & Language", lang)}
          </div>
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: colors.indigoSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Globe size={16} color={colors.indigo} />
                </div>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 600, color: colors.ink }}>
                    {t("Language", lang)}
                  </div>
                  <div style={{ fontSize: "11px", color: colors.inkSoft, marginTop: 1 }}>
                    {t("Choose your preferred language", lang)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", background: colors.indigoSoft, borderRadius: 10, padding: 3, gap: 2 }}>
                <button
                  onClick={() => setClientProfile({ ...clientProfile, language: "en" })}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: lang === "en" ? colors.paper : "transparent",
                    color: lang === "en" ? colors.indigo : colors.inkSoft,
                    boxShadow: lang === "en" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  English
                </button>
                <button
                  onClick={() => setClientProfile({ ...clientProfile, language: "so" })}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: lang === "so" ? colors.paper : "transparent",
                    color: lang === "so" ? colors.indigo : colors.inkSoft,
                    boxShadow: lang === "so" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  Soomaali
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Reorganized Clean Groups */}
        
        {/* Group 1: Care & Community */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontSize: 11.5,
            fontWeight: 800,
            color: colors.inkSoft,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            paddingLeft: 12,
            marginBottom: 6,
          }}>
            {t("Care & Community", lang)}
          </div>
          <Card style={{ padding: 4, display: "flex", flexDirection: "column", gap: 2 }}>
            <SettingsRow 
              icon={Gift} 
              label={t("Invite & Earn", lang)} 
              sublabel={t("Share Barbaar with friends to receive free session credits", lang)} 
              onClick={() => setSubscreen("invite")} 
            />
            <div style={{ height: 1, background: `${colors.line}30`, margin: "0 12px" }} />
            <SettingsRow 
              icon={Bell} 
              label={t("Notifications", lang)} 
              sublabel={t("Manage SMS, email, and reminder alerts", lang)} 
              onClick={() => setSubscreen("notifications")} 
            />
            <div style={{ height: 1, background: `${colors.line}30`, margin: "0 12px" }} />
            <SettingsRow 
              icon={Download} 
              label={lang === "so" ? "Soolayso Barnaamijka Android" : "Download Android App"} 
              sublabel={lang === "so" ? "Hel feylka APK ee Barbaar Wellness" : "Get the official Barbaar Wellness APK file"} 
              onClick={() => onOpen("download")} 
            />
          </Card>
        </div>

        {/* Group 1.5: Help & Support */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontSize: 11.5,
            fontWeight: 800,
            color: colors.inkSoft,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            paddingLeft: 12,
            marginBottom: 6,
          }}>
            {t("Help & Support", lang)}
          </div>
          <Card style={{ padding: 4, display: "flex", flexDirection: "column", gap: 2 }}>
            <SettingsRow 
              icon={MessageSquare} 
              label={lang === "so" ? "Wadahadalka Caawinaada" : "Support Chat"} 
              sublabel={lang === "so" ? "La hadal kooxda caawinaada Barbaar toos ah" : "Chat with the Barbaar support team in real-time"} 
              onClick={() => setSubscreen("support")} 
            />
          </Card>
        </div>

        {/* Group 2: Information & Trust */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontSize: 11.5,
            fontWeight: 800,
            color: colors.inkSoft,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            paddingLeft: 12,
            marginBottom: 6,
          }}>
            {t("Information & Trust", lang)}
          </div>
          <Card style={{ padding: 4, display: "flex", flexDirection: "column", gap: 2 }}>
            <SettingsRow icon={Info} label={t("About Barbaar Wellness", lang)} onClick={() => onOpen("about")} />
            <div style={{ height: 1, background: `${colors.line}30`, margin: "0 12px" }} />
            <SettingsRow icon={FileText} label={t("Terms of Service", lang)} onClick={() => onOpen("terms")} />
            <div style={{ height: 1, background: `${colors.line}30`, margin: "0 12px" }} />
            <SettingsRow icon={Shield} label={t("Privacy Policy", lang)} onClick={() => onOpen("privacy")} />
          </Card>
        </div>

        {/* Group 3: Account Portals */}
        {(userRole === "admin" || userRole === "therapist") && (
          <div>
            <div style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              paddingLeft: 12,
              marginBottom: 6,
            }}>
              {t("For Specialists & Admin", lang)}
            </div>
            <Card style={{ padding: 4, display: "flex", flexDirection: "column", gap: 2 }}>
              {userRole === "therapist" && (
                <SettingsRow
                  icon={LayoutDashboard}
                  label={t("Therapist Dashboard", lang)}
                  sublabel={t("Access specialist clinical calendars and client messages", lang)}
                  onClick={() => {
                    if (userRole === "therapist") {
                      onTherapistLogin();
                    } else {
                      setRestrictionMsg("Access Restricted: This dashboard is reserved for authorized Clinical Specialists. Please log in with a therapist Gmail account (e.g. sagal.nur@barbaar.com) under the Cloud Sync card above.");
                      window.scrollTo(0, 0);
                    }
                  }}
                />
              )}
              {userRole === "admin" && (
                <SettingsRow
                  icon={ClipboardList}
                  label={t("Admin Console", lang)}
                  sublabel={t("Nurture overall platform directories and content blocks", lang)}
                  onClick={() => {
                    if (userRole === "admin") {
                      onAdminLogin();
                    } else {
                      setRestrictionMsg("Access Restricted: This console is reserved for Platform Administrators. Please log in with your authorized admin Gmail (barbaaryp@gmail.com) under the Cloud Sync card above.");
                      window.scrollTo(0, 0);
                    }
                  }}
                />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
