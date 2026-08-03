import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import * as Updates from 'expo-updates';
import { colors, DEFAULT_THERAPISTS } from './src/constants';
import {
  Therapist,
  Booking,
  Message,
  ClientProfile,
  UserProfile,
  BookingSession,
} from './src/types';
import {
  db,
  collection,
  onSnapshot,
  nativeStorageService,
} from './src/services/firebase.native';
import { HeaderBar } from './src/components/HeaderBar.native';
import { TherapistList } from './src/components/TherapistList.native';
import { SessionsList } from './src/components/SessionsList.native';
import { ChatRoom } from './src/components/ChatRoom.native';
import { ProfileView } from './src/components/ProfileView.native';
import { ConsultationRoomNative } from './src/components/ConsultationRoom.native';
import { QuizModal } from './src/components/QuizModal.native';

import { FinancialAidModal } from './src/components/FinancialAidModal.native';
import { AuthModal } from './src/components/AuthModal.native';

export default function App() {
  const [activeTab, setActiveTab] = useState<'therapists' | 'sessions' | 'messages' | 'profile'>('therapists');
  const [therapists, setTherapists] = useState<Therapist[]>(DEFAULT_THERAPISTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [quizVisible, setQuizVisible] = useState<boolean>(false);
  const [aidModalVisible, setAidModalVisible] = useState<boolean>(false);
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [savedTherapistIds, setSavedTherapistIds] = useState<string[]>(['t1', 't2']);
  const [clientProfile, setClientProfile] = useState<ClientProfile>({
    name: 'Farhiya Ali',
    email: 'farhiya@barbaar.so',
    phone: '+252 61 555 1234',
    language: 'so',
    financialAidStatus: 'none',
  });
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'user-mobile-01',
    fullName: 'Farhiya Ali',
    email: 'farhiya@barbaar.so',
    role: 'client',
    languagePreference: 'somali',
  });
  const [activeSession, setActiveSession] = useState<BookingSession | null>(null);
  const [inConsultationRoom, setInConsultationRoom] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleToggleFavorite = (therapistId: string) => {
    setSavedTherapistIds((prev) =>
      prev.includes(therapistId)
        ? prev.filter((id) => id !== therapistId)
        : [...prev, therapistId]
    );
  };

  // Auto-reload on App Launch via expo-updates
  useEffect(() => {
    async function checkForOtaUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('OTA update check error:', error);
      }
    }
    checkForOtaUpdates();
  }, []);

  // Restore local storage profiles on launch
  useEffect(() => {
    const initLocalStorage = async () => {
      try {
        const savedUser = await nativeStorageService.getUserProfile();
        if (savedUser) setCurrentUser(savedUser);

        const savedClient = await nativeStorageService.getClientProfile();
        if (savedClient) setClientProfile(savedClient);
      } catch (err) {
        console.error('Storage init error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initLocalStorage();
  }, []);

  // Sync Therapists live from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'therapists'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Therapist[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Therapist, 'id'>),
          }));
          setTherapists(list);
        }
      },
      (err) => console.warn('Firestore Therapists snapshot err:', err)
    );
    return () => unsubscribe();
  }, []);

  // Sync Bookings live from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const list: Booking[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Booking, 'id'>),
        }));
        setBookings(list);
      },
      (err) => console.warn('Firestore Bookings snapshot err:', err)
    );
    return () => unsubscribe();
  }, []);

  // Sync Messages live from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'messages'),
      (snapshot) => {
        const grouped: Record<string, Message[]> = {};
        snapshot.docs.forEach((docSnap) => {
          const msg = { id: docSnap.id, ...(docSnap.data() as Omit<Message, 'id'>) };
          const tId = msg.therapistId || 't1';
          if (!grouped[tId]) grouped[tId] = [];
          grouped[tId].push(msg);
        });
        setMessages(grouped);
      },
      (err) => console.warn('Firestore Messages snapshot err:', err)
    );
    return () => unsubscribe();
  }, []);

  const handleToggleRole = () => {
    const roles: ('client' | 'therapist' | 'admin')[] = ['client', 'therapist', 'admin'];
    const nextIdx = (roles.indexOf(currentUser.role) + 1) % roles.length;
    const nextRole = roles[nextIdx];

    const updated = { ...currentUser, role: nextRole };
    setCurrentUser(updated);
    nativeStorageService.saveUserProfile(updated);
  };

  const handleUpdateProfile = (updated: ClientProfile) => {
    setClientProfile(updated);
    nativeStorageService.saveClientProfile(updated);
  };

  const handleUpdateUser = (updatedUser: UserProfile, updatedClient: ClientProfile) => {
    setCurrentUser(updatedUser);
    setClientProfile(updatedClient);
    nativeStorageService.saveUserProfile(updatedUser);
    nativeStorageService.saveClientProfile(updatedClient);
  };

  const handleJoinSession = (session: BookingSession) => {
    setActiveSession(session);
    setInConsultationRoom(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.amber} />
        <Text style={styles.loadingText}>Initializing Barbaar Mobile Engine...</Text>
      </View>
    );
  }

  if (inConsultationRoom && activeSession) {
    return (
      <ConsultationRoomNative
        booking={activeSession}
        currentUserRole={currentUser.role === 'admin' ? 'therapist' : currentUser.role}
        onLeaveSession={() => setInConsultationRoom(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Bar */}
      <HeaderBar
        currentUser={currentUser}
        onToggleRole={handleToggleRole}
        onOpenProfile={() => setActiveTab('profile')}
      />

      {/* Body Content according to active tab */}
      <View style={styles.body}>
        {activeTab === 'therapists' && (
          <TherapistList
            therapists={therapists}
            clientProfile={clientProfile}
            onBookingSuccess={() => setActiveTab('sessions')}
            onOpenQuiz={() => setQuizVisible(true)}
            onOpenAidModal={() => setAidModalVisible(true)}
            upcomingBooking={bookings.find((b) => b.status === 'upcoming') || null}
            onOpenUpcomingSession={() => setActiveTab('sessions')}
            savedTherapistIds={savedTherapistIds}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsList
            bookings={bookings}
            onJoinSession={handleJoinSession}
            onNavigateToTherapists={() => setActiveTab('therapists')}
          />
        )}

        {activeTab === 'messages' && (
          <ChatRoom
            therapists={therapists}
            messages={messages}
            clientProfile={clientProfile}
            currentUser={currentUser}
            onJoinSession={handleJoinSession}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            clientProfile={clientProfile}
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onToggleRole={handleToggleRole}
            savedTherapistIds={savedTherapistIds}
            completedSessionsCount={bookings.filter((b) => b.status === 'completed').length}
            onOpenAuthModal={() => setAuthModalVisible(true)}
          />
        )}
      </View>

      {/* Bottom Navigation Ribbon */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('therapists')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabIcon, activeTab === 'therapists' && styles.tabIconActive]}>
            🏠
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'therapists' && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('sessions')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabIcon, activeTab === 'sessions' && styles.tabIconActive]}>
            📅
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'sessions' && styles.tabLabelActive]}>
            Sessions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('messages')}
          activeOpacity={0.8}
        >
          <View style={{ position: 'relative' }}>
            <Text style={[styles.tabIcon, activeTab === 'messages' && styles.tabIconActive]}>
              💬
            </Text>
            {Object.values(messages).some((list) => list.some((m) => m.sender === 'therapist' && !m.read)) && (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.amber,
                }}
              />
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === 'messages' && styles.tabLabelActive]}>
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabIconActive]}>
            👤
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Financial Aid Relief Modal */}
      <FinancialAidModal
        visible={aidModalVisible}
        onClose={() => setAidModalVisible(false)}
        clientProfile={clientProfile}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* Matching Quiz Modal */}
      <QuizModal
        visible={quizVisible}
        onClose={() => setQuizVisible(false)}
        therapists={therapists}
        onSelectTherapist={(therapist) => {
          // Booking flow will handle selected therapist
        }}
      />

      {/* Auth Modal for Google & Email Sign In */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        currentUser={currentUser}
        clientProfile={clientProfile}
        onUpdateUser={handleUpdateUser}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.indigo,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 8,
    paddingBottom: 12,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 4,
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tabIcon: {
    fontSize: 19,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#384C43',
    fontWeight: '800',
  },
});
