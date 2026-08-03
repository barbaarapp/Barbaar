import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { colors } from '../constants';
import { ClientProfile, UserProfile } from '../types';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  clientProfile: ClientProfile;
  onUpdateUser: (updatedUser: UserProfile, updatedClient: ClientProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  currentUser,
  clientProfile,
  onUpdateUser,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleGoogleSignIn = () => {
    // Standard Google SSO flow simulation
    const simulatedEmail = 'user.google@gmail.com';
    const simulatedName = 'Google Account User';

    const updatedUser: UserProfile = {
      ...currentUser,
      fullName: simulatedName,
      email: simulatedEmail,
    };
    const updatedClient: ClientProfile = {
      ...clientProfile,
      name: simulatedName,
      email: simulatedEmail,
    };

    onUpdateUser(updatedUser, updatedClient);
    Alert.alert(
      'Signed In with Google! 🟢',
      `Welcome back, ${simulatedName} (${simulatedEmail}). Your account profile is now synced.`
    );
    onClose();
  };

  const handleSubmit = () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to sign in.');
      return;
    }

    const displayName = fullName.trim() || email.split('@')[0];
    const updatedUser: UserProfile = {
      ...currentUser,
      fullName: displayName,
      email: email.trim().toLowerCase(),
    };
    const updatedClient: ClientProfile = {
      ...clientProfile,
      name: displayName,
      email: email.trim().toLowerCase(),
      phone: phone.trim() || clientProfile.phone,
    };

    onUpdateUser(updatedUser, updatedClient);
    Alert.alert(
      'Account Synced! 🎉',
      `Signed in successfully as ${displayName} (${email.trim()}).`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🔐</Text>
              </View>
              <Text style={styles.title}>
                {mode === 'signin' ? 'Sign In to Barbaar' : 'Create an Account'}
              </Text>
              <Text style={styles.subtitle}>
                Access your session history, confidential messages, and financial relief status.
              </Text>
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.88}>
              <Text style={styles.googleIcon}>🔴</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Farhiya Ali"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. name@example.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +252 61 XXX XXXX"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.88}>
              <Text style={styles.submitBtnText}>
                {mode === 'signin' ? 'Sign In' : 'Register Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleModeBtn}
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <Text style={styles.toggleModeText}>
                {mode === 'signin'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.ivory,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '85%',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 6,
  },
  closeText: {
    fontSize: 20,
    color: colors.inkSoft,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.sageLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CDE2CB',
  },
  iconText: {
    fontSize: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  googleIcon: {
    fontSize: 16,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.ink,
  },
  submitBtn: {
    backgroundColor: colors.indigo,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleModeBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
  toggleModeText: {
    fontSize: 12,
    color: colors.amber,
    fontWeight: '700',
  },
});
