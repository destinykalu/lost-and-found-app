import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform, // <-- 1. Add Platform here
} from 'react-native';
import { supabase } from './src/lib/supabase';

export default function App() {
  const [campuses, setCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // ----------------------------------------------------
  // 2. Put the handleGoogleAuth function RIGHT HERE:
  // ----------------------------------------------------
  const handleGoogleAuth = async () => {
    try {
      setActionNotice('Connecting to Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
        },
      });

      if (error) throw error;
      setActionNotice('Redirecting to Google login...');
    } catch (err) {
      setActionNotice(`Auth Error: ${err.message || String(err)}`);
    }
  };

  useEffect(() => {
    async function loadCampuses() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('campuses')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) {
          setActionNotice(`Error loading schools: ${error.message}`);
        } else if (data) {
          setCampuses(data);
        }
      } catch (err) {
        setActionNotice(`Network error: ${err.message || String(err)}`);
      } finally {
        setLoading(false);
      }
    }

    loadCampuses();
  }, []);

  const handleContinue = () => {
    if (!selectedCampus) {
      setActionNotice('Please select your campus before continuing.');
    } else {
      setActionNotice(`Success! Navigating to homepage for ${selectedCampus.name}...`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.pinkCard}>
          <View style={styles.whiteCard}>
            
            <View style={styles.logoContainer}>
              <Text style={styles.brandTitle}>FoundU</Text>
              <Text style={styles.brandSubtitle}>Lost & Found Campus Network</Text>
            </View>

            <View style={styles.formContainer}>
              
              {/* 3. Wire the function into onPress here: */}
              <TouchableOpacity
                style={styles.googleButton}
                activeOpacity={0.7}
                onPress={handleGoogleAuth}
              >
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Campus Selector Button */}
              <TouchableOpacity
                style={styles.campusPicker}
                activeOpacity={0.7}
                onPress={() => setModalVisible(true)}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ff914d" />
                ) : (
                  <Text style={[
                    styles.campusPickerText,
                    selectedCampus && styles.campusSelectedText
                  ]}>
                    {selectedCampus ? selectedCampus.name : 'Select Campus'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.continueButton}
                activeOpacity={0.7}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>

              {/* Status Notice */}
              {actionNotice ? (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>{actionNotice}</Text>
                </View>
              ) : null}

            </View>
          </View>
        </View>

        {/* Dynamic Campus Picker Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Your Campus</Text>
              
              {campuses.length === 0 ? (
                <Text style={styles.emptyNotice}>No campuses found.</Text>
              ) : (
                <FlatList
                  data={campuses}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedCampus(item);
                        setModalVisible(false);
                        setActionNotice(`Campus selected: ${item.name}`);
                      }}
                    >
                      <Text style={styles.modalItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#ff914d',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pinkCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ff1fa9',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  whiteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 28,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ff1fa9',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
  },
  googleButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    cursor: 'pointer',
  },
  googleButtonText: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '600',
  },
  campusPicker: {
    backgroundColor: '#f1f5f9',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    cursor: 'pointer',
    minHeight: 48,
    justifyContent: 'center',
  },
  campusPickerText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  campusSelectedText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#ff914d',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    cursor: 'pointer',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  noticeBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 8,
  },
  noticeText: {
    color: '#ea580c',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    padding: 20,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemText: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyNotice: {
    textAlign: 'center',
    color: '#94a3b8',
    paddingVertical: 20,
  },
});