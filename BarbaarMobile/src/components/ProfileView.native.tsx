import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Share,
} from 'react-native';
import { colors } from '../constants';
import { ClientProfile, UserProfile } from '../types';
import { FinancialAidModal } from './FinancialAidModal.native';

interface ProfileViewProps {
  clientProfile: ClientProfile;
  currentUser: UserProfile;
  onUpdateProfile: (updated: ClientProfile) => void;
  onToggleRole: () => void;
  savedTherapistIds?: string[];
  completedSessionsCount?: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  clientProfile,
  currentUser,
  onUpdateProfile,
  onToggleRole,
  savedTherapistIds = [],
  completedSessionsCount = 0,
}) => {
  const [name, setName] = useState(clientProfile.name || currentUser.fullName || '');
  const [email, setEmail] = useState(clientProfile.email || currentUser.email || '');
  const [phone, setPhone] = useState(clientProfile.phone || '');
  const [lang, setLang] = useState<'so' | 'en'>(clientProfile.language || 'so');
  const [aidModalVisible, setAidModalVisible] = useState(false);

  // Subscreens: 'main' | 'invite' | 'notifications' | 'support' | 'terms' | 'privacy'
  const [subscreen, setSubscreen] = useState<
    'main' | 'invite' | 'notifications' | 'support' | 'terms' | 'privacy'
  >('main');

  // Notification Toggles
  const [emailAlert, setEmailAlert] = useState(true);
  const [smsAlert, setSmsAlert] = useState(true);
  const [whatsappAlert, setWhatsappAlert] = useState(true);

  // Support messages state
  const [supportMessages, setSupportMessages] = useState<
    { id: string; sender: 'user' | 'support'; text: string; time: string }[]
  >([
    {
      id: '1',
      sender: 'support',
      text: 'Asc! Welcome to Barbaar Care Desk. How can we support your therapy journey today?',
      time: '10:00 AM',
    },
  ]);
  const [supportInput, setSupportInput] = useState('');

  const handleSave = () => {
    const updated: ClientProfile = {
      ...clientProfile,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      language: lang,
    };
    onUpdateProfile(updated);
    Alert.alert('Profile Saved', 'Your account settings have been updated successfully.');
  };

  const aidStatus = clientProfile.financialAidStatus || 'none';
  const referralCode = `BARBAAR-${(name || 'USER').split(' ')[0].toUpperCase()}-REF7`;
  const referralLink = `https://barbaar.app/invite?code=${referralCode}`;

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Asc! I'm using Barbaar Wellness for clinical therapy. Use my invite code ${referralCode} or link to get 30% off your first session: ${referralLink}`,
      });
    } catch (error) {
      Alert.alert('Share Link', `Referral code: ${referralCode}\nLink: ${referralLink}`);
    }
  };

  const handleSendSupportMessage = () => {
    if (!supportInput.trim()) return;
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      text: supportInput.trim(),
      time: 'Just now',
    };
    setSupportMessages((prev) => [...prev, userMsg]);
    setSupportInput('');

    // Auto reply
    setTimeout(() => {
      const replyMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'support' as const,
        text: 'Mahadsanid for reaching out! A Barbaar care representative will respond shortly.',
        time: 'Just now',
      };
      setSupportMessages((prev) => [...prev, replyMsg]);
    }, 1000);
  };

  // Subscreen: Invite Friends
  if (subscreen === 'invite') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => setSubscreen('main')}>
          <Text style={styles.backText}>‹ Back to Profile</Text>
        </TouchableOpacity>

        <View style={styles.subHeader}>
          <Text style={styles.subBadge}>🎁 INVITE & EARN</Text>
          <Text style={styles.subTitle}>Invite Friends, Earn Care</Text>
          <Text style={styles.subDesc}>
            Share the gift of mental well-being. Give your friends 30% off, and earn $25 credit for each successful booking!
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Your Exclusive Invite Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode}</Text>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShareInvite}>
            <Text style={styles.shareBtnText}>📲 Share Invite Link</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Earnings History</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>4</Text>
              <Text style={styles.statLabel}>Invites Sent</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>2</Text>
              <Text style={styles.statLabel}>Registered</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.amber }]}>$50</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Subscreen: Notifications
  if (subscreen === 'notifications') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => setSubscreen('main')}>
          <Text style={styles.backText}>‹ Back to Profile</Text>
        </TouchableOpacity>

        <View style={styles.subHeader}>
          <Text style={styles.subBadge}>🔔 ALERTS & REMINDERS</Text>
          <Text style={styles.subTitle}>Notification Settings</Text>
          <Text style={styles.subDesc}>
            Customize how you receive calendar updates and appointment session alerts.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Gmail Email Reminders</Text>
              <Text style={styles.switchDesc}>
                Receive calendar invites and invoices directly to {email || 'your email'}.
              </Text>
            </View>
            <Switch
              value={emailAlert}
              onValueChange={setEmailAlert}
              trackColor={{ false: '#cbd5e1', true: colors.amber }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Mobile SMS Alerts</Text>
              <Text style={styles.switchDesc}>
                Text notification 1 hour before your session starts.
              </Text>
            </View>
            <Switch
              value={smsAlert}
              onValueChange={setSmsAlert}
              trackColor={{ false: '#cbd5e1', true: colors.amber }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>WhatsApp Direct Reminders</Text>
              <Text style={styles.switchDesc}>
                Instant WhatsApp notifications for instant booking confirmations.
              </Text>
            </View>
            <Switch
              value={whatsappAlert}
              onValueChange={setWhatsappAlert}
              trackColor={{ false: '#cbd5e1', true: colors.amber }}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  // Subscreen: Support Chat
  if (subscreen === 'support') {
    return (
      <View style={styles.flexOne}>
        <View style={styles.chatTopBar}>
          <TouchableOpacity onPress={() => setSubscreen('main')}>
            <Text style={styles.backTextHeader}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>💬 Barbaar Support Desk</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.chatContent}>
          {supportMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.msgBubble,
                msg.sender === 'user' ? styles.msgBubbleUser : styles.msgBubbleSupport,
              ]}
            >
              <Text
                style={[
                  styles.msgText,
                  msg.sender === 'user' ? styles.msgTextUser : styles.msgTextSupport,
                ]}
              >
                {msg.text}
              </Text>
              <Text style={styles.msgTime}>{msg.time}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type your message..."
            placeholderTextColor="#94a3b8"
            value={supportInput}
            onChangeText={setSupportInput}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendSupportMessage}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Subscreen: Terms
  if (subscreen === 'terms') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => setSubscreen('main')}>
          <Text style={styles.backText}>‹ Back to Profile</Text>
        </TouchableOpacity>

        <View style={styles.subHeader}>
          <Text style={styles.subBadge}>📜 LEGAL TERMS</Text>
          <Text style={styles.subTitle}>Terms & Conditions</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.legalBody}>
            1. Services Provided: Barbaar Wellness provides a platform connecting clients with licensed clinical specialists.
            {'\n\n'}
            2. Confidentiality & Safety: Client privacy is strictly preserved in compliance with clinical ethics and healthcare standards.
            {'\n\n'}
            3. Crisis Policy: Barbaar Care is for scheduled non-emergency consultations. If experiencing an immediate medical crisis, please contact emergency local services.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Subscreen: Privacy
  if (subscreen === 'privacy') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => setSubscreen('main')}>
          <Text style={styles.backText}>‹ Back to Profile</Text>
        </TouchableOpacity>

        <View style={styles.subHeader}>
          <Text style={styles.subBadge}>🛡️ PRIVACY POLICY</Text>
          <Text style={styles.subTitle}>Privacy Policy</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.legalBody}>
            Your data security and privacy are paramount.
            {'\n\n'}
            - End-to-End Encryption for all private messaging streams.
            {'\n'}
            - No third-party data tracking or selling.
            {'\n'}
            - Secure HIPAA & GDPR compliant storage systems.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Default Main Profile View
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Badge */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {(name || 'B').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{name || 'Barbaar Patient'}</Text>
        <Text style={styles.userEmail}>{email || 'patient@barbaar.org'}</Text>

        <TouchableOpacity style={styles.roleBtn} onPress={onToggleRole}>
          <Text style={styles.roleBtnText}>
            Active Role: {currentUser.role.toUpperCase()} (Tap to Switch)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🤝</Text>
          <Text style={styles.statValue}>
            {aidStatus === 'approved' ? 'Subsidized' : aidStatus === 'pending' ? 'Pending' : 'Standard'}
          </Text>
          <Text style={styles.statLabel}>Care Plan</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>{completedSessionsCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statValue}>{savedTherapistIds.length}</Text>
          <Text style={styles.statLabel}>Liked Specialists</Text>
        </View>
      </View>

      {/* Menu Options List */}
      <Text style={styles.sectionTitle}>⚙️ Dashboard Settings</Text>
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuRow} onPress={() => setSubscreen('invite')}>
          <Text style={styles.menuIcon}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Invite Friends, Earn Care</Text>
            <Text style={styles.menuSubText}>Get $25 credit per referral</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuRow} onPress={() => setSubscreen('notifications')}>
          <Text style={styles.menuIcon}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Notification Settings</Text>
            <Text style={styles.menuSubText}>Manage SMS, Gmail & WhatsApp alerts</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuRow} onPress={() => setSubscreen('support')}>
          <Text style={styles.menuIcon}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Support Desk & Chat</Text>
            <Text style={styles.menuSubText}>Connect with Barbaar care team</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuRow} onPress={() => setSubscreen('terms')}>
          <Text style={styles.menuIcon}>📜</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Terms & Conditions</Text>
            <Text style={styles.menuSubText}>Review terms of service</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuRow} onPress={() => setSubscreen('privacy')}>
          <Text style={styles.menuIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Text style={styles.menuSubText}>Read clinical data privacy details</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Financial Relief Status Section */}
      <Text style={styles.sectionTitle}>🤝 Barbaar Financial Relief</Text>
      <View style={styles.card}>
        {aidStatus === 'approved' && (
          <View style={styles.statusBoxApproved}>
            <Text style={styles.statusTitleApproved}>✅ Financial Relief Approved</Text>
            <Text style={styles.statusDescApproved}>
              Your sessions are 100% subsidized by the Barbaar Community Wellness Fund. Select "Apply Approved Relief" when booking!
            </Text>
          </View>
        )}

        {aidStatus === 'pending' && (
          <View style={styles.statusBoxPending}>
            <Text style={styles.statusTitlePending}>⏳ Application Under Review</Text>
            <Text style={styles.statusDescPending}>
              Our review committee is evaluating your application for subsidized therapy care. You will receive an update shortly.
            </Text>
          </View>
        )}

        {aidStatus === 'none' && (
          <View>
            <Text style={styles.cardHeader}>Need Assistance with Session Costs?</Text>
            <Text style={styles.cardBody}>
              Financial constraints should never stand in the way of mental health. Apply for subsidized sessions through our community relief fund.
            </Text>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setAidModalVisible(true)}
            >
              <Text style={styles.applyBtnText}>Apply for Financial Relief</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Personal Info Form */}
      <Text style={styles.sectionTitle}>👤 Personal Information</Text>
      <View style={styles.card}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Farhiya Ali"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="e.g. farhiya@barbaar.org"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+252 61 XXX XXXX or +1 XXX XXX XXXX"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Preferred Language</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langChip, lang === 'so' && styles.langChipActive]}
            onPress={() => setLang('so')}
          >
            <Text style={[styles.langText, lang === 'so' && styles.langTextActive]}>
              Somali (Af-Somali)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langChip, lang === 'en' && styles.langChipActive]}
            onPress={() => setLang('en')}
          >
            <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>
              English
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      {/* App Info Footer */}
      <View style={styles.aboutBox}>
        <Text style={styles.aboutTitle}>Barbaar Wellness v1.0.1</Text>
        <Text style={styles.aboutDesc}>
          Connecting Somali communities worldwide with licensed, faith-grounded & culturally safe clinical care.
        </Text>
      </View>

      <FinancialAidModal
        visible={aidModalVisible}
        onClose={() => setAidModalVisible(false)}
        clientProfile={clientProfile}
        onUpdateProfile={onUpdateProfile}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: colors.ivory,
  },
  backRow: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.indigo,
  },
  subHeader: {
    marginBottom: 16,
  },
  subBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.amber,
    letterSpacing: 1,
  },
  subTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 2,
  },
  subDesc: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 18,
    marginTop: 4,
  },
  codeBox: {
    backgroundColor: colors.amberSoft,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.indigo,
    letterSpacing: 1,
  },
  shareBtn: {
    backgroundColor: colors.amber,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  switchDesc: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 8,
  },
  chatTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.indigoDeep,
  },
  backTextHeader: {
    color: colors.amber,
    fontSize: 14,
    fontWeight: '800',
  },
  chatHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
  },
  msgBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.amber,
  },
  msgBubbleSupport: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.line,
  },
  msgText: {
    fontSize: 13,
  },
  msgTextUser: {
    color: '#ffffff',
  },
  msgTextSupport: {
    color: colors.ink,
  },
  msgTime: {
    fontSize: 9,
    color: 'rgba(0,0,0,0.4)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chatInputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.ink,
  },
  sendBtn: {
    backgroundColor: colors.amber,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  legalBody: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 20,
  },
  profileHeaderCard: {
    backgroundColor: colors.indigoDeep,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ivory,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    marginBottom: 12,
  },
  roleBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBtnText: {
    color: colors.amber,
    fontSize: 11,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  statLabel: {
    fontSize: 10,
    color: colors.inkSoft,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  menuSubText: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 1,
  },
  menuArrow: {
    fontSize: 18,
    color: colors.inkSoft,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  cardBody: {
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  applyBtn: {
    backgroundColor: colors.acacia,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  statusBoxApproved: {
    backgroundColor: colors.acaciaSoft,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.acacia,
  },
  statusTitleApproved: {
    color: colors.acacia,
    fontSize: 14,
    fontWeight: '800',
  },
  statusDescApproved: {
    color: colors.ink,
    fontSize: 12,
    marginTop: 4,
  },
  statusBoxPending: {
    backgroundColor: colors.amberSoft,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  statusTitlePending: {
    color: colors.amber,
    fontSize: 14,
    fontWeight: '800',
  },
  statusDescPending: {
    color: colors.ink,
    fontSize: 12,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.ink,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  langChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  langChipActive: {
    backgroundColor: colors.indigo,
    borderColor: colors.indigo,
  },
  langText: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: '600',
  },
  langTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: colors.amber,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  aboutBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.inkSoft,
  },
  aboutDesc: {
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});
