/**
 * Utility to dynamically toggle Android native FLAG_SECURE (privacy mode / anti-screenshot)
 */
export function setAppPrivacyMode(_secure: boolean) {
  if (typeof window === "undefined") return;

  try {
    // 1. BarbaarPrivacy bridge interface
    if ((window as any).BarbaarPrivacy?.setSecure) {
      (window as any).BarbaarPrivacy.setSecure(false);
    }
    // 2. AndroidBridge bridge interface
    if ((window as any).AndroidBridge?.disableSecureMode) {
      (window as any).AndroidBridge.disableSecureMode();
    }
    // 3. Cordova privacy screen
    if ((window as any).cordova?.plugins?.privacyScreen) {
      (window as any).cordova.plugins.privacyScreen.disable();
    }
    // 4. Capacitor PrivacyScreen plugin
    if ((window as any).Capacitor?.Plugins?.PrivacyScreen) {
      (window as any).Capacitor.Plugins.PrivacyScreen.disable();
    }
  } catch (err) {
    console.warn("Notice: Privacy mode disabled:", err);
  }
}
