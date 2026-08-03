/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface AppDownloadBannerProps {
  onOpenDownload: () => void;
  lang?: "en" | "so";
}

const DEFAULT_APK_URL = "https://app.barbaar.org/Barbaar-Wellness-APK.apk";

export default function AppDownloadBanner({ onOpenDownload, lang = "en" }: AppDownloadBannerProps) {
  const [dismissed, setDismissed] = useState<boolean>(true);
  const downloadUrl = ((import.meta as any).env?.VITE_APK_DOWNLOAD_URL as string) || DEFAULT_APK_URL;

  useEffect(() => {
    // Hide inside native Capacitor Android app
    const isNative = typeof window !== "undefined" && (
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      window.location.protocol === "file:" ||
      window.navigator.userAgent.includes("Capacitor")
    );

    if (isNative) {
      setDismissed(true);
      return;
    }

    const isDismissed = sessionStorage.getItem("barbaar_app_banner_dismissed");
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("barbaar_app_banner_dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#1b2b24] via-[#283e34] to-[#1b2b24] text-white px-4 py-3 relative shadow-md z-40 border-b border-[#c8a97e]/20">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <img
            src="/barbaar_icon.svg"
            alt="Barbaar Wellness"
            className="w-9 h-9 rounded-xl object-cover border border-[#c8a97e]/30 shadow-sm flex-shrink-0"
          />
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-xs sm:text-sm text-white">
                {lang === "so" ? "Barbaar Native React Native App" : "Official React Native Android App"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#c8a97e] text-[#1b2b24] text-[10px] font-extrabold uppercase tracking-wider">
                v2.0 Native
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-200 mt-0.5">
              {lang === "so"
                ? "Barnaamijka cusub ee React Native oo wata WebRTC hardware iyo privacy SHIELD!"
                : "New React Native engine with hardware camera/mic stream & FLAG_SECURE privacy protection!"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Auto-Download link */}
          <a
            href="/barbaar-wellness-native.apk"
            download="barbaar-wellness-native.apk"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c8a97e] hover:bg-[#d8b98e] text-[#1b2b24] font-bold rounded-xl text-xs shadow transition-all cursor-pointer whitespace-nowrap"
          >
            <Download size={14} />
            <span>{lang === "so" ? "Soolayso Native APK" : "Download Native APK"}</span>
          </a>

          {/* Optional link for help/troubleshoot if user needed guide */}
          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="text-[11px] text-[#e6cca0] hover:underline px-2 py-1 underline-offset-2 cursor-pointer"
            >
              {lang === "so" ? "Caawimo" : "Help?"}
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
