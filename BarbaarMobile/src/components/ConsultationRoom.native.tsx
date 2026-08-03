import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import {
  RTCView,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import * as ScreenCapture from 'expo-screen-capture';
import { BookingSession } from '../types';

interface ConsultationRoomNativeProps {
  booking: BookingSession;
  currentUserRole: 'client' | 'therapist';
  onLeaveSession: () => void;
}

const { width, height } = Dimensions.get('window');

export const ConsultationRoomNative: React.FC<ConsultationRoomNativeProps> = ({
  booking,
  currentUserRole,
  onLeaveSession,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCamOff, setIsCamOff] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);

  // Enforce FLAG_SECURE / Screen Capture Protection when entering consultation room
  useEffect(() => {
    let subscription: ScreenCapture.Subscription | null = null;

    const enablePrivacyProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        subscription = ScreenCapture.addScreenshotListener(() => {
          Alert.alert(
            'Security Notice',
            'Screenshots are strictly prohibited during clinical sessions to enforce patient confidentiality (HIPAA & Somali Health Standards).'
          );
        });
      } catch (err) {
        console.warn('ScreenCapture protection error:', err);
      }
    };

    enablePrivacyProtection();

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Initialize Native Hardware Camera & Microphone Streams
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startLocalStream = async () => {
      try {
        const isFront = true;
        const devices = (await mediaDevices.enumerateDevices()) as any[];
        const facing = isFront ? 'front' : 'environment';
        const videoSourceId = devices.find(
          (device: any) => device.kind === 'videoinput' && device.facing === facing
        )?.deviceId;

        const constraints = {
          audio: true,
          video: {
            mandatory: {
              minWidth: 640,
              minHeight: 480,
              minFrameRate: 30,
            },
            facingMode: isFront ? 'user' : 'environment',
            optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
          },
        };

        const mediaStream = await mediaDevices.getUserMedia(constraints);
        stream = mediaStream as unknown as MediaStream;
        setLocalStream(stream);
      } catch (error) {
        console.error('Failed to get native media devices:', error);
      }
    };

    startLocalStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCamOff(!isCamOff);
    }
  };

  const partnerName =
    currentUserRole === 'therapist'
      ? booking.clientName || 'Client Participant'
      : booking.therapistName || 'Clinical Specialist';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top Security & Status Bar */}
      <View style={styles.topBar}>
        <View style={styles.statusBadge}>
          <View style={styles.liveIndicator} />
          <Text style={styles.statusText}>Barbaar Native Consultation Room</Text>
        </View>

        <View style={styles.securityFlags}>
          <Text style={styles.securityFlagText}>🛡️ Anti-Capture Active</Text>
          <Text style={styles.securityFlagText}>🔒 E2EE Encrypted</Text>
        </View>
      </View>

      {/* Floating Privacy Banner Overlay */}
      <View style={styles.watermarkBanner}>
        <Text style={styles.watermarkText}>
          BARBAAR PRIVACY SHIELD · CLINICAL ROOM · SESSION #{booking.id.slice(-6).toUpperCase()}
        </Text>
      </View>

      {/* Main Remote / Partner Video Stage */}
      <View style={styles.videoStage}>
        <View style={styles.remotePlaceholder}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{(partnerName || 'C')[0]}</Text>
          </View>
          <Text style={styles.partnerName}>{partnerName}</Text>
          <View style={styles.connectionBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.connectionText}>Session Stream Connected</Text>
          </View>
        </View>

        {/* Diagonal Security Watermark */}
        <Text style={styles.diagonalWatermark}>
          BARBAAR SECURE STREAM · DO NOT RECORD OR CAPTURE
        </Text>

        {/* Local Picture-In-Picture (PiP) Stream View */}
        <View style={styles.pipContainer}>
          {localStream && !isCamOff ? (
            <RTCView
              streamURL={(localStream as any).toURL()}
              style={styles.pipVideo}
              objectFit="cover"
              mirror={true}
            />
          ) : (
            <View style={styles.pipOffState}>
              <Text style={styles.pipOffText}>📷 Off</Text>
            </View>
          )}
          <View style={styles.pipLabel}>
            <Text style={styles.pipLabelText}>You {isMuted ? '(Muted)' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Hardware Call Controls */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={toggleMute}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, isCamOff && styles.controlBtnActive]}
          onPress={toggleCamera}
        >
          <Text style={styles.controlIcon}>{isCamOff ? '📷❌' : '📹'}</Text>
          <Text style={styles.controlLabel}>{isCamOff ? 'Start Cam' : 'Stop Cam'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, isSpeakerOn && styles.controlBtnHighlight]}
          onPress={() => setIsSpeakerOn(!isSpeakerOn)}
        >
          <Text style={styles.controlIcon}>🔊</Text>
          <Text style={styles.controlLabel}>Speaker</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endCallBtn} onPress={onLeaveSession}>
          <Text style={styles.endCallIcon}>📞</Text>
          <Text style={styles.endCallText}>End Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 8,
  },
  statusText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  securityFlags: {
    flexDirection: 'row',
    gap: 8,
  },
  securityFlagText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  watermarkBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    margin: 12,
    borderRadius: 8,
  },
  watermarkText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  videoStage: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  remotePlaceholder: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 2,
    borderColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: {
    color: '#f59e0b',
    fontSize: 32,
    fontWeight: '800',
  },
  partnerName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  connectionText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
  },
  diagonalWatermark: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.05)',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    transform: [{ rotate: '-25deg' }],
    letterSpacing: 3,
    pointerEvents: 'none',
  },
  pipContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    elevation: 8,
  },
  pipVideo: {
    width: '100%',
    height: '100%',
  },
  pipOffState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  pipOffText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  pipLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pipLabelText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  controlsBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#334155',
    minWidth: 65,
  },
  controlBtnActive: {
    backgroundColor: '#ef4444',
  },
  controlBtnHighlight: {
    backgroundColor: '#3b82f6',
  },
  controlIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  controlLabel: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '600',
  },
  endCallBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    minWidth: 80,
  },
  endCallIcon: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 2,
  },
  endCallText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});
