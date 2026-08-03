import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../constants';
import { Booking, BookingSession } from '../types';

interface SessionsListProps {
  bookings: Booking[];
  onJoinSession: (session: BookingSession) => void;
  onNavigateToTherapists: () => void;
}

export const SessionsList: React.FC<SessionsListProps> = ({
  bookings,
  onJoinSession,
  onNavigateToTherapists,
}) => {
  const upcomingBookings = bookings.filter((b) => b.status === 'upcoming' || b.status === 'active');
  const pastBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');

  const convertToBookingSession = (b: Booking): BookingSession => ({
    id: b.id,
    clientName: b.clientName || 'Patient',
    therapistName: b.therapistName || 'Barbaar Specialist',
    therapistId: b.therapistId,
    date: b.date || 'Today',
    time: b.time || 'Scheduled',
    status: b.status === 'completed' ? 'completed' : 'confirmed',
    sessionType: 'video',
    roomUrl: b.zoomLink || undefined,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Upcoming Section */}
      <Text style={styles.sectionTitle}>📅 Scheduled Clinical Sessions</Text>
      {upcomingBookings.map((b) => (
        <View key={b.id} style={styles.sessionCard}>
          <View style={styles.badgeRow}>
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>⚡ UPCOMING SESSION</Text>
            </View>
            <Text style={styles.priceTag}>
              {b.price === 0 ? 'Subsidized' : `$${b.price || 60}`}
            </Text>
          </View>

          <Text style={styles.therapistTitle}>{b.therapistName || 'Barbaar Specialist'}</Text>
          <Text style={styles.metaLine}>
            🗓️ {b.date || 'Scheduled'} · ⏰ {b.time || '10:00 AM'} · Video & Audio
          </Text>

          {b.financialAidApplied && (
            <View style={styles.aidBanner}>
              <Text style={styles.aidBannerText}>🤝 Covered by Barbaar Financial Relief Fund</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => onJoinSession(convertToBookingSession(b))}
            activeOpacity={0.8}
          >
            <Text style={styles.joinBtnText}>🎥 Enter Consultation Room</Text>
          </TouchableOpacity>
        </View>
      ))}

      {upcomingBookings.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyTitle}>No Upcoming Sessions</Text>
          <Text style={styles.emptyDesc}>You don't have any scheduled therapy appointments right now.</Text>
          <TouchableOpacity style={styles.bookNowBtn} onPress={onNavigateToTherapists}>
            <Text style={styles.bookNowBtnText}>Browse & Book a Specialist</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Past Sessions */}
      {pastBookings.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>📜 Session History</Text>
          {pastBookings.map((b) => (
            <View key={b.id} style={styles.pastCard}>
              <View style={styles.badgeRow}>
                <Text style={styles.pastTherapist}>{b.therapistName || 'Barbaar Specialist'}</Text>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>Completed</Text>
                </View>
              </View>
              <Text style={styles.pastMeta}>
                {b.date} at {b.time}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: colors.ivory,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: colors.indigoDeep,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upcomingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upcomingBadgeText: {
    color: colors.amber,
    fontSize: 10,
    fontWeight: '800',
  },
  priceTag: {
    color: colors.ivory,
    fontSize: 12,
    fontWeight: '700',
  },
  therapistTitle: {
    color: colors.ivory,
    fontSize: 18,
    fontWeight: '800',
  },
  metaLine: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  aidBanner: {
    backgroundColor: 'rgba(100, 164, 97, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  aidBannerText: {
    color: '#64a461',
    fontSize: 11,
    fontWeight: '700',
  },
  joinBtn: {
    backgroundColor: colors.amber,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  bookNowBtn: {
    backgroundColor: colors.amber,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookNowBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  pastCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pastTherapist: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  completedBadge: {
    backgroundColor: colors.acaciaSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: colors.acacia,
    fontSize: 10,
    fontWeight: '700',
  },
  pastMeta: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 4,
  },
});
