/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  MessageSquare, 
  Edit3, 
  Lock, 
  Send, 
  Trash2, 
  Volume2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Infinity, 
  Zap, 
  MonitorUp, 
  ScreenShare, 
  ScreenShareOff, 
  Maximize2, 
  Minimize2, 
  Download, 
  RotateCcw, 
  Eraser, 
  PenTool, 
  Check, 
  FileText,
  Shield,
  Layers,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Share2,
  Activity,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { Booking } from "../../types";
import { colors } from "../../constants";

// Import Firebase config & Firestore methods
import { db, doc, onSnapshot, setDoc, handleFirestoreError, OperationType, arrayUnion } from "../../lib/firebase";

interface ConsultationRoomProps {
  booking: Booking;
  currentUserRole: "client" | "therapist";
  partnerName: string;
  onClose: () => void;
  onCompleteSession?: () => void;
}

interface ChatMessage {
  sender: "me" | "partner";
  text: string;
  time: string;
}

interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isEraser?: boolean;
}

interface SharedPresentationData {
  type: "screen" | "slide" | "image" | "pdf";
  title?: string;
  imageUrl?: string;
  presenterRole?: "client" | "therapist";
  active: boolean;
  updatedAt?: number;
}

export default function ConsultationRoom({
  booking,
  currentUserRole,
  partnerName,
  onClose,
  onCompleteSession,
}: ConsultationRoomProps) {
  // Local media stream states - default ready instantly
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [hasMediaError, setHasMediaError] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  // Screen Sharing & Presentation states
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [partnerScreenSharing, setPartnerScreenSharing] = useState(false);
  const [isScreenShareModalOpen, setIsScreenShareModalOpen] = useState(false);
  const [sharedPresentation, setSharedPresentation] = useState<SharedPresentationData | null>(null);
  const [isPresentationFullscreen, setIsPresentationFullscreen] = useState(false);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const slideFileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio level indicators (0 - 100)
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);

  // Tab & View Selections
  const [activeTab, setActiveTab] = useState<"chat" | "notes" | "none">("none");
  const [isWhiteboardExpanded, setIsWhiteboardExpanded] = useState(false);
  const [whiteboardSubTab, setWhiteboardSubTab] = useState<"canvas" | "notes">("canvas");

  // Timeless Session Clock (unlimited duration)
  const [elapsed, setElapsed] = useState(0);

  // Synced Chat Log
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Notes/Whiteboard states
  const [sharedNotes, setSharedNotes] = useState("");

  // Canvas drawing reference and tools
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const expandedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const expandedCanvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<"pen" | "eraser">("pen");
  const [brushColor, setBrushColor] = useState<string>("#C88A34");
  const [brushWidth, setBrushWidth] = useState<number>(3);
  const [whiteboardPaths, setWhiteboardPaths] = useState<DrawingPath[]>([]);
  const [currentPathPoints, setCurrentPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [isMiniVideoCollapsed, setIsMiniVideoCollapsed] = useState(false);

  // Partner real-time states
  const [partnerMuted, setPartnerMuted] = useState(false);
  const [partnerCamOff, setPartnerCamOff] = useState(false);

  // WebRTC remote stream states
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const remoteMediaStreamRef = useRef<MediaStream>(new MediaStream());
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Manual reconnect trigger
  const [reconnectCounter, setReconnectCounter] = useState(0);

  // WebRTC session orchestration refs
  const lastGuestReadyAtRef = useRef<number | null>(null);
  const lastProcessedOfferCreatedAtRef = useRef<number | null>(null);

  // Audio analyser contexts
  const localAudioContextRef = useRef<AudioContext | null>(null);
  const remoteAudioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Cross-tab ultra-low-latency channel (0ms latency between tabs in same browser)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Synchronize localStream with localVideoRef when mounted or changed
  useEffect(() => {
    if (localStream && localVideoRef.current && !isCamOff) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCamOff]);

  // Synchronize screen stream with screenVideoRef
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  // Audio unlock helper for mobile/autoplay policies
  const unlockAudio = useCallback(() => {
    setAudioBlocked(false);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1.0;
      remoteVideoRef.current.play()
        .then(() => setAudioBlocked(false))
        .catch((e) => console.warn("Unlock video audio caught:", e));
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play()
        .then(() => setAudioBlocked(false))
        .catch((e) => console.warn("Unlock audio element caught:", e));
    }
    if (localAudioContextRef.current && localAudioContextRef.current.state === "suspended") {
      localAudioContextRef.current.resume().catch(() => {});
    }
    if (remoteAudioContextRef.current && remoteAudioContextRef.current.state === "suspended") {
      remoteAudioContextRef.current.resume().catch(() => {});
    }
  }, []);

  // Synchronize remoteStream with remoteVideoRef and remoteAudioRef
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = 1.0;
        remoteVideoRef.current.play()
          .then(() => setAudioBlocked(false))
          .catch((e) => {
            console.warn("Remote video auto-play blocked by browser:", e);
          });
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play()
          .then(() => setAudioBlocked(false))
          .catch((e) => {
            console.warn("Remote audio auto-play blocked by browser:", e);
          });
      }
    }
  }, [remoteStream]);

  // Global user interaction listener to auto-resume audio if blocked
  useEffect(() => {
    const handleUserInteraction = () => {
      unlockAudio();
    };
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, [unlockAudio]);

  // Audio level monitoring setup using Web Audio API
  useEffect(() => {
    let localAnalyser: AnalyserNode | null = null;
    let remoteAnalyser: AnalyserNode | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (localStream && localStream.getAudioTracks().length > 0) {
          const ctx = new AudioCtx();
          localAudioContextRef.current = ctx;
          const src = ctx.createMediaStreamSource(localStream);
          localAnalyser = ctx.createAnalyser();
          localAnalyser.fftSize = 64;
          src.connect(localAnalyser);
        }

        if (remoteStream && remoteStream.getAudioTracks().length > 0) {
          const ctx = new AudioCtx();
          remoteAudioContextRef.current = ctx;
          const src = ctx.createMediaStreamSource(remoteStream);
          remoteAnalyser = ctx.createAnalyser();
          remoteAnalyser.fftSize = 64;
          src.connect(remoteAnalyser);
        }
      }
    } catch (e) {
      console.warn("AudioContext analyzer setup:", e);
    }

    const localData = new Uint8Array(32);
    const remoteData = new Uint8Array(32);

    const checkAudioLevels = () => {
      if (localAnalyser && !isMuted) {
        localAnalyser.getByteFrequencyData(localData);
        let sum = 0;
        for (let i = 0; i < localData.length; i++) sum += localData[i];
        const avg = sum / localData.length;
        setLocalAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
      } else {
        setLocalAudioLevel(0);
      }

      if (remoteAnalyser && !partnerMuted) {
        remoteAnalyser.getByteFrequencyData(remoteData);
        let sum = 0;
        for (let i = 0; i < remoteData.length; i++) sum += remoteData[i];
        const avg = sum / remoteData.length;
        setRemoteAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
      } else {
        setRemoteAudioLevel(0);
      }

      animFrameRef.current = requestAnimationFrame(checkAudioLevels);
    };

    animFrameRef.current = requestAnimationFrame(checkAudioLevels);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (localAudioContextRef.current) {
        localAudioContextRef.current.close().catch(() => {});
      }
      if (remoteAudioContextRef.current) {
        remoteAudioContextRef.current.close().catch(() => {});
      }
    };
  }, [localStream, remoteStream, isMuted, partnerMuted]);

  // Timeless Meeting Clock: continuous session time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Instant zero-delay media initialization (fast acquisition with immediate fallback)
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initMediaInstantly() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        activeStream = stream;
        setLocalStream(stream);
        setIsCamOff(false);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn("Video+audio initialization fallback, trying audio-only:", err);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          activeStream = audioStream;
          setLocalStream(audioStream);
          setIsCamOff(true);
        } catch (audioErr) {
          console.warn("Microphone & camera both blocked:", audioErr);
          setHasMediaError("Audio & Camera preview ready. Please enable microphone/camera permissions in your browser bar for two-way video.");
        }
      }
    }

    initMediaInstantly();

    // BroadcastChannel for instant 0ms cross-tab signaling & communication
    try {
      if (typeof BroadcastChannel !== "undefined" && booking?.id) {
        const channel = new BroadcastChannel(`consultation_${booking.id}`);
        broadcastChannelRef.current = channel;
        channel.onmessage = (event) => {
          const { type, data, role } = event.data || {};
          if (role !== currentUserRole) {
            if (type === "mediaState") {
              setPartnerMuted(!!data.isMuted);
              setPartnerCamOff(!!data.isCamOff);
              if (data.isScreenSharing !== undefined) {
                setPartnerScreenSharing(!!data.isScreenSharing);
              }
            } else if (type === "presentation") {
              if (data && data.active) {
                setSharedPresentation(data);
              } else {
                setSharedPresentation(null);
              }
            }
          }
        };
        channel.postMessage({ type: "ready", role: currentUserRole });
      }
    } catch (e) {
      console.warn("BroadcastChannel initialization skipped:", e);
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [booking?.id, currentUserRole]);

  // Sync state toggles with physical media tracks and WebRTC senders
  const handleToggleMute = async () => {
    const nextMuted = !isMuted;
    
    if (!localStream || localStream.getAudioTracks().length === 0) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        const newTrack = audioStream.getAudioTracks()[0];
        if (localStream) {
          localStream.addTrack(newTrack);
        } else {
          setLocalStream(audioStream);
        }
        if (pcRef.current) {
          pcRef.current.addTrack(newTrack, localStream || audioStream);
        }
        setIsMuted(false);
        return;
      } catch (e) {
        console.warn("Could not acquire mic track on toggle:", e);
      }
    }

    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = !nextMuted;
        }
      });
    }
    setIsMuted(nextMuted);

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "mediaState",
        role: currentUserRole,
        data: { isMuted: nextMuted, isCamOff, isScreenSharing }
      });
    }
  };

  const handleToggleCam = async () => {
    const nextCamOff = !isCamOff;

    if (!nextCamOff && (!localStream || localStream.getVideoTracks().length === 0)) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        
        if (localStream) {
          localStream.addTrack(videoTrack);
          const updated = new MediaStream(localStream.getTracks());
          setLocalStream(updated);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = updated;
          }
        } else {
          setLocalStream(videoStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = videoStream;
          }
        }

        if (pcRef.current && !isScreenSharing) {
          const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(videoTrack);
          } else {
            pcRef.current.addTrack(videoTrack, localStream || videoStream);
          }
        }
        setIsCamOff(false);
        return;
      } catch (err) {
        console.warn("Could not dynamically acquire webcam:", err);
      }
    }

    if (localStream && localStream.getVideoTracks().length > 0) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !nextCamOff;
      });
    }
    if (pcRef.current && !isScreenSharing) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "video") {
          sender.track.enabled = !nextCamOff;
        }
      });
    }
    setIsCamOff(nextCamOff);

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "mediaState",
        role: currentUserRole,
        data: { isMuted, isCamOff: nextCamOff, isScreenSharing }
      });
    }
  };

  // Screen Sharing & Presentation Toggle Handler
  const handleToggleScreenShare = () => {
    if (isScreenSharing || sharedPresentation?.active) {
      stopScreenShare();
    } else {
      setIsScreenShareModalOpen(true);
    }
  };

  // Launch browser native screen/tab/window picker
  const startNativeScreenShare = async () => {
    // Check if the browser supports getDisplayMedia
    const hasDisplayMedia = typeof navigator !== "undefined" && 
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.getDisplayMedia === "function";

    if (!hasDisplayMedia) {
      setHasMediaError("Live screen recording is not supported in this browser engine. Please use 'Upload Slides or Photo' or open in a full browser tab.");
      return;
    }

    try {
      let displayMediaStream: MediaStream;

      // Request display stream (mobile OS will prompt for full screen/apps like WhatsApp, photos, home screen)
      try {
        displayMediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
      } catch (firstErr: any) {
        if (firstErr.name === "NotAllowedError" || firstErr.name === "PermissionDeniedError") {
          // User intentionally dismissed the OS screen share prompt
          return;
        }
        // Fallback retry with base constraints
        displayMediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
      }

      // If stream was successfully acquired, close modal and attach
      setIsScreenShareModalOpen(false);

      const screenVideoTrack = displayMediaStream.getVideoTracks()[0];
      if (!screenVideoTrack) {
        throw new Error("No video track found from screen capture");
      }

      setScreenStream(displayMediaStream);
      setIsScreenSharing(true);
      setSharedPresentation(null);
      setHasMediaError(null);

      // Connect track directly to screen video element
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayMediaStream;
      }

      // Replace video track in WebRTC peer connection for high-res transmission
      if (pcRef.current) {
        const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
        } else {
          pcRef.current.addTrack(screenVideoTrack, displayMediaStream);
        }
      }

      // Notify partner via Firestore and BroadcastChannel
      if (booking?.id) {
        const roomDocRef = doc(db, "consultation_rooms", booking.id);
        const myMediaKey = `${currentUserRole}Media`;
        setDoc(roomDocRef, {
          [myMediaKey]: {
            isMuted,
            isCamOff,
            isScreenSharing: true,
            online: true,
            lastSeen: Date.now()
          },
          presentation: {
            type: "screen",
            presenterRole: currentUserRole,
            active: true,
            updatedAt: Date.now()
          }
        }, { merge: true }).catch(() => {});
      }

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: "mediaState",
          role: currentUserRole,
          data: { isMuted, isCamOff, isScreenSharing: true }
        });
        broadcastChannelRef.current.postMessage({
          type: "presentation",
          role: currentUserRole,
          data: { type: "screen", presenterRole: currentUserRole, active: true }
        });
      }

      // When user stops screen sharing from browser / OS native top bar
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        // User cancelled picker
        return;
      }

      console.warn("Screen share initialization error:", err);
      if (err.name === "SecurityError" || err.message?.includes("permissions policy") || err.message?.includes("Permission")) {
        setHasMediaError("Screen capture is restricted by iframe policy. Tap 'Open in New Tab' to share your full mobile screen, WhatsApp, or apps.");
      } else {
        setHasMediaError("Could not start screen capture: " + (err.message || "Please check browser permissions or open in a new tab"));
      }
    }
  };

  // Launch slide or document presentation from device storage
  const startPresentationShare = async (fileName: string, fileDataUrl: string, fileType: "image" | "pdf" = "image") => {
    setIsScreenShareModalOpen(false);

    // Stop native stream if any was running
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);

    const presData: SharedPresentationData = {
      type: fileType,
      title: fileName || "Presentation Slides",
      imageUrl: fileDataUrl,
      presenterRole: currentUserRole,
      active: true,
      updatedAt: Date.now()
    };

    setSharedPresentation(presData);

    if (booking?.id) {
      const roomDocRef = doc(db, "consultation_rooms", booking.id);
      const myMediaKey = `${currentUserRole}Media`;
      setDoc(roomDocRef, {
        [myMediaKey]: {
          isMuted,
          isCamOff,
          isScreenSharing: false,
          online: true,
          lastSeen: Date.now()
        },
        presentation: presData
      }, { merge: true }).catch(() => {});
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "presentation",
        role: currentUserRole,
        data: presData
      });
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
    setSharedPresentation(null);

    // Revert WebRTC video sender to original camera track
    if (pcRef.current && localStream) {
      const originalVideoTrack = localStream.getVideoTracks()[0];
      const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === "video");
      if (videoSender && originalVideoTrack) {
        videoSender.replaceTrack(originalVideoTrack);
      }
    }

    if (booking?.id) {
      const roomDocRef = doc(db, "consultation_rooms", booking.id);
      const myMediaKey = `${currentUserRole}Media`;
      setDoc(roomDocRef, {
        [myMediaKey]: {
          isMuted,
          isCamOff,
          isScreenSharing: false,
          online: true,
          lastSeen: Date.now()
        },
        presentation: {
          active: false,
          updatedAt: Date.now()
        }
      }, { merge: true }).catch(() => {});
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "mediaState",
        role: currentUserRole,
        data: { isMuted, isCamOff, isScreenSharing: false }
      });
      broadcastChannelRef.current.postMessage({
        type: "presentation",
        role: currentUserRole,
        data: { active: false }
      });
    }
  };

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    if (hrs > 0) {
      return `${hrs}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  // 1. REAL-TIME FIRESTORE SYNCHRONIZATION LOOP (Chat, Notes, Whiteboard, Status)
  useEffect(() => {
    if (!booking?.id) return;
    const roomDocRef = doc(db, "consultation_rooms", booking.id);

    const initRoom = async () => {
      try {
        await setDoc(roomDocRef, {
          id: booking.id,
          created: new Date().toISOString(),
          notes: currentUserRole === "therapist" 
            ? "🎯 Session Goals:\n1. Focus on stress management techniques\n2. Introduce deep breathing (4-7-8 method)\n3. Set cognitive journaling targets for this week."
            : "💡 My Session Reflections:\n- Discuss feeling anxious during morning commutes\n- Review breathing exercises from last week\n- Ask about sleep routine improvements.",
          chat: [
            { senderRole: "therapist", text: "Ascama Alaykum. Ready to start our session?", time: "10:00 AM" },
            { senderRole: "client", text: "Wa Alaykum Assalam. Yes, I am here!", time: "10:01 AM" }
          ],
          paths: []
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}`);
      }
    };
    initRoom();

    const unsubscribe = onSnapshot(roomDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // Sync Chat Messages
        if (data.chat) {
          const mappedChat: ChatMessage[] = data.chat.map((c: any) => ({
            sender: c.senderRole === currentUserRole ? ("me" as const) : ("partner" as const),
            text: c.text,
            time: c.time,
          }));
          setChatLog(mappedChat);
        }

        // Sync Shared Goals & Reflections
        if (data.notes !== undefined) {
          setSharedNotes(data.notes);
        }

        // Sync Whiteboard paths
        if (data.paths !== undefined) {
          setWhiteboardPaths(data.paths);
          redrawAllCanvases(data.paths);
        }

        // Sync Partner Mute/Cam/ScreenShare States
        const partnerRole = currentUserRole === "therapist" ? "client" : "therapist";
        const partnerMediaKey = `${partnerRole}Media`;
        if (data[partnerMediaKey]) {
          const pm = data[partnerMediaKey];
          setPartnerMuted(!!pm.isMuted);
          setPartnerCamOff(!!pm.isCamOff);
          setPartnerScreenSharing(!!pm.isScreenSharing);
        }

        // Sync Shared Interactive Presentation / Slides
        if (data.presentation) {
          if (data.presentation.active) {
            setSharedPresentation(data.presentation);
          } else {
            setSharedPresentation(null);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `consultation_rooms/${booking.id}`);
    });

    return () => unsubscribe();
  }, [booking?.id, currentUserRole]);

  // Sync my active media state to Firestore
  useEffect(() => {
    if (!booking?.id) return;
    const roomDocRef = doc(db, "consultation_rooms", booking.id);
    const myMediaKey = `${currentUserRole}Media`;

    const syncMyMedia = async () => {
      try {
        await setDoc(roomDocRef, {
          [myMediaKey]: {
            isMuted,
            isCamOff,
            isScreenSharing,
            online: true,
            lastSeen: Date.now()
          }
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}`);
      }
    };
    syncMyMedia();
  }, [isMuted, isCamOff, isScreenSharing, booking?.id, currentUserRole]);

  // Send Consultation Room Chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || !booking?.id) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const roomDocRef = doc(db, "consultation_rooms", booking.id);

    const newMsg = {
      senderRole: currentUserRole,
      text: chatInput,
      time: now
    };

    setChatLog((prev) => [...prev, { sender: "me", text: chatInput, time: now }]);
    setChatInput("");

    try {
      const updatedChat = [
        ...chatLog.map(m => ({
          senderRole: m.sender === "me" ? currentUserRole : (currentUserRole === "therapist" ? "client" : "therapist"),
          text: m.text,
          time: m.time
        })),
        newMsg
      ];
      await setDoc(roomDocRef, { chat: updatedChat }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}`);
    }
  };

  // Sync Shared Notes with Debouncer
  useEffect(() => {
    if (!booking?.id) return;
    const roomDocRef = doc(db, "consultation_rooms", booking.id);

    const timer = setTimeout(async () => {
      try {
        await setDoc(roomDocRef, { notes: sharedNotes }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}`);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [sharedNotes, booking?.id]);

  // Synchronize canvas buffer dimensions with its rendered layout box
  const syncCanvasDimensions = useCallback((canvas: HTMLCanvasElement | null, container: HTMLDivElement | null) => {
    if (!canvas) return false;
    const rect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
    const width = Math.max(100, Math.floor(rect.width));
    const height = Math.max(100, Math.floor(rect.height));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }, []);

  // Whiteboard Redraw Logic for both Side and Expanded Views
  const redrawAllCanvases = useCallback((paths: DrawingPath[]) => {
    [
      { canvas: canvasRef.current, container: canvasContainerRef.current },
      { canvas: expandedCanvasRef.current, container: expandedCanvasContainerRef.current }
    ].forEach(({ canvas, container }) => {
      if (!canvas) return;
      syncCanvasDimensions(canvas, container);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      paths.forEach((p) => {
        if (!p.points || p.points.length === 0) return;
        ctx.strokeStyle = p.isEraser ? "#ffffff" : p.color || "#C88A34";
        ctx.lineWidth = p.isEraser ? (p.width || 3) * 4 : (p.width || 3);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        // Scale normalized 0-1 points to current canvas size
        const first = p.points[0];
        ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
        for (let i = 1; i < p.points.length; i++) {
          const pt = p.points[i];
          ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        }
        ctx.stroke();
      });
    });
  }, [syncCanvasDimensions]);

  // Keep canvases perfectly synced with window/container resizing
  useEffect(() => {
    const handleResize = () => {
      let changed = false;
      if (canvasRef.current) {
        if (syncCanvasDimensions(canvasRef.current, canvasContainerRef.current)) changed = true;
      }
      if (expandedCanvasRef.current) {
        if (syncCanvasDimensions(expandedCanvasRef.current, expandedCanvasContainerRef.current)) changed = true;
      }
      if (changed) {
        redrawAllCanvases(whiteboardPaths);
      }
    };

    const ro = new ResizeObserver(() => {
      handleResize();
    });

    if (canvasContainerRef.current) ro.observe(canvasContainerRef.current);
    if (expandedCanvasContainerRef.current) ro.observe(expandedCanvasContainerRef.current);
    window.addEventListener("resize", handleResize);

    // Initial sync
    handleResize();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [isWhiteboardExpanded, activeTab, whiteboardSubTab, whiteboardPaths, syncCanvasDimensions, redrawAllCanvases]);

  useEffect(() => {
    redrawAllCanvases(whiteboardPaths);
  }, [activeTab, isWhiteboardExpanded, whiteboardSubTab, whiteboardPaths, redrawAllCanvases]);

  // Drawing Handlers with exact coordinate calculation (pen-to-board alignment)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    let clientX: number;
    let clientY: number;
    if ("touches" in e) {
      const touch = e.touches[0] || (e as React.TouchEvent).changedTouches?.[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent<HTMLCanvasElement>).clientX;
      clientY = (e as React.MouseEvent<HTMLCanvasElement>).clientY;
    }
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / w));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / h));
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, isExpandedView: boolean) => {
    const canvas = isExpandedView ? expandedCanvasRef.current : canvasRef.current;
    const container = isExpandedView ? expandedCanvasContainerRef.current : canvasContainerRef.current;
    if (!canvas) return;
    syncCanvasDimensions(canvas, container);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e, canvas);

    ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : brushColor;
    ctx.lineWidth = activeTool === "eraser" ? brushWidth * 4 : brushWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(x * canvas.width, y * canvas.height);
    setIsDrawing(true);
    setCurrentPathPoints([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, isExpandedView: boolean) => {
    if (!isDrawing) return;
    const canvas = isExpandedView ? expandedCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e, canvas);

    ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : brushColor;
    ctx.lineWidth = activeTool === "eraser" ? brushWidth * 4 : brushWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.lineTo(x * canvas.width, y * canvas.height);
    ctx.stroke();
    setCurrentPathPoints((prev) => [...prev, { x, y }]);
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPathPoints.length > 0 && booking?.id) {
      const newPath: DrawingPath = { 
        points: currentPathPoints, 
        color: activeTool === "eraser" ? "#ffffff" : brushColor, 
        width: activeTool === "eraser" ? brushWidth * 4 : brushWidth,
        isEraser: activeTool === "eraser"
      };
      const updatedPaths = [...whiteboardPaths, newPath];
      setWhiteboardPaths(updatedPaths);
      setCurrentPathPoints([]);

      const roomDocRef = doc(db, "consultation_rooms", booking.id);
      try {
        await setDoc(roomDocRef, { paths: updatedPaths }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}`);
      }
    }
  };

  // Undo last stroke
  const handleUndo = async () => {
    if (whiteboardPaths.length === 0 || !booking?.id) return;
    const updatedPaths = whiteboardPaths.slice(0, -1);
    setWhiteboardPaths(updatedPaths);
    redrawAllCanvases(updatedPaths);

    const roomDocRef = doc(db, "consultation_rooms", booking.id);
    try {
      await setDoc(roomDocRef, { paths: updatedPaths }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}`);
    }
  };

  // Clear canvas
  const clearCanvas = async () => {
    setWhiteboardPaths([]);
    redrawAllCanvases([]);

    if (booking?.id) {
      const roomDocRef = doc(db, "consultation_rooms", booking.id);
      try {
        await setDoc(roomDocRef, { paths: [] }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}`);
      }
    }
  };

  // Download Whiteboard as PNG
  const handleDownloadPNG = () => {
    // Generate a clean off-screen high-res canvas (1920x1080) for high quality export
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1920;
    exportCanvas.height = 1080;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Fill clean white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw grid pattern faintly for aesthetic look
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;
    for (let x = 0; x < exportCanvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, exportCanvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < exportCanvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(exportCanvas.width, y);
      ctx.stroke();
    }

    // Header stamp
    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("Barbaar Clinical Consultation Whiteboard", 40, 50);
    ctx.fillStyle = "#64748B";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Session: ${booking.id} · Date: ${new Date().toLocaleDateString()}`, 40, 80);

    // Draw all strokes
    whiteboardPaths.forEach((p) => {
      if (!p.points || p.points.length === 0) return;
      ctx.strokeStyle = p.isEraser ? "#FFFFFF" : p.color || "#C88A34";
      ctx.lineWidth = (p.width || 3) * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const first = p.points[0];
      ctx.moveTo(first.x * exportCanvas.width, first.y * exportCanvas.height);
      for (let i = 1; i < p.points.length; i++) {
        const pt = p.points[i];
        ctx.lineTo(pt.x * exportCanvas.width, pt.y * exportCanvas.height);
      }
      ctx.stroke();
    });

    // Create download link
    const link = document.createElement("a");
    link.download = `barbaar-whiteboard-${booking.id}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  // 2. ULTRA-FAST ZERO-LATENCY WEBRTC AUDIO + VIDEO SIGNALING ENGINE
  useEffect(() => {
    if (!booking?.id || !localStream) return;

    const webrtcDocRef = doc(db, "consultation_rooms", booking.id + "_webrtc");
    
    // Comprehensive STUN servers for instant NAT traversal
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
      iceCandidatePoolSize: 10,
    };

    let processingOffer = false;
    let processingAnswer = false;
    const addedHostCandidates = new Set<string>();
    const hostCandidateQueue: any[] = [];
    const addedGuestCandidates = new Set<string>();
    const guestCandidateQueue: any[] = [];

    const createPeerConnection = () => {
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch (e) {
          console.warn("Error closing old PeerConnection:", e);
        }
      }

      const pc = new RTCPeerConnection(configuration);
      pcRef.current = pc;

      // Track ICE connection state
      pc.oniceconnectionstatechange = () => {
        if (pcRef.current === pc) {
          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            unlockAudio();
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pcRef.current === pc) {
          if (pc.connectionState === "connected") {
            unlockAudio();
          }
        }
      };

      // Role-specific ICE candidate gathering
      pc.onicecandidate = async (event) => {
        if (event.candidate && event.candidate.candidate && event.candidate.candidate.trim().length > 0 && pcRef.current === pc) {
          try {
            const candJson = {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex
            };
            if (currentUserRole === "therapist") {
              await setDoc(webrtcDocRef, {
                hostCandidates: arrayUnion(candJson)
              }, { merge: true });
            } else {
              await setDoc(webrtcDocRef, {
                guestCandidates: arrayUnion(candJson)
              }, { merge: true });
            }
          } catch (e) {
            console.warn("Failed to write ICE candidate:", e);
          }
        }
      };

      // Attach all local stream tracks directly to the RTCPeerConnection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, localStream);
          } catch (trackErr) {
            console.warn("Error adding track to peer connection:", trackErr);
          }
        });
      }

      // Detect incoming remote audio & video tracks
      pc.ontrack = (event) => {
        let targetStream: MediaStream;
        if (event.streams && event.streams[0]) {
          targetStream = event.streams[0];
        } else {
          targetStream = remoteMediaStreamRef.current;
          if (!targetStream.getTracks().some(t => t.id === event.track.id)) {
            targetStream.addTrack(event.track);
          }
        }

        remoteMediaStreamRef.current = targetStream;
        const updatedStream = new MediaStream(targetStream.getTracks());
        setRemoteStream(updatedStream);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = targetStream;
          remoteVideoRef.current.muted = false;
          remoteVideoRef.current.volume = 1.0;
          remoteVideoRef.current.play()
            .then(() => setAudioBlocked(false))
            .catch((e) => {
              console.warn("Remote video auto-play:", e);
              setAudioBlocked(true);
            });
        }

        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = targetStream;
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play()
            .then(() => setAudioBlocked(false))
            .catch((e) => {
              console.warn("Remote audio auto-play:", e);
              setAudioBlocked(true);
            });
        }

        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx && targetStream.getAudioTracks().length > 0) {
            if (!remoteAudioContextRef.current || remoteAudioContextRef.current.state === "closed") {
              const ctx = new AudioCtx();
              remoteAudioContextRef.current = ctx;
              const source = ctx.createMediaStreamSource(targetStream);
              source.connect(ctx.destination);
              if (ctx.state === "suspended") {
                ctx.resume().catch(() => {});
              }
            }
          }
        } catch (webaudioErr) {
          console.warn("WebAudio direct routing caught:", webaudioErr);
        }

        event.track.onunmute = () => {
          unlockAudio();
        };
      };

      return pc;
    };

    const initialPc = createPeerConnection();
    let unsubscribeSignaling: () => void = () => {};

    if (currentUserRole === "therapist") {
      const createOffer = async (pcInstance: RTCPeerConnection) => {
        try {
          const offer = await pcInstance.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pcInstance.setLocalDescription(offer);
          const offerTime = Date.now();
          await setDoc(webrtcDocRef, {
            offer: { type: offer.type, sdp: offer.sdp },
            answer: null,
            hostCandidates: [],
            guestCandidates: [],
            offerCreatedAt: offerTime
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}_webrtc`);
        }
      };

      createOffer(initialPc);

      unsubscribeSignaling = onSnapshot(webrtcDocRef, async (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        if (data.guestReadyAt) {
          const guestTime = Number(data.guestReadyAt);
          if (lastGuestReadyAtRef.current !== null && guestTime > lastGuestReadyAtRef.current) {
            lastGuestReadyAtRef.current = guestTime;
            addedGuestCandidates.clear();
            guestCandidateQueue.length = 0;
            const newPc = createPeerConnection();
            createOffer(newPc);
            return;
          }
          lastGuestReadyAtRef.current = guestTime;
        }

        const currentPc = pcRef.current;
        if (!currentPc) return;

        if (data.answer && !currentPc.currentRemoteDescription && !processingAnswer) {
          processingAnswer = true;
          try {
            await currentPc.setRemoteDescription(new RTCSessionDescription(data.answer));
            while (guestCandidateQueue.length > 0) {
              const cand = guestCandidateQueue.shift();
              if (cand) {
                try {
                  await currentPc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (err) {
                  console.warn("Queued guest candidate error:", err);
                }
              }
            }
          } catch (err) {
            console.warn("Therapist remote description error:", err);
          } finally {
            processingAnswer = false;
          }
        }

        if (data.guestCandidates && Array.isArray(data.guestCandidates)) {
          for (const cand of data.guestCandidates) {
            const candStr = typeof cand === "string" ? cand : JSON.stringify(cand);
            if (!addedGuestCandidates.has(candStr)) {
              addedGuestCandidates.add(candStr);
              if (currentPc.currentRemoteDescription && !processingAnswer) {
                try {
                  await currentPc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (err) {
                  console.warn("Guest candidate loading error:", err);
                }
              } else {
                guestCandidateQueue.push(cand);
              }
            }
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `consultation_rooms/${booking.id}_webrtc`);
      });

    } else {
      // Client (Guest) signaling responder
      setDoc(webrtcDocRef, {
        guestReadyAt: Date.now()
      }, { merge: true }).catch(e => console.warn("Error sending guestReadyAt:", e));

      unsubscribeSignaling = onSnapshot(webrtcDocRef, async (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        if (data.offer && data.offerCreatedAt) {
          const offerTime = Number(data.offerCreatedAt);
          const isNewOffer = lastProcessedOfferCreatedAtRef.current === null || offerTime > lastProcessedOfferCreatedAtRef.current;
          
          if (isNewOffer) {
            lastProcessedOfferCreatedAtRef.current = offerTime;
            addedHostCandidates.clear();
            hostCandidateQueue.length = 0;

            const newPc = createPeerConnection();
            processingOffer = true;
            try {
              await newPc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await newPc.createAnswer();
              await newPc.setLocalDescription(answer);
              await setDoc(webrtcDocRef, {
                answer: { type: answer.type, sdp: answer.sdp }
              }, { merge: true });

              while (hostCandidateQueue.length > 0) {
                const cand = hostCandidateQueue.shift();
                if (cand) {
                  try {
                    await newPc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch (err) {
                    console.warn("Queued host candidate error:", err);
                  }
                }
              }
            } catch (err) {
              console.warn("Client remote description error:", err);
            } finally {
              processingOffer = false;
            }
          }
        }

        const currentPc = pcRef.current;
        if (!currentPc) return;

        if (data.hostCandidates && Array.isArray(data.hostCandidates)) {
          for (const cand of data.hostCandidates) {
            const candStr = typeof cand === "string" ? cand : JSON.stringify(cand);
            if (!addedHostCandidates.has(candStr)) {
              addedHostCandidates.add(candStr);
              if (currentPc.currentRemoteDescription && !processingOffer) {
                try {
                  await currentPc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (err) {
                  console.warn("Host candidate loading error:", err);
                }
              } else {
                hostCandidateQueue.push(cand);
              }
            }
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `consultation_rooms/${booking.id}_webrtc`);
      });
    }

    return () => {
      unsubscribeSignaling();
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [localStream, booking?.id, currentUserRole, reconnectCounter, unlockAudio]);

  const handleManualReconnect = () => {
    setReconnectCounter(prev => prev + 1);
  };

  const hasRemoteVideoTrack = Boolean(
    remoteStream && 
    remoteStream.getVideoTracks().length > 0 && 
    remoteStream.getVideoTracks().some(t => t.enabled && t.readyState === "live")
  );

  const isAnyScreenSharing = isScreenSharing || partnerScreenSharing || Boolean(sharedPresentation?.active);

  // Minimalist Color Palette
  const colorOptions = [
    { label: "Warm Amber", color: "#C88A34" },
    { label: "Acacia Green", color: "#284136" },
    { label: "Deep Charcoal", color: "#1E293B" },
    { label: "Indigo", color: "#3730A3" },
    { label: "Coral Red", color: "#E11D48" },
    { label: "Emerald", color: "#059669" },
    { label: "Sky Blue", color: "#2563EB" },
  ];

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#0c131f", 
        color: "#f1f5f9",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      className="fade-in select-none"
      onClick={unlockAudio}
    >
      {/* 1. Room Encryption Header */}
      <div 
        style={{ 
          background: "#162235", 
          padding: "10px 16px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div 
            style={{ 
              background: "#22c55e", 
              width: 10, 
              height: 10, 
              borderRadius: "50%", 
              boxShadow: "0 0 10px #22c55e" 
            }} 
            className="animate-pulse"
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: 6 }}>
              Barbaar Live Consultation
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                LIVE & INSTANT
              </span>
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
              <Lock size={10} color={colors.acacia} /> {currentUserRole === "therapist" ? "Encrypted Specialist Line" : "Secure HIPAA-Compliant Room"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Screen Share Active Pill */}
          {isScreenSharing && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
              <ScreenShare size={13} />
              <span>You are Sharing Screen</span>
            </div>
          )}

          {/* Quick Reconnect / Refresh Line Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleManualReconnect();
            }}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#cbd5e1",
              padding: "5px 10px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer"
            }}
            title="Refresh Audio & Video line"
          >
            <RefreshCw size={12} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Timeless Meeting Duration Indicator */}
          <div 
            style={{ 
              background: "#1e293b", 
              padding: "4px 12px", 
              borderRadius: 20, 
              fontSize: 12.5, 
              fontWeight: 700,
              fontFamily: "monospace",
              color: colors.amber,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
            title="Timeless Meeting - Unlimited Duration"
          >
            <Infinity size={13} className="text-emerald-400" />
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>
      </div>

      {/* Audio Policy Banner */}
      {audioBlocked && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            unlockAudio();
          }}
          style={{ 
            background: colors.amber, 
            color: colors.ink,
            padding: "8px 16px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 100000
          }}
        >
          <Volume2 size={18} />
          <span>🔊 Voice audio may be muted by browser policy — Tap to unmute sound</span>
          <button 
            type="button"
            style={{ 
              padding: "5px 12px", 
              fontSize: 12, 
              fontWeight: 700,
              background: colors.ink, 
              color: "#fff",
              borderRadius: 6,
              border: "none",
              cursor: "pointer"
            }}
            onClick={(e) => {
              e.stopPropagation();
              unlockAudio();
            }}
          >
            Unmute Voice Now
          </button>
        </div>
      )}

      {/* Media alert banner */}
      {hasMediaError && (
        <div 
          style={{ 
            background: `${colors.amberSoft}25`, 
            borderBottom: `1.5px solid ${colors.amber}50`, 
            padding: "8px 20px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            gap: 8,
            fontSize: 12,
            color: "#fef08a"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={14} color={colors.amber} />
            <span>{hasMediaError}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => window.open(window.location.href, "_blank")}
              className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded cursor-pointer transition-colors"
            >
              Open in New Tab
            </button>
            <button
              type="button"
              onClick={() => setHasMediaError(null)}
              style={{ background: "none", border: "none", color: "#fef08a", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Persistent Screen Sharing Active Banner with Instant Stop Sharing Action */}
      {(isScreenSharing || partnerScreenSharing || sharedPresentation?.active) && (
        <div className="bg-amber-500 text-slate-950 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3 shadow-md z-[100000] border-b border-amber-600">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block flex-shrink-0" />
            <ScreenShare size={16} className="text-slate-950 flex-shrink-0" />
            <span className="truncate">
              {isScreenSharing 
                ? "You are sharing your screen (Mobile apps, WhatsApp, home screen, or windows are live)"
                : partnerScreenSharing
                ? `${partnerName} is sharing their screen`
                : sharedPresentation?.presenterRole === currentUserRole
                ? `You are presenting: ${sharedPresentation?.title || "Slides"}`
                : `${partnerName} is presenting: ${sharedPresentation?.title || "Slides"}`}
            </span>
          </div>

          {(isScreenSharing || sharedPresentation?.presenterRole === currentUserRole) && (
            <button
              type="button"
              onClick={stopScreenShare}
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-transform hover:scale-105 active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <ScreenShareOff size={14} />
              <span className="whitespace-nowrap">Stop Sharing</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Main Call & Workspace Stage Layout */}
      <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden" }}>
        
        {/* CASE A: FULLSCREEN / EXPANDED WIDE-VIEW WHITEBOARD */}
        {isWhiteboardExpanded ? (
          <div className="flex-1 flex flex-col bg-slate-950 p-2 sm:p-4 relative overflow-hidden w-full h-full">
            {/* Minimalist Floating Whiteboard Header Toolbar */}
            <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 mb-2 sm:mb-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-xl z-30">
              
              {/* Left Group: Tools & Stroke Width */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Tool toggle (Pen / Eraser) */}
                <div className="flex items-center p-0.5 bg-slate-950/80 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTool("pen")}
                    className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTool === "pen"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Pen (Draw)"
                  >
                    <PenTool size={13} />
                    <span className="hidden xs:inline">Pen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool("eraser")}
                    className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTool === "eraser"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Eraser (Wipe strokes)"
                  >
                    <Eraser size={13} />
                    <span className="hidden xs:inline">Eraser</span>
                  </button>
                </div>

                {/* Brush Width Selector */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
                  {[
                    { width: 2, label: "Fine", dotSize: 3 },
                    { width: 4, label: "Med", dotSize: 5 },
                    { width: 8, label: "Bold", dotSize: 7 },
                    { width: 14, label: "Max", dotSize: 9 },
                  ].map((item) => (
                    <button
                      key={item.width}
                      type="button"
                      onClick={() => setBrushWidth(item.width)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        brushWidth === item.width
                          ? "bg-slate-800 text-amber-400 shadow-2xs font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      title={`Stroke width: ${item.width}px`}
                    >
                      <span
                        className="rounded-full bg-current"
                        style={{ width: item.dotSize, height: item.dotSize }}
                      />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Center Group: Clean Color Swatches */}
              {activeTool === "pen" && (
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  {colorOptions.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setBrushColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full transition-transform cursor-pointer relative ${
                        brushColor === c.color
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 shadow-sm"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              )}

              {/* Right Group: Action Controls (Undo, Download, Clear, Minimize) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={whiteboardPaths.length === 0}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Undo last stroke"
                >
                  <RotateCcw size={13} />
                  <span className="hidden md:inline">Undo</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Download drawing as high-res PNG image"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="Clear all strokes"
                >
                  <Trash2 size={13} />
                  <span className="hidden md:inline">Clear</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWhiteboardExpanded(false)}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="Minimize back to session view"
                >
                  <Minimize2 size={14} />
                  <span className="hidden lg:inline">Minimize</span>
                </button>
              </div>
            </div>

            {/* Expansive Canvas Stage Container */}
            <div 
              ref={expandedCanvasContainerRef}
              className="flex-1 w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-white select-none touch-none"
              style={{
                backgroundImage: "radial-gradient(#e2e8f0 1.2px, transparent 1.2px)",
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0",
              }}
            >
              <canvas
                ref={expandedCanvasRef}
                onMouseDown={(e) => startDrawing(e, true)}
                onMouseMove={(e) => draw(e, true)}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => startDrawing(e, true)}
                onTouchMove={(e) => draw(e, true)}
                onTouchEnd={stopDrawing}
                className="w-full h-full block cursor-crosshair touch-none select-none"
              />

              {/* Floating Mini Video Tile with Toggle */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-auto z-20">
                {isMiniVideoCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setIsMiniVideoCollapsed(false)}
                    className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer"
                    title="Show Video Tile"
                  >
                    <Video size={13} className="text-emerald-400" />
                    <span>{partnerName}</span>
                  </button>
                ) : (
                  <div className="w-28 h-20 sm:w-36 sm:h-24 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative group">
                    {(!remoteStream || partnerCamOff || !hasRemoteVideoTrack) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-[10px] font-bold text-slate-400 p-1 text-center">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white mb-1">
                          {partnerName.slice(0, 1)}
                        </div>
                        <span className="truncate max-w-[90%]">{partnerName}</span>
                      </div>
                    ) : (
                      <video
                        autoPlay
                        playsInline
                        ref={(el) => {
                          if (el && remoteStream) el.srcObject = remoteStream;
                        }}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-1 left-1.5 text-[8.5px] sm:text-[9px] font-bold bg-slate-950/80 px-1 py-0.5 rounded text-white truncate max-w-[70%]">
                      {partnerName}
                    </div>
                    {/* Minimize Video Tile Button */}
                    <button
                      type="button"
                      onClick={() => setIsMiniVideoCollapsed(true)}
                      className="absolute top-1 right-1 p-0.5 bg-slate-950/70 hover:bg-slate-900 text-slate-400 hover:text-white rounded text-[9px] transition-opacity cursor-pointer"
                      title="Collapse Video"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* CASE B: STANDARD PRESENTATION OR VIDEO CALL GRID */
          <div 
            style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              padding: "16px", 
              gap: "16px",
              justifyContent: "center",
              alignItems: "center",
              position: "relative"
            }}
          >
            {/* IF SCREEN SHARING OR PRESENTATION IS ACTIVE: Expansive Presentation Stage */}
            {isAnyScreenSharing ? (
              <div className={`w-full h-full flex flex-col ${isPresentationFullscreen ? "max-w-none fixed inset-0 z-50 p-2 bg-slate-950" : "max-w-5xl relative"}`}>
                
                {/* Presentation Stage Container */}
                <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl relative flex items-center justify-center">
                  
                  {/* Mode 1: Native Video Screen Stream (Local or Remote) */}
                  {isScreenSharing ? (
                    <video
                      ref={screenVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : partnerScreenSharing ? (
                    <video
                      ref={(el) => {
                        if (el && remoteStream) el.srcObject = remoteStream;
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : sharedPresentation?.active ? (
                    /* Slide / Document Presentation from Device Storage */
                    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden">
                      {sharedPresentation.type === "pdf" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center max-w-4xl">
                          <iframe
                            src={sharedPresentation.imageUrl}
                            title={sharedPresentation.title || "PDF Presentation"}
                            className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-2xl"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center max-w-4xl relative">
                          <img 
                            src={sharedPresentation.imageUrl} 
                            alt={sharedPresentation.title || "Shared Slide"} 
                            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-slate-800 bg-slate-900"
                            referrerPolicy="no-referrer"
                          />
                          {sharedPresentation.title && (
                            <div className="mt-2 text-xs text-slate-400 font-medium bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 truncate max-w-md">
                              {sharedPresentation.title}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Presentation Top Badge, Fullscreen & Stop Controls */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-20">
                    <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/50 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-amber-300 shadow-md">
                      <ScreenShare size={14} className="animate-pulse text-amber-400" />
                      <span>
                        {isScreenSharing 
                          ? "Your Live Screen Share" 
                          : partnerScreenSharing 
                          ? `${partnerName}'s Screen Share` 
                          : sharedPresentation?.title || "Live Shared Presentation"}
                      </span>
                      <span className="hidden sm:inline text-[10px] text-slate-400 font-normal border-l border-slate-700 pl-2">
                        🔒 Protected Presentation View
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPresentationFullscreen(!isPresentationFullscreen)}
                        className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 p-1.5 rounded-full border border-slate-700 shadow cursor-pointer transition-colors"
                        title={isPresentationFullscreen ? "Exit Fullscreen" : "Fullscreen Presentation"}
                      >
                        {isPresentationFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                      </button>

                      {(isScreenSharing || sharedPresentation?.presenterRole === currentUserRole) && (
                        <button
                          type="button"
                          onClick={stopScreenShare}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                        >
                          <ScreenShareOff size={14} />
                          <span>Stop Presentation</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Floating Camera Picture-in-Picture Tile */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                    <div className="w-32 sm:w-40 h-20 sm:h-24 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative">
                      {!isCamOff ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-[10px] text-slate-400">
                          Camera Off
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1.5 text-[9px] font-bold bg-slate-950/80 px-1 py-0.5 rounded text-white">
                        You
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* STANDARD 2-PARTICIPANT CALL GRID */
              <div 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  display: "grid", 
                  gridTemplateRows: "1fr 1fr", 
                  gap: 12,
                  maxWidth: 960,
                }}
                className="md:grid-cols-2 md:grid-rows-1"
              >
                {/* Partner Screen (Therapist or Client) */}
                <div 
                  style={{ 
                    background: "#1e293b", 
                    borderRadius: 16, 
                    position: "relative", 
                    overflow: "hidden",
                    border: remoteAudioLevel > 15 ? "2px solid #22c55e" : "1px solid #334155",
                    boxShadow: remoteAudioLevel > 15 ? "0 0 15px rgba(34, 197, 94, 0.3)" : "0 10px 25px rgba(0,0,0,0.4)",
                    transition: "border-color 0.2s, box-shadow 0.2s"
                  }}
                >
                  <div 
                    style={{ 
                      position: "absolute", 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      flexDirection: "column",
                      background: "radial-gradient(circle, #1e293b 0%, #0f172a 100%)"
                    }}
                  >
                    {/* Remote video element */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        opacity: (remoteStream && !partnerCamOff && hasRemoteVideoTrack) ? 1 : 0,
                        pointerEvents: "none",
                        transition: "opacity 0.3s"
                      }}
                    />
                    
                    {/* Fallback unmuted audio element */}
                    <audio
                      ref={remoteAudioRef}
                      autoPlay
                      playsInline
                      style={{ 
                        position: "absolute", 
                        width: "1px", 
                        height: "1px", 
                        opacity: 0.01, 
                        pointerEvents: "none" 
                      }}
                    />

                    {/* Instant Avatar Display */}
                    {(!remoteStream || partnerCamOff || !hasRemoteVideoTrack) && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 0 }}>
                        <div 
                          style={{ 
                            width: 90, 
                            height: 90, 
                            borderRadius: "50%", 
                            background: partnerCamOff ? "#334155" : colors.indigo, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            marginBottom: 12, 
                            border: remoteAudioLevel > 15 ? "3px solid #22c55e" : `3px solid ${colors.amber}`,
                            transform: remoteAudioLevel > 15 ? "scale(1.05)" : "scale(1)",
                            transition: "transform 0.15s, border-color 0.2s",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
                          }}
                        >
                          {partnerCamOff ? (
                            <VideoOff size={32} color="#94a3b8" />
                          ) : (
                            <span style={{ fontSize: 28, fontWeight: 700, color: "#ffffff" }}>
                              {partnerName.split(" ").map(n => n[0]).join("")}
                            </span>
                          )}
                        </div>
                        <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 700 }}>
                          {partnerName}
                        </div>
                        <div style={{ fontSize: 11, color: "#a7f3d0", marginTop: 4, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{partnerCamOff ? "Voice Connected · Camera Off" : "HD Audio & Video Connected"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secure overlay tag & speaking indicator */}
                  <div 
                    style={{ 
                      position: "absolute", 
                      bottom: 12, 
                      left: 12, 
                      background: "rgba(15, 23, 42, 0.75)", 
                      backdropFilter: "blur(4px)",
                      padding: "4px 10px", 
                      borderRadius: 8, 
                      fontSize: 11, 
                      fontWeight: 700,
                      color: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      zIndex: 2
                    }}
                  >
                    <span>{partnerName} ({currentUserRole === "therapist" ? "Client" : "Clinical Specialist"})</span>
                    {remoteAudioLevel > 15 && (
                      <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
                        <Volume2 size={12} className="animate-pulse" /> Speaking
                      </span>
                    )}
                  </div>

                  {/* Partner muted indicator */}
                  {partnerMuted && (
                    <div 
                      style={{ 
                        position: "absolute", 
                        top: 12, 
                        right: 12, 
                        background: "#ef4444", 
                        padding: "4px 8px", 
                        borderRadius: 6, 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 4,
                        fontSize: 10, 
                        fontWeight: 800, 
                        color: "#fff",
                        zIndex: 2
                      }}
                    >
                      <MicOff size={11} /> MUTED
                    </div>
                  )}
                </div>

                {/* Local Screen (My Stream) */}
                <div 
                  style={{ 
                    background: "#1e293b", 
                    borderRadius: 16, 
                    position: "relative", 
                    overflow: "hidden",
                    border: localAudioLevel > 15 ? "2px solid #22c55e" : "1px solid #334155",
                    boxShadow: localAudioLevel > 15 ? "0 0 15px rgba(34, 197, 94, 0.3)" : "0 10px 25px rgba(0,0,0,0.4)",
                    transition: "border-color 0.2s, box-shadow 0.2s"
                  }}
                >
                  {!isCamOff ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scaleX(-1)", 
                      }}
                    />
                  ) : (
                    <div 
                      style={{ 
                        position: "absolute", 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        flexDirection: "column",
                        background: "radial-gradient(circle, #1e293b 0%, #090d16 100%)"
                      }}
                    >
                      <div style={{ width: 80, height: 80, borderRadius: "50%", background: colors.indigo, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                        <VideoOff size={32} color="#ffffff" />
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 13 }}>
                        Your Camera is Turned Off
                      </div>
                    </div>
                  )}

                  <div 
                    style={{ 
                      position: "absolute", 
                      bottom: 12, 
                      left: 12, 
                      background: "rgba(15, 23, 42, 0.75)", 
                      backdropFilter: "blur(4px)",
                      padding: "4px 10px", 
                      borderRadius: 8, 
                      fontSize: 11, 
                      fontWeight: 700,
                      color: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <span>You (Local Video)</span>
                    {localAudioLevel > 15 && !isMuted && (
                      <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
                        <Volume2 size={12} className="animate-pulse" /> Mic Active
                      </span>
                    )}
                  </div>

                  {isMuted && (
                    <div 
                      style={{ 
                        position: "absolute", 
                        top: 12, 
                        right: 12, 
                        background: "#ef4444", 
                        padding: "4px 8px", 
                        borderRadius: 6, 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#fff"
                      }}
                    >
                      <MicOff size={11} /> MUTED
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Sliding Sidebar Drawer (Chat / Whiteboard Notes) */}
        {!isWhiteboardExpanded && activeTab !== "none" && (
          <div 
            style={{ 
              width: "100%", 
              maxWidth: 380, 
              background: "#162235", 
              borderLeft: "1px solid #1e293b", 
              display: "flex", 
              flexDirection: "column", 
              height: "100%",
              flexShrink: 0
            }}
            className="absolute md:relative right-0 top-0 bottom-0 z-50 pop-in"
          >
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                padding: "12px 16px", 
                borderBottom: "1px solid #1e293b" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {activeTab === "chat" ? (
                  <>
                    <MessageSquare size={16} color={colors.amber} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Session Messages</span>
                  </>
                ) : (
                  <>
                    <Edit3 size={16} color={colors.amber} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Collaborative Whiteboard</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-1.5">
                {activeTab === "notes" && (
                  <button
                    type="button"
                    onClick={() => setIsWhiteboardExpanded(true)}
                    className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Expand to Wide Canvas View"
                  >
                    <Maximize2 size={15} />
                  </button>
                )}
                <button 
                  onClick={() => setActiveTab("none")}
                  style={{ 
                    background: "none", 
                    border: "none", 
                    color: "#94a3b8", 
                    fontSize: 12, 
                    fontWeight: 700, 
                    cursor: "pointer",
                    padding: "4px 6px"
                  }}
                >
                  Hide
                </button>
              </div>
            </div>

            {/* Tab content 1: Interactive Real-time Chat */}
            {activeTab === "chat" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }} className="no-scrollbar">
                  {chatLog.length === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 12 }}>
                      No messages yet in this session.
                    </div>
                  ) : (
                    chatLog.map((c, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          alignSelf: c.sender === "me" ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          display: "flex",
                          flexDirection: "column"
                        }}
                      >
                        <div 
                          style={{ 
                            background: c.sender === "me" ? colors.indigo : "#1e293b",
                            color: "#ffffff",
                            borderRadius: 14,
                            padding: "10px 14px",
                            fontSize: 13,
                            lineHeight: 1.4,
                            boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
                          }}
                        >
                          {c.text}
                        </div>
                        <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, alignSelf: c.sender === "me" ? "flex-end" : "flex-start", padding: "0 4px" }}>
                          {c.time}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Send chat block */}
                <div style={{ padding: 12, borderTop: "1px solid #1e293b", background: "#0f172a" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Type a secure message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      style={{
                        flex: 1,
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 20,
                        padding: "8px 14px",
                        fontSize: 13,
                        color: "#f1f5f9",
                        outline: "none"
                      }}
                    />
                    <button
                      onClick={handleSendChat}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: colors.amber,
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: colors.ink
                      }}
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content 2: Enhanced Minimalist Whiteboard Sidebar */}
            {activeTab === "notes" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto", padding: 14, gap: 12 }}>
                
                {/* Sub-tabs: Freehand Canvas vs Shared Text Notes */}
                <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWhiteboardSubTab("canvas")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      whiteboardSubTab === "canvas" ? "bg-slate-800 text-amber-400 shadow-2xs" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <PenTool size={13} />
                    <span>Drawing Board</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhiteboardSubTab("notes")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      whiteboardSubTab === "notes" ? "bg-slate-800 text-amber-400 shadow-2xs" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileText size={13} />
                    <span>Goals & Notes</span>
                  </button>
                </div>

                {whiteboardSubTab === "canvas" ? (
                  <>
                    {/* Minimalist Drawing Tools Bar */}
                    <div className="flex items-center justify-between gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveTool("pen")}
                          className={`p-1.5 rounded-lg transition-all ${
                            activeTool === "pen" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                          }`}
                          title="Pen Tool"
                        >
                          <PenTool size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTool("eraser")}
                          className={`p-1.5 rounded-lg transition-all ${
                            activeTool === "eraser" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                          }`}
                          title="Eraser Tool"
                        >
                          <Eraser size={14} />
                        </button>
                      </div>

                      {/* Stroke Width Selector */}
                      <div className="flex items-center gap-1">
                        {[2, 4, 8].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setBrushWidth(w)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              brushWidth === w ? "bg-slate-700 text-amber-400" : "text-slate-500"
                            }`}
                          >
                            {w === 2 ? "S" : w === 4 ? "M" : "L"}
                          </button>
                        ))}
                      </div>

                      {/* Undo & Download */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleUndo}
                          disabled={whiteboardPaths.length === 0}
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg"
                          title="Undo"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPNG}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg"
                          title="Download as PNG"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg"
                          title="Clear Board"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Compact Canvas Box */}
                    <div 
                      ref={canvasContainerRef}
                      style={{ 
                        background: "#ffffff", 
                        borderRadius: 12, 
                        overflow: "hidden", 
                        border: "2px solid #334155",
                        width: "100%",
                        height: 240,
                        position: "relative",
                        backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
                        backgroundSize: "16px 16px"
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        onMouseDown={(e) => startDrawing(e, false)}
                        onMouseMove={(e) => draw(e, false)}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={(e) => startDrawing(e, false)}
                        onTouchMove={(e) => draw(e, false)}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full block cursor-crosshair touch-none select-none"
                      />
                    </div>

                    {/* Color Swatches */}
                    {activeTool === "pen" && (
                      <div className="flex items-center justify-between px-1 py-1">
                        <span className="text-[11px] text-slate-400 font-medium">Palette:</span>
                        <div className="flex items-center gap-2">
                          {colorOptions.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => setBrushColor(c.color)}
                              style={{ backgroundColor: c.color }}
                              className={`w-4.5 h-4.5 rounded-full transition-transform cursor-pointer ${
                                brushColor === c.color ? "ring-2 ring-white scale-125" : "opacity-80 hover:opacity-100"
                              }`}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expand Button Prompt */}
                    <button
                      type="button"
                      onClick={() => setIsWhiteboardExpanded(true)}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700"
                    >
                      <Maximize2 size={13} />
                      <span>Open Wide Whiteboard Stage</span>
                    </button>
                  </>
                ) : (
                  /* Shared Text Notes View */
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                      Shared Session Journal & Targets
                    </label>
                    <textarea
                      value={sharedNotes}
                      onChange={(e) => setSharedNotes(e.target.value)}
                      rows={10}
                      style={{
                        width: "100%",
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 12.5,
                        color: "#f1f5f9",
                        resize: "none",
                        outline: "none",
                        lineHeight: 1.45
                      }}
                      placeholder="Write therapeutic target notes here..."
                    />
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Interactive Call Controls Toolbar */}
      <div 
        style={{ 
          background: "#162235", 
          padding: "14px 20px", 
          display: "flex", 
          flexDirection: "column", 
          gap: 12,
          alignItems: "center", 
          justifyContent: "space-between", 
          borderTop: "1px solid #1e293b",
          flexShrink: 0
        }}
        className="sm:flex-row"
      >
        {/* Left Side: Call Stream Info & Active Status */}
        <div style={{ display: "none" }} className="sm:flex items-center gap-3">
          <div 
            style={{ 
              background: "#1e293b", 
              padding: "6px 12px", 
              borderRadius: 8, 
              fontSize: 11.5, 
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Zap size={12} className="text-emerald-400" />
            <span>Connection: <b style={{ color: "#22c55e" }}>Instant Live Audio & Video</b></span>
          </div>
        </div>

        {/* Center: Control Buttons */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }} className="sm:gap-3">
          
          {/* Audio toggle button */}
          <button
            type="button"
            onClick={handleToggleMute}
            style={{
              borderRadius: "50%",
              background: isMuted ? "#ef4444" : "#1e293b",
              color: "#ffffff",
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title={isMuted ? "Unmute Mic (Currently Muted)" : "Mute Mic"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Camera toggle button */}
          <button
            type="button"
            onClick={handleToggleCam}
            style={{
              borderRadius: "50%",
              background: isCamOff ? "#ef4444" : "#1e293b",
              color: "#ffffff",
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title={isCamOff ? "Turn Video Camera On" : "Turn Video Camera Off"}
          >
            {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          {/* Screen Sharing & Presentation Toggle Button */}
          <button
            type="button"
            onClick={handleToggleScreenShare}
            style={{
              borderRadius: "50%",
              background: (isScreenSharing || sharedPresentation?.active) ? colors.amber : "#1e293b",
              color: (isScreenSharing || sharedPresentation?.active) ? colors.ink : "#ffffff",
              border: (isScreenSharing || sharedPresentation?.active) ? `2px solid ${colors.amber}` : "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0 relative"
            title={(isScreenSharing || sharedPresentation?.active) ? "Stop Presentation" : "Share Screen or Clinical Presentation"}
          >
            {(isScreenSharing || sharedPresentation?.active) ? <ScreenShareOff size={20} /> : <MonitorUp size={20} />}
            {(isScreenSharing || sharedPresentation?.active) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-slate-900 animate-ping" />
            )}
          </button>

          {/* Chat Sidebar toggle */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "chat" ? "none" : "chat")}
            style={{
              borderRadius: "50%",
              background: activeTab === "chat" ? colors.indigo : "#1e293b",
              color: "#ffffff",
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title="Toggle Session Messages"
          >
            <MessageSquare size={20} />
          </button>

          {/* Whiteboard / Notes toggle */}
          <button
            type="button"
            onClick={() => {
              if (isWhiteboardExpanded) {
                setIsWhiteboardExpanded(false);
              }
              setActiveTab(activeTab === "notes" ? "none" : "notes");
            }}
            style={{
              borderRadius: "50%",
              background: (activeTab === "notes" || isWhiteboardExpanded) ? colors.indigo : "#1e293b",
              color: "#ffffff",
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title="Toggle Whiteboard & Notes"
          >
            <Edit3 size={20} />
          </button>

          {/* End Call red button */}
          <button
            onClick={() => {
              if (isScreenSharing || sharedPresentation?.active) {
                stopScreenShare();
              }
              if (currentUserRole === "therapist" && onCompleteSession) {
                onCompleteSession();
              } else {
                onClose();
              }
            }}
            style={{
              background: "#dc2626",
              color: "#ffffff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
              transition: "transform 0.2s"
            }}
            className="w-10 h-10 sm:w-auto px-0 sm:px-5 h-10 sm:h-12 gap-0 sm:gap-2 text-xs sm:text-sm rounded-full hover:scale-105 hover:bg-red-700 active:scale-95 flex-shrink-0"
          >
            <PhoneOff size={18} />
            <span className="hidden sm:inline">{currentUserRole === "therapist" ? "Complete & End" : "Leave Room"}</span>
          </button>
        </div>

        {/* Right Side: Quick info */}
        <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
          <Lock size={12} color={colors.acacia} />
          <span>Somali Community Wellness Care Protocol</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SCREEN SHARE & SLIDES UPLOAD MODAL DIALOG */}
      {/* ========================================================================= */}
      {isScreenShareModalOpen && (
        <div 
          className="fixed inset-0 z-[100005] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsScreenShareModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <ScreenShare size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Share Screen or Slides</h3>
                  <p className="text-xs text-slate-400">Choose how you want to present in this session</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScreenShareModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Hidden native device file input for slides, images, and PDF selection */}
            <input
              ref={slideFileInputRef}
              type="file"
              accept="image/*,application/pdf,.png,.jpg,.jpeg,.webp,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const url = event.target?.result as string;
                    if (url) {
                      startPresentationShare(file.name, url, isPdf ? "pdf" : "image");
                    }
                  };
                  reader.readAsDataURL(file);
                }
                e.target.value = "";
              }}
            />

            {/* Clean, Simple Presentation Options */}
            <div className="space-y-3 pt-1">
              {/* Option 1: Live Screen / Browser Tab Share */}
              <button
                type="button"
                onClick={startNativeScreenShare}
                className="w-full p-4 rounded-xl bg-slate-950 border border-amber-500/30 hover:border-amber-400 hover:bg-slate-950/90 transition-all flex items-center gap-3.5 text-left group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <MonitorUp size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                    <span>Share Screen or Window</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">Live Stream</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Pick any open browser tab, application window, or full desktop screen
                  </p>
                </div>
              </button>

              {/* Option 2: Upload Slides / Photos / Documents from Device */}
              <button
                type="button"
                onClick={() => slideFileInputRef.current?.click()}
                className="w-full p-4 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-400 hover:bg-slate-950/90 transition-all flex items-center gap-3.5 text-left group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Upload size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                    <span>Upload Slides or Photo</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">Mobile & PC</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Select slides, screenshots, PDF worksheets, or photo from your phone or computer
                  </p>
                </div>
              </button>
            </div>

            {/* Privacy & Browser Notice */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
              <Shield size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>You control what is shared and can stop presenting anytime.</p>
                <p className="text-slate-400">
                  <em>Tip for mobile phones:</em> Mobile web browsers share via <strong>Upload Slides or Photo</strong> or tap below to open in a dedicated browser tab.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => window.open(window.location.href, "_blank")}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium hover:underline cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>Open in New Tab</span>
              </button>

              <button
                type="button"
                onClick={() => setIsScreenShareModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
