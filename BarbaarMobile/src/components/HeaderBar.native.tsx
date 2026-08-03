import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { colors } from '../constants';
import { UserProfile } from '../types';
import { BarbaarLogo } from './BarbaarLogo.native';

interface HeaderBarProps {
  currentUser: UserProfile;
  onToggleRole: () => void;
  onOpenProfile?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ currentUser, onToggleRole, onOpenProfile }) => {
  const userInitial = (currentUser.fullName || currentUser.email || 'K')[0].toUpperCase();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onOpenProfile} activeOpacity={0.8}>
        <BarbaarLogo size={26} showText={true} variant="light" />
      </TouchableOpacity>

      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.roleToggle} onPress={onToggleRole} activeOpacity={0.8}>
          <Text style={styles.roleToggleText}>
            {currentUser.role === 'client'
              ? '👤 Client'
              : currentUser.role === 'therapist'
              ? '👨‍⚕️ Specialist'
              : '🛡️ Admin'}
          </Text>
        </TouchableOpacity>

        {onOpenProfile && (
          <TouchableOpacity style={styles.avatarButton} onPress={onOpenProfile} activeOpacity={0.8}>
            <Text style={styles.avatarButtonText}>{userInitial}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleToggle: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleToggleText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF3E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CDE2CB',
  },
  avatarButtonText: {
    color: colors.indigo,
    fontSize: 15,
    fontWeight: '800',
  },
});
