import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

type VerificationStatus = 'pending' | 'verified' | 'unverified' | 'blocked';

export default function ChatClaimModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    location?: string;
  }>();

  // Verification & Chat State
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'Finder',
      text: `Hey! I turned in the ${params.title || 'item'}. To verify it's yours, please describe any unique stickers, scratches, or what's inside/on the lock screen.`,
      time: '12:05 PM',
    },
  ]);
  const [inputText, setInputText] = useState('');

  // Meetup Scheduling State (both parties can edit)
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [scheduledMeetup, setScheduledMeetup] = useState<string | null>(null);
  const [meetupLocation, setMeetupLocation] = useState('Student Center - Main Help Desk');
  const [meetupTime, setMeetupTime] = useState('Tomorrow @ 2:00 PM');

  const handleSend = () => {
    if (!inputText.trim() || status === 'unverified' || status === 'blocked') return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'You',
        text: inputText,
        time: 'Just now',
      },
    ]);
    setInputText('');
  };

  const handleApprove = () => {
    setStatus('verified');
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'System',
        text: ' Claim approved! Ownership verified. Either party can now schedule or edit a safe campus meetup below.',
        time: 'Just now',
      },
    ]);
  };

  const handleUnverify = () => {
    setStatus('unverified');
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'System',
        text: '❌ Verification denied. Chat has been restricted for this user.',
        time: 'Just now',
      },
    ]);
  };

  const handleBlock = () => {
    const executeBlock = () => {
      setStatus('blocked');
      setMessages([]);
      Alert.alert('User Blocked', 'This user has been blocked and the conversation thread was deleted.');
      router.back();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Block User? This will restrict the user and delete this chat thread.')) {
        executeBlock();
      }
    } else {
      Alert.alert(
        'Block User',
        'Are you sure? This will delete the conversation and prevent further contact.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block & Delete', style: 'destructive', onPress: executeBlock },
        ]
      );
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Submitted',
      'A report has been sent to Campus Moderation for review. Your chat remains intact.'
    );
  };

  const handleConfirmMeetup = () => {
    if (!meetupLocation.trim() || !meetupTime.trim()) {
      Alert.alert('Incomplete Details', 'Please provide both a campus location and time.');
      return;
    }
    const isEditing = !!scheduledMeetup;
    const meetupSummary = `${meetupLocation} (${meetupTime})`;
    
    setScheduledMeetup(meetupSummary);
    setShowMeetupModal(false);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'System',
        text: isEditing
          ? `🔄 Meetup updated to: ${meetupSummary}. (Edited by either party)`
          : `📍 Meetup scheduled at: ${meetupSummary}. Public reception desk or campus police zone recommended.`,
        time: 'Just now',
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>{params.title || 'Claim Chat'}</Text>
            <Text style={styles.headerSubtitle}>
              Status: {status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.topRightActions}>
            <TouchableOpacity onPress={handleReport} style={styles.headerIconBtn}>
              <Text style={styles.reportText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBlock} style={styles.headerIconBtn}>
              <Text style={styles.blockText}>Block</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification & Meetup Control Banner */}
        <View style={styles.verificationBar}>
          <Text style={styles.barLabel}>Verification Controls:</Text>
          
          {status === 'pending' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
                <Text style={styles.btnTextWhite}>Approve Ownership</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.denyBtn} onPress={handleUnverify}>
                <Text style={styles.btnTextWhite}>Deny / Unverify</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'verified' && (
            <View style={styles.verifiedNoticeRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.verifiedBadge}> Verified</Text>
                {scheduledMeetup ? (
                  <Text style={styles.meetupConfirmedText} numberOfLines={1}>
                    📍 {scheduledMeetup}
                  </Text>
                ) : (
                  <Text style={styles.meetupPromptText}>
                    Ownership confirmed. Either party can set meetup:
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.scheduleMeetupBtn}
                onPress={() => setShowMeetupModal(true)}
              >
                <Text style={styles.scheduleBtnText}>
                  {scheduledMeetup ? 'Edit Meetup' : 'Schedule Meetup'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'unverified' && (
            <Text style={styles.restrictedWarning}>
              Chat restricted. Claimant failed verification questions.
            </Text>
          )}
        </View>

        {/* Message Stream */}
        <ScrollView contentContainerStyle={styles.messageList}>
          {messages.map((msg) => {
            const isMe = msg.sender === 'You';
            const isSystem = msg.sender === 'System';

            if (isSystem) {
              return (
                <View key={msg.id} style={styles.systemBubble}>
                  <Text style={styles.systemText}>{msg.text}</Text>
                </View>
              );
            }

            return (
              <View
                key={msg.id}
                style={[
                  styles.bubbleContainer,
                  isMe ? styles.bubbleRight : styles.bubbleLeft,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : styles.bubbleThem,
                  ]}
                >
                  <Text style={[styles.msgText, isMe && styles.msgTextMe]}>
                    {msg.text}
                  </Text>
                </View>
                <Text style={styles.timeText}>{msg.time}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar or Restriction Warning */}
        {status === 'unverified' || status === 'blocked' ? (
          <View style={styles.restrictedBar}>
            <Text style={styles.restrictedBarText}>
              Chatting is disabled because this claim is unverified.
            </Text>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Answer verification questions..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Meetup Modal (Schedule or Edit for Either Party) */}
        <Modal visible={showMeetupModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalHeading}>
                {scheduledMeetup ? 'Edit Campus Meetup' : 'Schedule Safe Campus Meetup'}
              </Text>
              <Text style={styles.modalSubheading}>
                Choose a public, safe location to exchange the item.
              </Text>

              <Text style={styles.inputLabel}>Campus Location</Text>
              <TextInput
                style={styles.modalInput}
                value={meetupLocation}
                onChangeText={setMeetupLocation}
                placeholder="e.g. Student Center Info Desk"
              />

              <Text style={styles.inputLabel}>Date & Time</Text>
              <TextInput
                style={styles.modalInput}
                value={meetupTime}
                onChangeText={setMeetupTime}
                placeholder="e.g. Wednesday @ 1:30 PM"
              />

              <TouchableOpacity
                style={styles.confirmMeetupBtn}
                onPress={handleConfirmMeetup}
              >
                <Text style={styles.btnTextWhite}>
                  {scheduledMeetup ? 'Save Changes' : 'Confirm Meetup'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowMeetupModal(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  closeBtn: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#ff914d',
    fontWeight: '600',
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconBtn: {
    paddingVertical: 4,
  },
  reportText: {
    color: '#ea580c',
    fontSize: 13,
    fontWeight: '600',
  },
  blockText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  verificationBar: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  barLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  denyBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnTextWhite: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  verifiedNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  meetupConfirmedText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
  },
  meetupPromptText: {
    fontSize: 12,
    color: '#64748b',
  },
  scheduleMeetupBtn: {
    backgroundColor: '#ff914d',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scheduleBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  restrictedWarning: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  messageList: {
    flexGrow: 1,
    padding: 16,
    gap: 10,
  },
  systemBubble: {
    backgroundColor: '#fff7ed',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
    alignItems: 'center',
    marginVertical: 4,
  },
  systemText: {
    fontSize: 12,
    color: '#9a3412',
    textAlign: 'center',
    fontWeight: '500',
  },
  bubbleContainer: {
    marginBottom: 4,
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  bubbleThem: {
    backgroundColor: '#f1f5f9',
  },
  bubbleMe: {
    backgroundColor: '#ff1fa9',
  },
  msgText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 18,
  },
  msgTextMe: {
    color: '#ffffff',
  },
  timeText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3,
    marginHorizontal: 4,
  },
  restrictedBar: {
    backgroundColor: '#fef2f2',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
    alignItems: 'center',
  },
  restrictedBarText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#ff914d',
    borderRadius: 20,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  modalSubheading: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  confirmMeetupBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelModalBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelModalText: {
    color: '#64748b',
    fontSize: 13,
  },
});