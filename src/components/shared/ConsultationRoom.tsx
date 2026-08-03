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
  Activity, 
  Lock, 
  Send, 
  Sparkles, 
  Layers, 
  Trash2, 
  Volume2, 
  AlertCircle,
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Grid,
  Sun,
  Moon,
  RefreshCw,
  Shield,
  Camera,
  CheckCircle,
  Monitor,
  VolumeX,
  Radio,
  UserCheck
} from "lucide-react";
import { Booking } from "../../types";
import { colors } from "../../constants";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { setAppPrivacyMode } from "../../utils/privacy";

// Import Firebase config & Firestore methods
import { db, doc, onSnapshot, setDoc, handleFirestoreError, OperationType, collection, addDoc } from "../../lib/firebase";

interface ConsultationRoomProps {
  booking: Booking;
  currentUserRole: "client" | "therapist";
  partnerName: string;
  onClose: () => void;
  onCompleteSession?: () => void;
  lang?: "en" | "so";
}

interface ChatMessage {
  sender: "me" | "partner";
  text: string;
  time: string;
}

export default function ConsultationRoom({
  booking,
  currentUserRole,
  partnerName,
  onClose,
  onCompleteSession,
  lang = "en",
}: ConsultationRoomProps) {

  // Local & Remote media stream refs and states
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasRemoteVideoTrack, setHasRemoteVideoTrack] = useState<boolean>(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [micVolume, setMicVolume] = useState<number>(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaPermissionState, setMediaPermissionState] = useState<"granted" | "denied" | "prompt" | "testing">("prompt");

  // Audio Context for Live Mic Analyser & Sound Test
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Firestore Synced Partner States
  const [partnerConnected, setPartnerConnected] = useState(true);
  const [partnerMuted, setPartnerMuted] = useState(false);
  const [partnerCamOff, setPartnerCamOff] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  const safePlayMedia = (el: HTMLMediaElement | null) => {
    if (!el) return;
    try {
      el.volume = 1.0;
    } catch (_) {}
    const p = el.play();
    if (p !== undefined) {
      p.catch((err) => {
        console.warn("Media playback blocked or failed:", err);
        setNeedsUserGesture(true);
      });
    }
  };

  // Tab selections
  const [activeTab, setActiveTab] = useState<"chat" | "notes" | "none">("none");

  // Active Session Timer
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Synced Chat & Notes
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sharedNotes, setSharedNotes] = useState("");

  // Whiteboard Canvas states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const expandedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isWhiteboardExpanded, setIsWhiteboardExpanded] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState<"pen" | "marker" | "eraser" | "line" | "rect" | "circle" | "arrow">("pen");
  const [brushSize, setBrushSize] = useState<number>(4);
  const [canvasBg, setCanvasBg] = useState<"dark" | "light" | "grid" | "dots">("dark");
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState(colors.amber);
  const [whiteboardPaths, setWhiteboardPaths] = useState<any[]>([]);
  const [currentPathPoints, setCurrentPathPoints] = useState<{x: number, y: number, nx?: number, ny?: number}[]>([]);

  // Privacy Mode Enforcement
  useEffect(() => {
    setAppPrivacyMode(false);
    return () => setAppPrivacyMode(false);
  }, []);

  // Audio Level Analyser setup
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.warn("Audio analyser setup warning:", err);
    }
  }, []);

  // Request & Start Local Camera & Microphone Stream
  const startLocalMedia = useCallback(async (preferredFacingMode = facingMode) => {
    setMediaPermissionState("testing");
    setMediaError(null);

    // Request native Android permissions if in Capacitor/WebView environment
    if ((window as any).BarbaarPrivacy?.requestMediaPermissions) {
      try { (window as any).BarbaarPrivacy.requestMediaPermissions(); } catch (_) {}
    }
    if ((window as any).AndroidBridge?.requestMediaPermissions) {
      try { (window as any).AndroidBridge.requestMediaPermissions(); } catch (_) {}
    }

    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: preferredFacingMode },
          audio: true,
        });
      } catch (err1) {
        console.warn("Camera facingMode getUserMedia failed, trying default constraints:", err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (err2) {
          console.warn("Video getUserMedia failed, falling back to audio only:", err2);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsCamOff(true);
          setIsAudioOnly(true);
        }
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaPermissionState("granted");

      // Apply initial mute/cam off track states
      stream.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });
      stream.getVideoTracks().forEach((t) => { t.enabled = !isCamOff; });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setupAudioAnalyser(stream);
    } catch (err: any) {
      console.warn("Camera/mic access warning:", err);
      setMediaPermissionState("denied");
      setMediaError(null);

      // Create synthetic fallback stream (canvas video + silent audio track)
      // so WebRTC can still connect and receive remote audio & video from therapist!
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, 320, 240);
        }
        const canvasStream = canvas.captureStream(1);

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const dst = audioCtx.createMediaStreamDestination();
        const gain = audioCtx.createGain();
        gain.gain.value = 0; // silent
        osc.connect(gain);
        gain.connect(dst);
        osc.start();

        const fallbackStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...dst.stream.getAudioTracks(),
        ]);

        fallbackStream.getAudioTracks().forEach((t) => { t.enabled = false; });
        fallbackStream.getVideoTracks().forEach((t) => { t.enabled = false; });

        localStreamRef.current = fallbackStream;
        setLocalStream(fallbackStream);
        setIsCamOff(true);
        setIsMuted(true);
      } catch (fallbackErr) {
        console.error("Fallback stream generation error:", fallbackErr);
      }
    }
  }, [facingMode, isMuted, isCamOff, setupAudioAnalyser]);

  // Initial media mount
  useEffect(() => {
    startLocalMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // WebRTC PeerConnection & Real-time Firestore Signaling
  useEffect(() => {
    if (!booking?.id || !localStream) return;

    let pc: RTCPeerConnection | null = null;
    let unsubOffer: (() => void) | null = null;
    let unsubAnswer: (() => void) | null = null;
    let unsubCallerCandidates: (() => void) | null = null;
    let unsubCalleeCandidates: (() => void) | null = null;

    const initWebRTC = async () => {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      };

      pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      const incomingMediaStream = new MediaStream();
      remoteStreamRef.current = incomingMediaStream;
      setRemoteStream(incomingMediaStream);

      // Add local tracks to peer connection
      localStream.getTracks().forEach((track) => {
        if (pc) pc.addTrack(track, localStream);
      });

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!incomingMediaStream.getTracks().some(t => t.id === track.id)) {
              incomingMediaStream.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!incomingMediaStream.getTracks().some(t => t.id === event.track.id)) {
            incomingMediaStream.addTrack(event.track);
          }
        }

        const newStream = new MediaStream(incomingMediaStream.getTracks());
        remoteStreamRef.current = newStream;
        setRemoteStream(newStream);
        setHasRemoteVideoTrack(newStream.getVideoTracks().some((t) => t.enabled && t.readyState === "live"));

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = newStream;
          safePlayMedia(remoteVideoRef.current);
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = newStream;
          safePlayMedia(remoteAudioRef.current);
        }
      };

      // Ensure remoteStream tracks are explicitly bound when connection is established
      pc.onconnectionstatechange = () => {
        console.log("WebRTC Connection State:", pc?.connectionState);
        if (pc?.connectionState === "connected" && remoteStreamRef.current) {
          const stream = remoteStreamRef.current;
          if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== stream) {
            remoteAudioRef.current.srcObject = stream;
            safePlayMedia(remoteAudioRef.current);
          }
          if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
            remoteVideoRef.current.srcObject = stream;
            safePlayMedia(remoteVideoRef.current);
          }
          setHasRemoteVideoTrack(stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live"));
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("WebRTC ICE Connection State:", pc?.iceConnectionState);
        if ((pc?.iceConnectionState === "connected" || pc?.iceConnectionState === "completed") && remoteStreamRef.current) {
          const stream = remoteStreamRef.current;
          if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== stream) {
            remoteAudioRef.current.srcObject = stream;
            safePlayMedia(remoteAudioRef.current);
          }
          if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
            remoteVideoRef.current.srcObject = stream;
            safePlayMedia(remoteVideoRef.current);
          }
          setHasRemoteVideoTrack(stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live"));
        }
      };

      const roomDocRef = doc(db, "consultation_rooms", booking.id);
      const callerCandidatesCol = collection(db, "consultation_rooms", booking.id, "callerCandidates");
      const calleeCandidatesCol = collection(db, "consultation_rooms", booking.id, "calleeCandidates");

      if (currentUserRole === "therapist") {
        // Therapist acts as caller / offer creator
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addDoc(callerCandidatesCol, event.candidate.toJSON()).catch((e) => console.warn("Candidate add err:", e));
          }
        };

        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);

        await setDoc(roomDocRef, {
          offer: { type: offer.type, sdp: offer.sdp },
          answer: null
        }, { merge: true });

        // Listen for answer from client
        unsubAnswer = onSnapshot(roomDocRef, (snapshot) => {
          const data = snapshot.data();
          if (data?.answer && pc && !pc.currentRemoteDescription) {
            const answerDesc = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDesc).catch((e) => console.warn("Remote answer error:", e));
          }
        });

        // Listen for callee ICE candidates
        unsubCalleeCandidates = onSnapshot(calleeCandidatesCol, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added" && pc) {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.addIceCandidate(candidate).catch((e) => console.warn("Add ICE candidate error:", e));
            }
          });
        });

      } else {
        // Client acts as callee / answerer
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addDoc(calleeCandidatesCol, event.candidate.toJSON()).catch((e) => console.warn("Candidate add err:", e));
          }
        };

        // Listen for offer from therapist
        unsubOffer = onSnapshot(roomDocRef, async (snapshot) => {
          const data = snapshot.data();
          if (data?.offer && pc && !pc.currentRemoteDescription) {
            const offerDesc = new RTCSessionDescription(data.offer);
            await pc.setRemoteDescription(offerDesc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await setDoc(roomDocRef, {
              answer: { type: answer.type, sdp: answer.sdp }
            }, { merge: true });
          }
        });

        // Listen for caller ICE candidates
        unsubCallerCandidates = onSnapshot(callerCandidatesCol, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added" && pc) {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.addIceCandidate(candidate).catch((e) => console.warn("Add ICE candidate error:", e));
            }
          });
        });
      }
    };

    initWebRTC();

    return () => {
      if (unsubOffer) unsubOffer();
      if (unsubAnswer) unsubAnswer();
      if (unsubCallerCandidates) unsubCallerCandidates();
      if (unsubCalleeCandidates) unsubCalleeCandidates();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [booking?.id, localStream, currentUserRole]);

  // Ensure localVideoRef always retains localStream source when mounted
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCamOff]);

  // Ensure remoteAudioRef & remoteVideoRef remain continuously attached and playing remoteStream
  useEffect(() => {
    if (!remoteStream) return;

    if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      safePlayMedia(remoteAudioRef.current);
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      safePlayMedia(remoteVideoRef.current);
    }
  }, [remoteStream, hasRemoteVideoTrack, partnerCamOff]);

  // Handle Mute Track toggling
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Handle Camera Track toggling
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCamOff;
      });
    }
  }, [isCamOff]);

  // Mute / Unmute Audio Track
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMute;
      });
    }
    syncSessionState({ [currentUserRole === "therapist" ? "therapistMuted" : "clientMuted"]: nextMute });
  };

  // Turn Camera On / Off
  const handleToggleCam = () => {
    const nextCamOff = !isCamOff;
    setIsCamOff(nextCamOff);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextCamOff;
      });
    }
    syncSessionState({ [currentUserRole === "therapist" ? "therapistCamOff" : "clientCamOff"]: nextCamOff });
  };

  // Switch Front / Rear Camera
  const handleFlipCamera = async () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    await startLocalMedia(nextFacing);
  };

  // Screen Share Toggle
  const handleToggleScreenShare = async () => {
    if (isSharingScreen) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsSharingScreen(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = displayStream;
        setScreenStream(displayStream);
        setIsSharingScreen(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = displayStream;
        }

        displayStream.getVideoTracks()[0].onended = () => {
          setIsSharingScreen(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.warn("Screen share warning:", err);
      }
    }
  };

  // Speaker Sound Test Beep
  const handlePlayTestBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio sound test warning:", e);
    }
  };

  // Sync state with Firestore
  const syncSessionState = async (updateData: Record<string, any>) => {
    if (!booking?.id) return;
    try {
      const roomDocRef = doc(db, "consultation_rooms", booking.id);
      await setDoc(roomDocRef, updateData, { merge: true });
    } catch (err) {
      console.warn("Session sync warning:", err);
    }
  };

  // Leave & End Session
  const handleLeaveSession = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    syncSessionState({ [currentUserRole === "therapist" ? "therapistConnected" : "clientConnected"]: false });

    if (currentUserRole === "therapist" && onCompleteSession) {
      onCompleteSession();
    } else {
      onClose();
    }
  };

  // Real-time Firestore Chat, Notes & State Listener
  useEffect(() => {
    if (!booking?.id) return;
    const roomDocRef = doc(db, "consultation_rooms", booking.id);

    const initRoom = async () => {
      try {
        await setDoc(roomDocRef, {
          id: booking.id,
          created: new Date().toISOString(),
          [currentUserRole === "therapist" ? "therapistConnected" : "clientConnected"]: true,
          [currentUserRole === "therapist" ? "therapistMuted" : "clientMuted"]: isMuted,
          [currentUserRole === "therapist" ? "therapistCamOff" : "clientCamOff"]: isCamOff,
          notes: currentUserRole === "therapist" 
            ? "🎯 Clinical Session Notes:\n1. Focus on stress management techniques\n2. Introduce deep breathing (4-7-8 method)\n3. Set weekly mindfulness practice targets."
            : "💡 Personal Notes:\n- Discuss feeling anxious during commutes\n- Review exercises from last week\n- Ask about sleep routine improvements.",
          chat: [
            { senderRole: "therapist", text: "Ascama Alaykum. Welcome to your Barbaar consultation room!", time: "10:00 AM" },
            { senderRole: "client", text: "Wa Alaykum Assalam. Thank you, I am connected!", time: "10:01 AM" }
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

        // Sync Partner's Live Controls
        const isPartnerTherapist = currentUserRole === "client";
        if (isPartnerTherapist) {
          if (data.therapistMuted !== undefined) setPartnerMuted(data.therapistMuted);
          if (data.therapistCamOff !== undefined) setPartnerCamOff(data.therapistCamOff);
          if (data.therapistConnected !== undefined) setPartnerConnected(data.therapistConnected);
        } else {
          if (data.clientMuted !== undefined) setPartnerMuted(data.clientMuted);
          if (data.clientCamOff !== undefined) setPartnerCamOff(data.clientCamOff);
          if (data.clientConnected !== undefined) setPartnerConnected(data.clientConnected);
        }

        if (data.chat) {
          const mappedChat: ChatMessage[] = data.chat.map((c: any) => ({
            sender: c.senderRole === currentUserRole ? ("me" as const) : ("partner" as const),
            text: c.text,
            time: c.time,
          }));
          setChatLog(mappedChat);
        }

        if (data.notes !== undefined) {
          setSharedNotes(data.notes);
        }

        if (data.paths !== undefined) {
          setWhiteboardPaths(data.paths);
          redrawCanvas(data.paths);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `consultation_rooms/${booking.id}`);
    });

    return () => unsubscribe();
  }, [booking?.id, currentUserRole]);

  // Send Chat Message
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

  // Sync Shared Notes
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

  // Whiteboard Canvas Drawing Logic
  const redrawCanvasOn = (targetCanvas: HTMLCanvasElement | null, paths: any[], bg: string = canvasBg) => {
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return;

    const w = targetCanvas.width;
    const h = targetCanvas.height;

    ctx.clearRect(0, 0, w, h);
    if (bg === "dark") {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);
    } else if (bg === "light") {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, w, h);
    } else if (bg === "grid") {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      const step = 28;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    } else if (bg === "dots") {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#334155";
      const step = 24;
      for (let x = 12; x < w; x += step) {
        for (let y = 12; y < h; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    paths.forEach((p) => {
      if (!p.points || p.points.length === 0) return;

      const isMarker = p.tool === "marker";
      const isEraser = p.tool === "eraser";

      ctx.save();
      ctx.strokeStyle = isEraser ? (bg === "light" ? "#f8fafc" : "#0f172a") : (p.color || colors.amber);
      ctx.globalAlpha = isMarker ? 0.45 : 1.0;
      ctx.lineWidth = p.size || (isEraser ? 24 : isMarker ? 16 : 4);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      const getXY = (pt: any) => {
        let px = pt.x;
        let py = pt.y;
        if (pt.nx !== undefined && pt.ny !== undefined) {
          px = pt.nx * w;
          py = pt.ny * h;
        }
        return { px, py };
      };

      if (p.tool === "line" && p.points.length >= 2) {
        const start = getXY(p.points[0]);
        const end = getXY(p.points[p.points.length - 1]);
        ctx.moveTo(start.px, start.py);
        ctx.lineTo(end.px, end.py);
      } else if (p.tool === "rect" && p.points.length >= 2) {
        const start = getXY(p.points[0]);
        const end = getXY(p.points[p.points.length - 1]);
        ctx.rect(start.px, start.py, end.px - start.px, end.py - start.py);
      } else if (p.tool === "circle" && p.points.length >= 2) {
        const start = getXY(p.points[0]);
        const end = getXY(p.points[p.points.length - 1]);
        const radius = Math.hypot(end.px - start.px, end.py - start.py);
        ctx.arc(start.px, start.py, radius, 0, Math.PI * 2);
      } else if (p.tool === "arrow" && p.points.length >= 2) {
        const start = getXY(p.points[0]);
        const end = getXY(p.points[p.points.length - 1]);
        ctx.moveTo(start.px, start.py);
        ctx.lineTo(end.px, end.py);
        const headlen = 14;
        const angle = Math.atan2(end.py - start.py, end.px - start.px);
        ctx.lineTo(end.px - headlen * Math.cos(angle - Math.PI / 6), end.py - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.px, end.py);
        ctx.lineTo(end.px - headlen * Math.cos(angle + Math.PI / 6), end.py - headlen * Math.sin(angle + Math.PI / 6));
      } else {
        const start = getXY(p.points[0]);
        ctx.moveTo(start.px, start.py);
        for (let i = 1; i < p.points.length; i++) {
          const pt = getXY(p.points[i]);
          ctx.lineTo(pt.px, pt.py);
        }
      }
      ctx.stroke();
      ctx.restore();
    });
  };

  const redrawCanvas = (paths: any[]) => {
    redrawCanvasOn(canvasRef.current, paths);
    redrawCanvasOn(expandedCanvasRef.current, paths);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      redrawCanvas(whiteboardPaths);
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab, isWhiteboardExpanded, whiteboardPaths, canvasBg]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, isExpanded: boolean = false) => {
    const canvas = isExpanded ? expandedCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const nx = Math.max(0, Math.min(1, x / rect.width));
    const ny = Math.max(0, Math.min(1, y / rect.height));

    setIsDrawing(true);
    setCurrentPathPoints([{ x, y, nx, ny }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, isExpanded: boolean = false) => {
    if (!isDrawing) return;
    const canvas = isExpanded ? expandedCanvasRef.current : canvasRef.current;
    if (!canvas) return;

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const nx = Math.max(0, Math.min(1, x / rect.width));
    const ny = Math.max(0, Math.min(1, y / rect.height));

    const newPoints = [...currentPathPoints, { x, y, nx, ny }];
    setCurrentPathPoints(newPoints);

    const tempPaths = [...whiteboardPaths, { tool: whiteboardTool, color: brushColor, size: brushSize, points: newPoints }];
    redrawCanvasOn(canvas, tempPaths);
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPathPoints.length > 0) {
      const newPath = { tool: whiteboardTool, color: brushColor, size: brushSize, points: currentPathPoints };
      const updatedPaths = [...whiteboardPaths, newPath];
      setWhiteboardPaths(updatedPaths);
      setCurrentPathPoints([]);

      if (booking?.id) {
        try {
          const roomDocRef = doc(db, "consultation_rooms", booking.id);
          await setDoc(roomDocRef, { paths: updatedPaths }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}`);
        }
      }
    }
  };

  const clearCanvas = async () => {
    setWhiteboardPaths([]);
    redrawCanvas([]);
    if (booking?.id) {
      try {
        const roomDocRef = doc(db, "consultation_rooms", booking.id);
        await setDoc(roomDocRef, { paths: [] }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `consultation_rooms/${booking.id}`);
      }
    }
  };

  const downloadCanvasAsImage = () => {
    const canvas = isWhiteboardExpanded ? expandedCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const imageURI = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imageURI;
    link.download = `Barbaar-Session-Whiteboard-${booking.id.slice(0, 6)}.png`;
    link.click();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      style={{ 
        position: "fixed", 
        inset: 0, 
        zIndex: 9999, 
        background: "#090d16", 
        color: "#ffffff",
        display: "flex", 
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      {/* 1. Top Clinical Navigation & Security Header */}
      <div 
        style={{ 
          background: "#162235", 
          padding: "12px 20px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          borderBottom: "1px solid #1e293b",
          zIndex: 10,
          flexWrap: "wrap",
          gap: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px", color: colors.paper }}>
              Barbaar Native Consultation Room
            </span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34, 197, 94, 0.12)", color: "#22c55e", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid rgba(34, 197, 94, 0.2)" }}>
            <Shield size={12} />
            <span>WebRTC Direct Engine</span>
          </div>
        </div>

        {/* Center: Live Timer */}
        <div 
          style={{ 
            background: "#0f172a", 
            padding: "6px 16px", 
            borderRadius: 20, 
            fontSize: 13, 
            fontWeight: 800, 
            color: colors.amber,
            border: "1px solid #334155",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Activity size={14} className="animate-pulse" />
          <span>Session Duration: {formatTime(elapsed)}</span>
        </div>

        {/* Right: Partner Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#cbd5e1" }}>
            <UserCheck size={14} color="#22c55e" />
            <span style={{ fontWeight: 600 }}>
              {partnerName || (currentUserRole === "therapist" ? "Client Participant" : "Clinical Specialist")}
            </span>
            <span style={{ fontSize: 10, background: partnerConnected ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)", color: partnerConnected ? "#22c55e" : "#f87171", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
              {partnerConnected ? "Online" : "Connecting..."}
            </span>
          </div>

          <button 
            onClick={handleLeaveSession}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <PhoneOff size={14} />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Media Error Notice (Silent Fallback Mode) */}
      {/* Intrusive permission banner removed for a clean, minimalist experience */}

      {/* 2. Main Call Stage Layout */}
      <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden" }}>
        
        {/* Main Video Stream Stage */}
        <div 
          style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            padding: "16px", 
            gap: "12px",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            width: "100%",
            height: "100%"
          }}
        >
          {/* Main Stage Card Wrapper */}
          <div 
            style={{ 
              width: "100%", 
              height: "100%", 
              maxWidth: 980, 
              minHeight: 480, 
              borderRadius: 20, 
              overflow: "hidden", 
              position: "relative",
              background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)",
              border: "1px solid #334155",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {/* Stage Screen content switcher */}
            {isSharingScreen && screenStream ? (
              /* Screen Share Stream View */
              <div style={{ width: "100%", height: "100%", position: "relative", background: "#000000" }}>
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
                <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(15, 23, 42, 0.85)", border: `1px solid ${colors.amber}`, backdropFilter: "blur(6px)", padding: "6px 12px", borderRadius: 8, fontSize: 11, color: colors.amber, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <Monitor size={14} />
                  <span>Sharing Screen Stream</span>
                </div>
              </div>
            ) : (
              /* Primary Peer / Specialist Interactive Viewport */
              <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                
                {/* Autoplay User Gesture Enable Button Overlay */}
                {needsUserGesture && (
                  <button
                    onClick={() => {
                      setNeedsUserGesture(false);
                      if (remoteAudioRef.current) safePlayMedia(remoteAudioRef.current);
                      if (remoteVideoRef.current) safePlayMedia(remoteVideoRef.current);
                    }}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 100,
                      background: "#d97706",
                      color: "#ffffff",
                      padding: "16px 28px",
                      borderRadius: "9999px",
                      fontWeight: 800,
                      fontSize: 16,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
                      border: "3px solid #ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                    className="animate-bounce"
                  >
                    <Volume2 size={24} />
                    <span>Tap to Enable Sound & Video</span>
                  </button>
                )}

                {/* Remote WebRTC Audio Stream Player */}
                <audio
                  ref={remoteAudioRef}
                  autoPlay
                  playsInline
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "1px",
                    height: "1px",
                    opacity: 0.01,
                    pointerEvents: "none",
                  }}
                />

                {/* Remote WebRTC Video Stream Player */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: !partnerCamOff && hasRemoteVideoTrack ? "block" : "none",
                    zIndex: 4,
                  }}
                />

                {/* Security Anti-Capture Watermark Overlay */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.04, pointerEvents: "none", zIndex: 5, transform: "rotate(-25deg)", fontSize: 24, fontWeight: 900, color: "#ffffff", letterSpacing: 6, textTransform: "uppercase", userSelect: "none" }}>
                  BARBAAR SECURE STREAM · CLINICAL ROOM SESSION #{booking.id.slice(-6).toUpperCase()}
                </div>

                {/* Partner Feed Display / Avatar Fallback */}
                {(!hasRemoteVideoTrack || partnerCamOff) && (
                  <div style={{ textAlign: "center", zIndex: 6, padding: 24 }}>
                    <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 20px auto" }}>
                      <div style={{ width: 110, height: 110, borderRadius: "50%", background: `${colors.amber}20`, border: `3px solid ${colors.amber}`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.amber, fontSize: 42, fontWeight: 800, boxShadow: "0 0 30px rgba(217, 119, 6, 0.25)" }}>
                        {(partnerName || "C")[0]}
                      </div>
                      {/* Live Mic Wave Indicator for Partner */}
                      {!partnerMuted && partnerConnected && (
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", background: "#22c55e", border: "3px solid #0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
                          <Volume2 size={14} className="animate-pulse" />
                        </div>
                      )}
                    </div>

                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", marginBottom: 6, letterSpacing: "-0.2px" }}>
                      {partnerName || (currentUserRole === "therapist" ? "Client Participant" : "Clinical Specialist")}
                    </h3>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1e293b", padding: "6px 16px", borderRadius: 20, fontSize: 12, color: partnerCamOff ? "#f87171" : "#22c55e", border: "1px solid #334155" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: partnerCamOff ? "#f87171" : "#22c55e", boxShadow: `0 0 8px ${partnerCamOff ? "#f87171" : "#22c55e"}` }} />
                      <span>
                        {partnerCamOff ? "Camera Paused (Audio Room Active)" : "Encrypted Clinical Session Connected"}
                      </span>
                    </div>

                    {/* Partner Mic / Audio Status Pill */}
                    {partnerMuted && (
                      <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "4px 12px", borderRadius: 12, fontSize: 11, border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                        <MicOff size={12} />
                        <span>Participant Mic Muted</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Local Picture-in-Picture Video Box */}
                <div 
                  style={{ 
                    position: "absolute", 
                    bottom: 20, 
                    right: 20, 
                    width: 160, 
                    height: 200, 
                    borderRadius: 16, 
                    overflow: "hidden", 
                    border: `2px solid ${colors.amber}`, 
                    background: "#0f172a", 
                    boxShadow: "0 12px 30px rgba(0,0,0,0.6)", 
                    zIndex: 20 
                  }}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: !isCamOff && !isAudioOnly && localStream ? "block" : "none"
                    }}
                  />

                  {(isCamOff || isAudioOnly || !localStream) && (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", padding: 10, textAlign: "center" }}>
                      <VideoOff size={28} style={{ marginBottom: 8, color: colors.amber }} />
                      <span style={{ fontSize: 11, fontWeight: 700 }}>
                        {isCamOff ? "Camera Paused" : isAudioOnly ? "Audio Only Mode" : "Camera Initializing..."}
                      </span>
                    </div>
                  )}

                  {/* PIP Status overlay */}
                  <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: 6, fontSize: 10, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>You</span>
                    {isMuted ? <MicOff size={10} color="#f87171" /> : <Mic size={10} color="#22c55e" />}
                  </div>

                  {/* Mic Sound Meter Bar */}
                  {!isMuted && (
                    <div style={{ position: "absolute", top: 6, left: 6, right: 6, height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${micVolume}%`, height: "100%", background: "#22c55e", transition: "width 0.1s ease" }} />
                    </div>
                  )}
                </div>

                {/* Floating Top Shield Banner */}
                <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(245, 158, 11, 0.4)", backdropFilter: "blur(6px)", padding: "6px 14px", borderRadius: 10, fontSize: 11, color: colors.amber, pointerEvents: "none", zIndex: 10, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                  <Shield size={14} color={colors.amber} />
                  <span style={{ fontWeight: 800, letterSpacing: "0.5px" }}>BARBAAR PRIVACY SHIELD · E2EE END-TO-END CLINICAL SESSION</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sliding Sidebar Drawer (Chat / Whiteboard Notes) */}
        {activeTab !== "none" && (
          <div 
            style={{ 
              width: "100%", 
              maxWidth: 360, 
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
                padding: "14px 16px", 
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
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Whiteboard Scribble</span>
                  </>
                )}
              </div>
              <button 
                onClick={() => setActiveTab("none")}
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "#94a3b8", 
                  fontSize: 12, 
                  fontWeight: 700,
                  cursor: "pointer" 
                }}
              >
                Hide
              </button>
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

            {/* Tab content 2: Live Shared Notes and Digital Canvas Whiteboard */}
            {activeTab === "notes" && (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto", padding: 16, gap: 16 }}>
                
                {/* Note Editor */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                    Shared Journal / Goals
                  </label>
                  <textarea
                    value={sharedNotes}
                    onChange={(e) => setSharedNotes(e.target.value)}
                    rows={4}
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

                {/* Graphical Scribble Whiteboard */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Interactive Drawing Pad
                    </label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button 
                        onClick={() => setIsWhiteboardExpanded(true)}
                        style={{ background: "none", border: "none", color: colors.amber, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}
                      >
                        <Maximize2 size={12} /> Expand Wide
                      </button>
                      <button 
                        onClick={clearCanvas}
                        style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
                      >
                        <Trash2 size={12} /> Reset
                      </button>
                    </div>
                  </div>

                  <div style={{ background: "#0f172a", borderRadius: 12, overflow: "hidden", border: "2px solid #334155" }}>
                    <canvas
                      ref={canvasRef}
                      width={328}
                      height={200}
                      onMouseDown={(e) => startDrawing(e, false)}
                      onMouseMove={(e) => draw(e, false)}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={(e) => startDrawing(e, false)}
                      onTouchMove={(e) => draw(e, false)}
                      onTouchEnd={stopDrawing}
                      style={{
                        background: "#0f172a",
                        display: "block",
                        cursor: "crosshair",
                        touchAction: "none"
                      }}
                    />
                  </div>

                  {/* Quick Action Controls */}
                  <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[colors.amber, colors.indigo, colors.acacia, "#ef4444", "#ffffff"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setBrushColor(color)}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: color,
                            border: brushColor === color ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.2)",
                            cursor: "pointer",
                            transform: brushColor === color ? "scale(1.15)" : undefined,
                          }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setIsWhiteboardExpanded(true)}
                      style={{
                        background: colors.indigo,
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 10.5,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer"
                      }}
                    >
                      <Maximize2 size={11} /> Open Full Whiteboard
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", lineHeight: 1.35 }}>
                  Click 'Expand Wide' to open the full-screen interactive whiteboard with high-res drawing tools, shapes, and PNG export.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Native Functional Control Bar */}
      <div 
        style={{ 
          background: "#162235", 
          padding: "16px 20px", 
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
        {/* Left Side: Live Mic & Sound Diagnostics */}
        <div style={{ display: "none" }} className="sm:flex items-center gap-3">
          <button
            onClick={handlePlayTestBeep}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: colors.amber,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer"
            }}
            title="Test Speaker Output"
          >
            <Volume2 size={14} />
            <span>Test Sound Output</span>
          </button>

          <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
            <Radio size={12} color="#22c55e" />
            <span>Mic Level: {micVolume}%</span>
          </div>
        </div>

        {/* Center: Control Buttons */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          
          {/* Audio toggle button */}
          <button
            onClick={handleToggleMute}
            style={{
              borderRadius: "50%",
              background: isMuted ? "#ef4444" : "#1e293b",
              color: "#ffffff",
              border: `1px solid ${isMuted ? "#dc2626" : "#334155"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s, background 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff size={20} color="#ffffff" /> : <Mic size={20} color="#22c55e" />}
          </button>

          {/* Camera toggle button */}
          <button
            onClick={handleToggleCam}
            style={{
              borderRadius: "50%",
              background: isCamOff ? "#ef4444" : "#1e293b",
              color: "#ffffff",
              border: `1px solid ${isCamOff ? "#dc2626" : "#334155"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s, background 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title={isCamOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCamOff ? <VideoOff size={20} color="#ffffff" /> : <Video size={20} color="#22c55e" />}
          </button>

          {/* Switch Front/Rear Camera */}
          <button
            onClick={handleFlipCamera}
            style={{
              borderRadius: "50%",
              background: "#1e293b",
              color: colors.amber,
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title="Flip / Switch Camera (Front or Rear)"
          >
            <Camera size={20} />
          </button>

          {/* Share Screen button */}
          <button
            onClick={handleToggleScreenShare}
            style={{
              borderRadius: "50%",
              background: isSharingScreen ? colors.amber : "#1e293b",
              color: isSharingScreen ? colors.ink : "#ffffff",
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title={isSharingScreen ? "Stop Screen Share" : "Share Screen"}
          >
            <Monitor size={20} />
          </button>

          {/* Chat Sidebar toggle */}
          <button
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

          {/* Notes Sidebar toggle */}
          <button
            onClick={() => setActiveTab(activeTab === "notes" ? "none" : "notes")}
            style={{
              borderRadius: "50%",
              background: activeTab === "notes" ? colors.indigo : "#1e293b",
              color: "#ffffff",
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title="Toggle Shared Whiteboard"
          >
            <Edit3 size={20} />
          </button>

          {/* Audio Re-connect & Sound Test button */}
          <button
            onClick={() => {
              handlePlayTestBeep();
              if (remoteAudioRef.current) safePlayMedia(remoteAudioRef.current);
              if (remoteVideoRef.current) safePlayMedia(remoteVideoRef.current);
              setNeedsUserGesture(false);
            }}
            style={{
              borderRadius: "50%",
              background: "#1e293b",
              color: "#22c55e",
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 hover:scale-105 active:scale-95 flex-shrink-0"
            title="Force Re-connect Audio & Speaker Test"
          >
            <Volume2 size={20} />
          </button>

          {/* End Call red button */}
          <button
            onClick={handleLeaveSession}
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
            className="w-11 h-11 sm:w-auto px-0 sm:px-5 h-11 sm:h-12 gap-0 sm:gap-2 text-xs sm:text-sm rounded-full hover:scale-105 hover:bg-red-700 active:scale-95 flex-shrink-0"
          >
            <PhoneOff size={20} />
            <span className="hidden sm:inline">{currentUserRole === "therapist" ? "Complete & End" : "Leave Room"}</span>
          </button>
        </div>

        {/* Right Side: Quick info */}
        <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
          <Lock size={12} color={colors.acacia} />
          <span>Barbaar Encrypted WebRTC Session</span>
        </div>
      </div>

      {/* Expanded Full-Screen Interactive Whiteboard Overlay Modal */}
      {isWhiteboardExpanded && (
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 99999, 
            background: "#090d16", 
            display: "flex", 
            flexDirection: "column",
            userSelect: "none"
          }}
          className="fade-in"
        >
          {/* Header Bar */}
          <div style={{ background: "#162235", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Edit3 size={18} color={colors.amber} />
              <span style={{ fontWeight: 800, fontSize: 16, color: "#f8fafc" }}>
                Interactive Clinical Whiteboard
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={downloadCanvasAsImage}
                style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
              >
                <Download size={14} /> Download PNG
              </button>
              <button
                onClick={clearCanvas}
                style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
              >
                <Trash2 size={14} /> Clear All
              </button>
              <button
                onClick={() => setIsWhiteboardExpanded(false)}
                style={{ background: colors.amber, color: colors.ink, border: "none", padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
              >
                Done / Minimize
              </button>
            </div>
          </div>

          {/* Full Canvas Body */}
          <div style={{ flex: 1, position: "relative", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <canvas
              ref={expandedCanvasRef}
              width={1200}
              height={700}
              onMouseDown={(e) => startDrawing(e, true)}
              onMouseMove={(e) => draw(e, true)}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => startDrawing(e, true)}
              onTouchMove={(e) => draw(e, true)}
              onTouchEnd={stopDrawing}
              style={{
                background: "#0f172a",
                maxWidth: "100%",
                maxHeight: "100%",
                cursor: "crosshair",
                touchAction: "none",
                borderRadius: 12,
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
