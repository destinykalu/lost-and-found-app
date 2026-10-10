import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';

// Types for funnel states
type Stage = 'onboarding' | 'action_select' | 'intake' | 'results';

const CAMPUSES = [
  'Clark Atlanta University',
  'Morehouse College',
  'Spelman College',
  'Georgia State University',
  'Georgia Tech',
  'Savannah State University',
];

const MOCK_DB_ITEMS = [
  {
    id: '1',
    title: 'AirPods Pro (2nd Gen with lanyard)',
    location: 'Student Center, 2nd Floor Lounge',
    date: 'Found 20 mins ago',
    type: 'found',
    matchScore: '95% Match',
  },
  {
    id: '2',
    title: 'Blue Hydro Flask 32oz (with stickers)',
    location: 'Library Quiet Area',
    date: 'Found Today, 11:30 AM',
    type: 'found',
    matchScore: '88% Match',
  },
  {
    id: '3',
    title: 'Black leather wallet / student ID',
    location: 'Campus Dining Hall',
    date: 'Found Yesterday',
    type: 'found',
    matchScore: '80% Match',
  },
];

export default function AppFunnelScreen() {
  const router = useRouter();

  // Stage Management
  const [stage, setStage] = useState<Stage>('onboarding');
  
  // Intake State
  const [selectedCampus, setSelectedCampus] = useState('Georgia State University');
  const [campusPickerOpen, setCampusPickerOpen] = useState(false);
  const [actionType, setActionType] = useState<'lost' | 'found'>('lost');
  const [description, setDescription] = useState('');
  const [locationHint, setLocationHint] = useState('');

  // -----------------------------------------------------------------
  // STAGE 1: LOG IN & CHOOSE CAMPUS
  // -----------------------------------------------------------------
  if (stage === 'onboarding') {
    return (
      <SafeAreaView style={styles.containerOrange}>
        <View style={styles.pinkCard}>
          <View style={styles.whiteCard}>
            <Text style={styles.brandTitle}>FoundU</Text>
            <Text style={styles.brandSubtitle}>Lost & Found Campus Network</Text>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => alert('Signed in as student!')}
            >
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setCampusPickerOpen(true)}
            >
              <Text style={styles.pickerBtnText}>🏫 {selectedCampus}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => setStage('action_select')}
            >
              <Text style={styles.continueBtnText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Campus Modal */}
        <Modal visible={campusPickerOpen} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalHeading}>Select Your Campus</Text>
              {CAMPUSES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedCampus(c);
                    setCampusPickerOpen(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{c}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setCampusPickerOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // -----------------------------------------------------------------
  // STAGE 2: "I FOUND SMTH" vs "I LOST SMTH"
  // -----------------------------------------------------------------
  if (stage === 'action_select') {
    return (
      <SafeAreaView style={styles.containerWhite}>
        <View style={styles.screenHeader}>
          <Text style={styles.campusTag}>📍 {selectedCampus}</Text>
          <Text style={styles.screenTitle}>What brings you here today?</Text>
        </View>

        <View style={styles.choiceGroup}>
          <TouchableOpacity
            style={[styles.bigActionCard, styles.cardLost]}
            onPress={() => {
              setActionType('lost');
              setStage('intake');
            }}
          >
            <Text style={styles.actionEmoji}>🔍</Text>
            <Text style={styles.actionTitle}>I Lost Something</Text>
            <Text style={styles.actionDesc}>
              Tell us what is missing and we'll immediately match it against items turned in on campus.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigActionCard, styles.cardFound]}
            onPress={() => {
              setActionType('found');
              setStage('intake');
            }}
          >
            <Text style={styles.actionEmoji}>🤝</Text>
            <Text style={styles.actionTitle}>I Found Something</Text>
            <Text style={styles.actionDesc}>
              Snap a photo or describe the item so the rightful owner can verify and claim it.
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => setStage('onboarding')}
        >
          <Text style={styles.backLinkText}>← Switch Campus / Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // -----------------------------------------------------------------
  // STAGE 3: DESCRIBE OR UPLOAD PHOTO
  // -----------------------------------------------------------------
  if (stage === 'intake') {
    const isLost = actionType === 'lost';
    return (
      <SafeAreaView style={styles.containerWhite}>
        <ScrollView contentContainerStyle={styles.intakeScroll}>
          <TouchableOpacity onPress={() => setStage('action_select')}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>
            {isLost ? 'Describe what you lost' : 'Describe what you found'}
          </Text>
          <Text style={styles.subPrompt}>
            {isLost
              ? 'Our matching system will check current campus listings in real time.'
              : 'Add key details so owners can find it easily.'}
          </Text>

          {/* Photo Upload Box */}
          <TouchableOpacity
            style={styles.photoUploadBox}
            onPress={() => alert('Image picker opened! Select photo from gallery.')}
          >
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadTitle}>Take photo or upload image</Text>
            <Text style={styles.uploadHint}>Helps verify ownership faster</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR DESCRIBE IT</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Text Inputs */}
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>What is the item? *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. AirPods Pro case, Blue Hydro Flask, Car keys"
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.fieldLabel}>Where was it lost/found? *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Student Center 2nd floor, Library, Dining Hall"
              placeholderTextColor="#94a3b8"
              value={locationHint}
              onChangeText={setLocationHint}
            />

            <TouchableOpacity
              style={styles.findMatchBtn}
              onPress={() => {
                if (!description.trim()) {
                  alert('Please enter a brief description first.');
                  return;
                }
                setStage('results');
              }}
            >
              <Text style={styles.findMatchBtnText}>
                {isLost ? 'Search Best Matches →' : 'Publish Found Item →'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -----------------------------------------------------------------
  // STAGE 4 & 5: BEST MATCHES & "THIS IS MY ITEM" -> CHAT
  // -----------------------------------------------------------------
  return (
    <SafeAreaView style={styles.containerWhite}>
      <View style={styles.resultsHeader}>
        <TouchableOpacity onPress={() => setStage('intake')}>
          <Text style={styles.backLinkText}>← Edit Search</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Best Campus Matches</Text>
        <Text style={styles.subPrompt}>
          Items found at {selectedCampus} matching "{description || 'recent items'}"
        </Text>
      </View>

      <FlatList
        data={MOCK_DB_ITEMS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            <View style={styles.matchTop}>
              <Text style={styles.matchBadge}>{item.matchScore}</Text>
              <Text style={styles.matchDate}>{item.date}</Text>
            </View>

            <Text style={styles.matchTitle}>{item.title}</Text>
            <Text style={styles.matchLoc}>📍 {item.location}</Text>

            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => {
                // Open Item Detail & Chat
                router.push({
                  pathname: '/modal',
                  params: {
                    id: item.id,
                    title: item.title,
                    location: item.location,
                    type: item.type,
                    date: item.date,
                  },
                });
              }}
            >
              <Text style={styles.claimButtonText}>This is my item! (Verify & Chat)</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerOrange: {
    flex: 1,
    backgroundColor: '#ff914d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  containerWhite: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  pinkCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ff1fa9',
    borderRadius: 24,
    padding: 16,
  },
  whiteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ff1fa9',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 24,
  },
  googleBtn: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleBtnText: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: 15,
  },
  pickerBtn: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerBtnText: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: 14,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: '#ff914d',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Screen 2
  screenHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  campusTag: {
    fontSize: 13,
    color: '#ff914d',
    fontWeight: '700',
    marginBottom: 6,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subPrompt: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  choiceGroup: {
    padding: 24,
    gap: 16,
    flex: 1,
    justifyContent: 'center',
  },
  bigActionCard: {
    borderRadius: 18,
    padding: 24,
    borderWidth: 2,
  },
  cardLost: {
    backgroundColor: '#fff1f2',
    borderColor: '#fda4af',
  },
  cardFound: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  actionDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  backLink: {
    padding: 20,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },

  // Screen 3: Intake
  intakeScroll: {
    padding: 24,
  },
  photoUploadBox: {
    marginTop: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  uploadHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  formSection: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    marginBottom: 10,
  },
  findMatchBtn: {
    backgroundColor: '#ff1fa9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  findMatchBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Screen 4: Results
  resultsHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  resultsList: {
    padding: 16,
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  matchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  matchTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  matchLoc: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 14,
  },
  claimButton: {
    backgroundColor: '#ff914d',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    width: '100%',
    maxWidth: 340,
    padding: 20,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOptionText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#334155',
  },
  modalCancel: {
    marginTop: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#ef4444',
    fontWeight: '600',
  },
});