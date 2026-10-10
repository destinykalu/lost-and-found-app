import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

export default function PostItemScreen() {
  const [itemType, setItemType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !location.trim()) {
      alert('Please fill in both the item title and location.');
      return;
    }
    alert(`Success! "${title}" submitted as ${itemType.toUpperCase()}.`);
    setTitle('');
    setLocation('');
    setDescription('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Toggle Lost / Found */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              itemType === 'lost' && styles.toggleBtnLostActive,
            ]}
            onPress={() => setItemType('lost')}
          >
            <Text
              style={[
                styles.toggleText,
                itemType === 'lost' && styles.toggleTextActive,
              ]}
            >
              I Lost Something
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              itemType === 'found' && styles.toggleBtnFoundActive,
            ]}
            onPress={() => setItemType('found')}
          >
            <Text
              style={[
                styles.toggleText,
                itemType === 'found' && styles.toggleTextActive,
              ]}
            >
              I Found Something
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Item Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Silver MacBook Air, Car Keys, Student ID"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Student Center 2nd Floor, Library Quiet Area"
            placeholderTextColor="#94a3b8"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description & Distinguishing Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Include color, stickers, keychains, or condition..."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>
            Submit {itemType === 'lost' ? 'Lost' : 'Found'} Report
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  toggleBtnLostActive: {
    backgroundColor: '#ef4444',
  },
  toggleBtnFoundActive: {
    backgroundColor: '#10b981',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#ff914d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});