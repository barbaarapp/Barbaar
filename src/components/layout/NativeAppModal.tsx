import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, ShieldCheck, Video, Lock, Smartphone, Check, Copy, ExternalLink, X, Sparkles } from "lucide-react";
import { Language } from "../../utils/translations";

interface NativeAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

export default function NativeAppModal({ isOpen, onClose, lang = "en" }: NativeAppModalProps) {
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
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
    }
  };

  const apkUrl = "/Barbaar-Wellness-APK.apk";
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}/Barbaar-Wellness-APK.apk` : "https://app.barbaar.org/Barbaar-Wellness-APK.apk";

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#111f18] text-white rounded-3xl border border-[#c8a97e]/40 shadow-2xl overflow-hidden"
        >
          {/* Header Banner */}
          <div className="relative p-6 pb-5 bg-gradient-to-r from-[#1b2b24] via-[#24382f] to-[#1b2b24] border-b border-[#c8a97e]/20">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#c8a97e] text-[#1b2b24] text-[11px] font-black uppercase tracking-wider">
                <Sparkles size={12} />
                {lang === "so" ? "Barbaar Native App v2.0" : "Official Native App v2.0"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Smartphone className="text-[#c8a97e]" size={24} />
              {lang === "so"
                ? "Soolayso App-ka Cusub ee Android-ka"
                : "Install Official Barbaar Android App"}
            </h2>

            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              {lang === "so"
                ? "Barnaamijka rasmiga ah ee taleefannada Android oo leh xawaare sare iyo dhawridda xogta caafimaadka."
                : "Experience zero latency video therapy with OS-level privacy protection & hardware stream speed."}
            </p>
          </div>

          {/* Core Native Features */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#1b2b24]/80 border border-[#c8a97e]/20 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#c8a97e]/10 text-[#c8a97e] shrink-0">
                  <Video size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Native Hardware WebRTC</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    {lang === "so" ? "Kamarad iyo mikrofoon toos u shaqaynaya" : "Direct hardware camera & mic access without web lag"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1b2b24]/80 border border-[#c8a97e]/20 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">OS Privacy Shield</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    {lang === "so" ? "Waa ka mamnuuc sawir-qadista (FLAG_SECURE)" : "Native FLAG_SECURE prevents screenshots & recordings"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1b2b24]/80 border border-[#c8a97e]/20 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Faith & Cultural Care</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    {lang === "so" ? "Su'aalo-isweydiin Af-Somali iyo Diini ah" : "Integrated Somali language & Islamic counseling quiz"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1b2b24]/80 border border-[#c8a97e]/20 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Offline Persistence</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    {lang === "so" ? "Diiwaanka casharrada iyo profile-ka oo baaqi ah" : "Encrypted local vault for profiles & appointments"}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="pt-2 space-y-2.5">
              {/* PWA Direct Installation Button (0-Parse-Error Guaranteed) */}
              <button
                onClick={handleInstallPWA}
                className="w-full py-3.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm sm:text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98"
              >
                <Smartphone size={20} />
                <span>
                  {deferredPrompt
                    ? (lang === "so" ? "RAKIB APP-KA TALEEFANKA (1-Click Install)" : "INSTALL APP ON PHONE (1-Click)")
                    : (lang === "so" ? "KUGU DAR HOME SCREEN (Add to Home Screen)" : "ADD TO HOME SCREEN (Instant App)")}
                </span>
              </button>

              <a
                href={apkUrl}
                download="Barbaar-Wellness-APK.apk"
                className="w-full py-3 px-4 bg-gradient-to-r from-[#c8a97e] to-[#d8b98e] hover:from-[#d8b98e] hover:to-[#e8c99e] text-[#1b2b24] font-black rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download size={18} />
                <span>
                  {lang === "so" ? "SOO DEGSO APK (Direct APK Download)" : "DOWNLOAD NATIVE APK DIRECTLY"}
                </span>
              </a>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-2.5 px-4 bg-[#1b2b24] hover:bg-[#24382f] text-gray-200 hover:text-white font-bold rounded-xl text-xs border border-[#c8a97e]/30 flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  <span>{copied ? (lang === "so" ? "Waa la koobiyey!" : "Copied URL!") : (lang === "so" ? "Koobiyey Link-ga" : "Copy APK Link")}</span>
                </button>

                <a
                  href="/download"
                  className="py-2.5 px-4 bg-[#1b2b24] hover:bg-[#24382f] text-gray-200 hover:text-white font-bold rounded-xl text-xs border border-[#c8a97e]/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={15} />
                  <span>{lang === "so" ? "Hagaha" : "Install Guide"}</span>
                </a>
              </div>
            </div>

            {/* Simple Step Guide & Parse Error Fix */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-gray-300 space-y-1.5">
              <p className="font-bold text-[#c8a97e] flex items-center justify-between">
                <span>{lang === "so" ? "Sida ugu fudud (No Parse Error):" : "Recommended Installation (Fix Parse Errors):"}</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-300">
                <li>{lang === "so" ? 'Taabo badhanka cagaaran "INSTALL APP ON PHONE" ama taabo Chrome Menu (⋮) -> "Add to Home Screen".' : 'Tap the green "INSTALL APP ON PHONE" button above, or tap Chrome Menu (⋮) -> "Add to Home Screen".'}</li>
                <li>{lang === "so" ? 'App-ka Barbaar si toos ah ayuu ugu shubmayaa taleefankaaga adoo san u baahnayn APK parser!' : 'App installs natively on your home screen instantly with full camera & mic access — zero parse errors!'}</li>
              </ol>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-[#1b2b24]/50 border-t border-[#c8a97e]/20 flex justify-between items-center">
            <span className="text-[10px] text-gray-400">
              Barbaar Mobile Android Native · org.barbaar.wellness
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#1b2b24] hover:bg-[#24382f] text-gray-300 hover:text-white text-xs font-semibold rounded-lg border border-gray-700 transition-colors"
            >
              {lang === "so" ? "Sii wad shabakadda" : "Continue on Web"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
