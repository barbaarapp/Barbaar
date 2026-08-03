import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../constants';
import { Message, Therapist, BookingSession, ClientProfile, UserProfile } from '../types';
import { db, doc, setDoc } from '../services/firebase.native';

interface ChatRoomProps {
  therapists: Therapist[];
  messages: Record<string, Message[]>;
  clientProfile: ClientProfile;
  currentUser: UserProfile;
  onJoinSession: (session: BookingSession) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  therapists,
  messages,
  clientProfile,
  currentUser,
  onJoinSession,
}) => {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>(
    therapists[0]?.id || 't1'
  );
  const [inputText, setInputText] = useState('');

  const activeTherapist = therapists.find((t) => t.id === selectedTherapistId) || therapists[0];
  const threadMessages = messages[selectedTherapistId] || [];

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newMsg: Message = {
      id: msgId,
      therapistId: selectedTherapistId,
      clientEmail: currentUser.email || clientProfile.email || 'patient@barbaar.org',
      from: currentUser.role === 'therapist' ? 'therapist' : 'client',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setInputText('');

    try {
      await setDoc(doc(db, 'messages', msgId), newMsg);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Therapist Selector Ribbon */}
      <View style={styles.selectorBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {therapists.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.therapistPill,
                selectedTherapistId === t.id && styles.therapistPillActive,
              ]}
              onPress={() => setSelectedTherapistId(t.id)}
            >
              <Text
                style={[
                  styles.therapistPillText,
                  selectedTherapistId === t.id && styles.therapistPillTextActive,
                ]}
              >
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Header Info Banner */}
      {activeTherapist && (
        <View style={styles.activeHeader}>
          <View style={[styles.avatar, { backgroundColor: activeTherapist.color || colors.amber }]}>
            <Text style={styles.avatarText}>{activeTherapist.initials}</Text>
          </View>
          <View style={styles.activeMeta}>
            <Text style={styles.activeName}>{activeTherapist.name}</Text>
            <Text style={styles.activeSub}>{activeTherapist.credentials}</Text>
          </View>

          <TouchableOpacity
            style={styles.roomLinkBtn}
            onPress={() =>
              onJoinSession({
                id: `bk_quick_${activeTherapist.id}`,
                clientName: clientProfile.name || 'Client',
                therapistName: activeTherapist.name,
                therapistId: activeTherapist.id,
                date: 'Today',
                time: 'Now',
                status: 'active',
                sessionType: 'video',
              })
            }
          >
            <Text style={styles.roomLinkText}>🎥 Video Room</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages Feed */}
      <ScrollView contentContainerStyle={styles.messagesList}>
        {threadMessages.length === 0 && (
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>
              No messages yet with {activeTherapist?.name}. Ask a question or send a greeting!
            </Text>
          </View>
        )}

        {threadMessages.map((msg) => {
          const isMe =
            (currentUser.role === 'client' && msg.from === 'client') ||
            (currentUser.role === 'therapist' && msg.from === 'therapist');

          return (
            <View
              key={msg.id}
              style={[
                styles.bubbleWrapper,
                isMe ? styles.bubbleRight : styles.bubbleLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.bubbleMe : styles.bubbleOther,
                ]}
              >
                <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
                  {msg.text}
                </Text>
                <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeOther]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type message to specialist..."
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  selectorBar: {
    backgroundColor: colors.indigoDeep,
    paddingVertical: 10,
  },
  selectorScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  therapistPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  therapistPillActive: {
    backgroundColor: colors.amber,
  },
  therapistPillText: {
    color: colors.ivory,
    fontSize: 12,
    fontWeight: '600',
  },
  therapistPillTextActive: {
    fontWeight: '800',
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  activeMeta: {
    flex: 1,
  },
  activeName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  activeSub: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  roomLinkBtn: {
    backgroundColor: colors.acaciaSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.acacia,
  },
  roomLinkText: {
    color: colors.acacia,
    fontSize: 11,
    fontWeight: '800',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
    gap: 10,
  },
  emptyMessages: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: colors.indigo,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextMe: {
    color: '#ffffff',
  },
  msgTextOther: {
    color: colors.ink,
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeOther: {
    color: colors.inkSoft,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
  },
  sendBtn: {
    backgroundColor: colors.amber,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
