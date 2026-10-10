import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useCampus } from '../lib/CampusContext';

export default function SmartSearchScreen() {
  const { selectedCampusId } = useCampus();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

  // 1. Open the camera and snap a photo
  const takePhotoAndSearch = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("We need camera access to scan your item!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      processVisualSearch(result.assets[0].base64);
    }
  };

  // 2. Generate embedding and query Supabase
  const processVisualSearch = async (base64Image: string | null | undefined) => {
    if (!base64Image) return;
    setIsSearching(true);

    try {
      // A. GENERATE EMBEDDING: Call your live Supabase Edge Function
      const embeddingArray = await generateImageEmbedding(base64Image); 

      // B. QUERY SUPABASE: Pass the vector and dynamic campus ID
      const { data, error } = await supabase.rpc('match_found_items', {
        query_embedding: embeddingArray, 
        match_threshold: 0.6,
        match_count: 5,
        filter_campus: selectedCampusId,
      });

      if (error) throw error;
      setMatches(data || []);

    } catch (error) {
      console.error("Search failed:", error);
      alert("Couldn't find a match. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Call the live Supabase Edge Function
  const generateImageEmbedding = async (base64Str: string): Promise<number[]> => {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { base64Image: base64Str }
    });

    if (error) {
      throw new Error("Failed to analyze image");
    }

    return data.embedding; 
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.scanButton} onPress={takePhotoAndSearch}>
        <Text style={styles.buttonText}>📷 Scan Lost Item</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      
      {isSearching && <ActivityIndicator size="large" color="#0000ff" />}

      {/* Render Results */}
      {matches.map((item) => (
        <View key={item.id} style={styles.matchCard}>
          <Text style={styles.matchTitle}>{item.title}</Text>
          <Text>Match: {Math.round(item.similarity * 100)}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  scanButton: { backgroundColor: '#007BFF', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  preview: { width: 300, height: 300, marginTop: 20, borderRadius: 10 },
  matchCard: { padding: 15, backgroundColor: '#f0f0f0', marginTop: 10, width: '100%', borderRadius: 8 },
  matchTitle: { fontWeight: 'bold', fontSize: 18 }
});