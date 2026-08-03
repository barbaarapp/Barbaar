/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Download, CheckCircle, ArrowLeft, Shield, Sparkles, ExternalLink, QrCode, Copy, Check } from "lucide-react";
import { colors } from "../../constants";
import Wordmark from "../ui/Wordmark";

interface DownloadScreenProps {
  onBack: () => void;
  lang?: "en" | "so";
}

// Direct uncompressed APK download URL served from Cloudflare Pages public directory
const DEFAULT_APK_URL = "/Barbaar-Wellness-APK.apk";

export default function DownloadScreen({ onBack, lang = "en" }: DownloadScreenProps) {
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const downloadUrl = ((import.meta as any).env?.VITE_APK_DOWNLOAD_URL as string) || DEFAULT_APK_URL;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/download` : "https://app.barbaar.org/download";

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert(lang === "so" 
        ? "Si aad Barbaar u shubato: Taabo Menu-ga Chrome (⋮) ka dibna dooro 'Add to Home Screen' ama 'Install App'."
        : "To install Barbaar Wellness: Tap Chrome Menu (⋮) and select 'Add to Home Screen' or 'Install App'."
      );
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white rounded-full border border-gray-200 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{lang === "so" ? "Kugudub" : "Back"}</span>
        </button>
        <Wordmark size={18} />
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#1b2b24] to-[#2c3e35] rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#c8a97e]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#e6cca0] text-xs font-semibold tracking-wide backdrop-blur-md border border-white/10">
              <Sparkles size={14} />
              <span>{lang === "so" ? "Barnaamijka Android" : "Official Android App"}</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-serif font-bold text-white tracking-tight">
              {lang === "so" ? "Soolayso Barbaar Wellness" : "Download Barbaar Wellness"}
            </h1>

            <p className="text-sm md:text-base text-gray-200 font-light leading-relaxed max-w-xl">
              {lang === "so"
                ? "Barnaamijka rasmiga ah ee Android si aad si toos ah uga hesho talobixinta maskaxda, ballamaha, iyo farriimaha gaarka ah."
                : "Experience seamless, private mental health support and counseling directly on your Android smartphone."}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={handleInstallPWA}
                className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 text-base"
              >
                <Sparkles size={20} />
                <span>{lang === "so" ? "RAKIB APP-KA (0-Parse Error)" : "INSTALL APP ON PHONE (0-Parse Error)"}</span>
              </button>

              <a
                href={downloadUrl}
                download="Barbaar-Wellness-APK.apk"
                className="inline-flex items-center gap-2 px-6 py-4 bg-[#c8a97e] hover:bg-[#d8b98e] text-[#1b2b24] font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
              >
                <Download size={18} />
                <span>{lang === "so" ? "Soolayso APK" : "Download APK"}</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/15 text-xs font-semibold transition-all cursor-pointer"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                <span>{copied ? (lang === "so" ? "Laga guuriyay!" : "Link Copied!") : (lang === "so" ? "Guuri Link-ga" : "Share Link")}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center min-w-[180px]">
            <div className="w-16 h-16 bg-[#c8a97e]/20 rounded-2xl flex items-center justify-center text-[#c8a97e] mb-3">
              <img src="/barbaar_icon.svg" alt="Barbaar" className="w-10 h-10 object-contain rounded-xl shadow-sm" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Android APK</span>
            <span className="text-xs text-gray-300 mt-1">Requires Android 8.0+</span>
            <span className="text-[11px] text-[#e6cca0] font-mono mt-1">Free & Secure</span>
          </div>
        </div>
      </div>

      {/* Direct APK Notice Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 text-emerald-900">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
            ✓
          </div>
          <div className="space-y-1.5 text-xs md:text-sm">
            <h3 className="font-bold text-emerald-950 text-sm md:text-base">
              {lang === "so" ? "Direct 1-Tap APK Installation Active!" : "Direct 1-Tap APK Installation Ready"}
            </h3>
            <p className="leading-relaxed text-emerald-800">
              {lang === "so"
                ? "Feylka Android APK-ga ah si toos ah ayaa looga soolaysanayaa app.barbaar.org. Markaad taabato 'Soolayso Android APK', feylka Barbaar-Wellness-APK.apk si toos ah ayuu ugu shubmayaa mobilkaaga."
                : "The Android APK is hosted directly on app.barbaar.org. Tapping 'Download Android APK' will directly download and prompt 1-tap installation on your device."}
            </p>
          </div>
        </div>
      </div>

      {/* App Not Installed / Parse Error Fix Box */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 mb-8 text-amber-950 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-950 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 text-base">
            !
          </div>
          <div className="space-y-2 text-xs md:text-sm flex-1">
            <h3 className="font-bold text-amber-950 text-sm md:text-base flex items-center justify-between">
              <span>{lang === "so" ? "Ma lagu yiri 'Problem Parsing Package' ama 'App Not Installed'?" : "Getting 'Problem Parsing the Package' or 'App Not Installed'?"}</span>
            </h3>
            <p className="leading-relaxed text-amber-900 font-medium">
              {lang === "so"
                ? "Bilaash ku shubo app-ka tooska ah adoon u baahnayn feylka APK-ga (0-Parse Error):"
                : "To install Barbaar Wellness on Android without any package parsing error:"}
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-900 font-semibold pt-1">
              <li className="bg-white/60 p-2 rounded-lg border border-amber-200">
                {lang === "so" ? "1. Fur Chrome ama Samsung Internet taleefankaaga Android." : "1. Open Chrome or Samsung Internet on your Android device."}
              </li>
              <li className="bg-white/60 p-2 rounded-lg border border-amber-200">
                {lang === "so" ? "2. Taabo Menu-ga Chrome (saddexda dhibcood ⋮) oo ka dooro 'Add to Home Screen' ama 'Install App'." : "2. Tap Chrome Menu (⋮) and select 'Add to Home Screen' or 'Install App'."}
              </li>
              <li className="bg-white/60 p-2 rounded-lg border border-amber-200">
                {lang === "so" ? "3. App-ka Barbaar si toos ah ayuu ugu shubmayaa mobilkaaga — shaqaynaya oo leh kamarad iyo mikrofoon!" : "3. Barbaar Wellness installs directly on your launcher as an App with zero parse errors!"}
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm mb-8">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Shield size={20} className="text-[#384c43]" />
          <span>{lang === "so" ? "Tallaabooyinka Loo Shubo (Installation Steps)" : "How to Install on Android"}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-[#fbf9f5] border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#384c43] text-white flex items-center justify-center font-bold text-sm mb-3">
              1
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">
              {lang === "so" ? "Soolayso Barnaamijka" : "1. Download File"}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {lang === "so"
                ? "Taabo 'Soolayso Android APK' si aad u soo dejiso feylka Barbaar.apk."
                : "Tap the Download APK button above to save Barbaar.apk to your phone downloads."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#fbf9f5] border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#384c43] text-white flex items-center justify-center font-bold text-sm mb-3">
              2
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">
              {lang === "so" ? "U Ogolow Shubista" : "2. Allow Installation"}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {lang === "so"
                ? "Hadii uu ku weydiiyo, ka ogolow browser-kaaga 'Install unknown apps' (Shubista barnaamijyada dibadda)."
                : "If prompted by Android security, toggle 'Allow from this source' for Chrome/Browser."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#fbf9f5] border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#384c43] text-white flex items-center justify-center font-bold text-sm mb-3">
              3
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">
              {lang === "so" ? "Fur oo Isticmaal" : "3. Open & Enjoy"}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {lang === "so"
                ? "Taabo 'Install', ka dibna fur barnaamijka si aad u bilowdo isticmaalka Barbaar Wellness."
                : "Tap Install, launch Barbaar Wellness from your home screen, and access your sessions!"}
            </p>
          </div>
        </div>
      </div>

      {/* Cloudflare Storage & Hosting Guide */}
      <div className="bg-[#f2efe9] rounded-2xl p-6 border border-gray-200">
        <h3 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
          <ExternalLink size={16} className="text-[#384c43]" />
          <span>Cloudflare Storage Link Active (`app.barbaar.org/download`)</span>
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          Your direct download package is hosted on Cloudflare Storage at <code className="bg-white px-1.5 py-0.5 rounded text-gray-800 font-mono">download.barbaar.org</code> and linked directly from <code className="bg-white px-1.5 py-0.5 rounded text-gray-800 font-mono">app.barbaar.org/download</code>.
        </p>
      </div>
    </div>
  );
}
