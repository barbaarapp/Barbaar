/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Stethoscope,
  Crown
} from "lucide-react";
import { colors } from "../../constants";
import { translateText as t, Language } from "../../utils/translations";
import { motion, AnimatePresence } from "motion/react";
import { 
  auth, 
  signInWithPopup, 
  googleProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "../../lib/firebase";
import config from "../../../firebase-applet-config.json";
import Wordmark from "../ui/Wordmark";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onTherapistLogin?: () => void;
  onAdminLogin?: () => void;
  initialRole?: "client" | "therapist" | "admin";
  onSuccess?: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  lang = "en",
  onTherapistLogin,
  onAdminLogin,
  initialRole = "client",
  onSuccess,
}: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<"client" | "therapist" | "admin">(initialRole);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg(lang === "so" ? "Fadlan buuxi email-ka iyo furaha sirta ah." : "Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg(lang === "so" ? "Koontadaada si guul leh ayaa loo sameeyay!" : "Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg(lang === "so" ? "Si guul leh ayaad u soo gashay!" : "Signed in successfully!");
      }

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = lang === "so" ? "Email-ka ama furaha sirta ah ma saxna." : "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = lang === "so" ? "Email-kan horey ayaa loo isticmaalay." : "This email is already registered. Please sign in.";
      } else if (err.code === "auth/weak-password") {
        msg = lang === "so" ? "Furaha sirta ahi waa inuu ka koobnaadaa ugu yaraan 6 xaraf." : "Password must be at least 6 characters.";
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setErrorMsg("");
    try {
      const googleObj = (window as any).google;
      const oAuthClientId = (config as any).oAuthClientId || (config as any).client_id;
      if (googleObj?.accounts?.id && oAuthClientId) {
        await new Promise<void>((resolve, reject) => {
          googleObj.accounts.id.initialize({
            client_id: oAuthClientId,
            callback: async (response: any) => {
              try {
                const credential = GoogleAuthProvider.credential(response.credential);
                await signInWithCredential(auth, credential);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
          });
          googleObj.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              signInWithPopup(auth, googleProvider).then(() => resolve()).catch(reject);
            }
          });
        });
      } else {
        await signInWithPopup(auth, googleProvider);
      }
      setSuccessMsg(lang === "so" ? "Si guul leh ayaad u soo gashay!" : "Signed in with Google!");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 400);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setErrorMsg(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Header with deep forest accent */}
        <div 
          className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-stone-100"
          style={{ background: "#faf9f6" }}
        >
          <Wordmark size={17} />
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-200/60 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers: Client | Therapist | Admin */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex bg-stone-100/80 p-1 rounded-2xl">
            <button
              onClick={() => { setActiveTab("client"); setErrorMsg(""); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "client" 
                  ? "bg-white text-[#1a2f25] shadow-xs" 
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <UserIcon size={14} />
              <span>{lang === "so" ? "Bukaanka" : "Patient"}</span>
            </button>
            <button
              onClick={() => { setActiveTab("therapist"); setErrorMsg(""); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "therapist" 
                  ? "bg-white text-[#1a2f25] shadow-xs" 
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Stethoscope size={14} />
              <span>{lang === "so" ? "Dhakhtarka" : "Therapist"}</span>
            </button>
            <button
              onClick={() => { setActiveTab("admin"); setErrorMsg(""); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "admin" 
                  ? "bg-white text-[#1a2f25] shadow-xs" 
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Crown size={14} />
              <span>{lang === "so" ? "Maamulka" : "Admin"}</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === "client" && (
            <div>
              <div className="text-center mb-6">
                <h3 className="font-display text-xl font-bold text-[#1a2f25]">
                  {isSignUp 
                    ? (lang === "so" ? "Sameyso Koonto Cusub" : "Create your Barbaar Account") 
                    : (lang === "so" ? "Kusoo Dhawoow Barbaar" : "Welcome back to Barbaar")}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {lang === "so" 
                    ? "Gal koontadaada si aad u maamusho kulamadaada iyo farriimahaaga." 
                    : "Access your scheduled sessions, private messages, and health records."}
                </p>
              </div>

              {/* Google Sign In Quick Action */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer mb-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{lang === "so" ? "Kula gal Google" : "Continue with Google"}</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-stone-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  {lang === "so" ? "AMA EMAIL" : "OR EMAIL"}
                </span>
              </div>

              {/* Email + Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {lang === "so" ? "Cinwaanka Email-ka" : "Email Address"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#284136] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {lang === "so" ? "Furaha Sirta ah (Password)" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#284136] focus:border-transparent"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#284136] hover:bg-[#1f342b] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>{lang === "so" ? "Fadlan sug..." : "Processing..."}</span>
                  ) : (
                    <>
                      <span>{isSignUp ? (lang === "so" ? "Diiwaangeli Koonto" : "Create Account") : (lang === "so" ? "Gal Koontada" : "Sign In")}</span>
                      <LogIn size={15} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); }}
                  className="text-xs font-bold text-[#284136] hover:underline cursor-pointer"
                >
                  {isSignUp 
                    ? (lang === "so" ? "Ma leedahay koonto? Gal Hadda" : "Already have an account? Sign In") 
                    : (lang === "so" ? "Ma cusub tahay? Sameyso koonto" : "New to Barbaar? Create Account")}
                </button>
              </div>
            </div>
          )}

          {activeTab === "therapist" && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-[#eaf2ec] text-[#284136] flex items-center justify-center mx-auto mb-3">
                <Stethoscope size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-[#1a2f25]">
                {lang === "so" ? "Albaabka Dhakhaatiirta" : "Therapist Portal Access"}
              </h3>
              <p className="text-xs text-stone-500 mt-1.5 max-w-xs mx-auto">
                {lang === "so"
                  ? "Maamul ballamadaada, bukaankaaga, iyo wada-hadallada tooska ah."
                  : "Manage patient appointments, video consultations, and clinical availability."}
              </p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    onTherapistLogin?.();
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-[#284136] hover:bg-[#1f342b] text-white font-bold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{lang === "so" ? "Fur Albaabka Dhakhtarka" : "Enter Specialist Dashboard"}</span>
                  <Stethoscope size={15} />
                </button>
              </div>
            </div>
          )}

          {activeTab === "admin" && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-3">
                <Crown size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-[#1a2f25]">
                {lang === "so" ? "Albaabka Maamulka Guud" : "Executive Admin Portal"}
              </h3>
              <p className="text-xs text-stone-500 mt-1.5 max-w-xs mx-auto">
                {lang === "so"
                  ? "Daawo dhammaan ballamada, codsiyada gargaarka maaliyadeed, iyo maamulka guud."
                  : "Review global bookings, manage financial aid requests, and oversee platform operations."}
              </p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    onAdminLogin?.();
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-[#1a2f25] hover:bg-black text-white font-bold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{lang === "so" ? "Fur Xafiiska Maamulka" : "Enter Admin Management"}</span>
                  <Crown size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security assurance tag */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-center gap-2 text-[11px] text-stone-500 font-medium">
          <ShieldCheck size={14} className="text-[#4e8a5b]" />
          <span>{lang === "so" ? "100% Ammaan & Xog-dhawr Caafimaad" : "100% Encrypted & Confidential Clinical Platform"}</span>
        </div>
      </motion.div>
    </div>
  );
}
