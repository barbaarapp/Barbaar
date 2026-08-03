# Barbaar Wellness - Native React Native Application

This directory contains the standalone, high-performance React Native (Expo) application for **Barbaar Wellness**.

## Key Architecture & Features

1. **Native Hardware WebRTC Stream Stage (`ConsultationRoom.native.tsx`)**:
   - Uses `@react-native-webrtc/react-native-webrtc`'s `<RTCView streamURL={...}/>` to directly capture and render camera/mic feeds on Android & iOS hardware without web layer overhead.
2. **OS-Level Screen Privacy Safeguards (`FLAG_SECURE`)**:
   - Enforces `preventScreenCaptureAsync()` and screenshot event listeners via `expo-screen-capture` when entering the clinical Consultation Room.
3. **Hardware Permissions**:
   - Pre-configured `app.json` declares native Android OS permissions: `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `INTERNET`, `ACCESS_NETWORK_STATE`.
4. **Persistent Session & User Auth**:
   - Uses `@react-native-async-storage/async-storage` to preserve user profiles, language preferences, and active booking sessions across app launches.

---

## How to Run & Build Native Binary

### 1. Run Locally with Expo Go / Development Client
```bash
cd BarbaarMobile
npm install
npx expo start
```

### 2. Generate Standalone Android Preview Binary (.apk)
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Trigger cloud build for Android APK
eas build --platform android --profile preview
```
This produces a downloadable standalone `.apk` ready for direct installation on Android devices or distribution via Google Play Console!
