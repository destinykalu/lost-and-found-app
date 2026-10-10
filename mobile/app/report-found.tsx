import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { useCampus } from '../lib/CampusContext';

export default function ReportFoundScreen() {
  const router = useRouter();
  const { selectedCampusId } = useCampus();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Snap a photo of the found item
  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // 2. Process and submit the item
  const submitFoundItem = async () => {
    if (!image || !title || !location) {
      Alert.alert("Missing Info", "Please provide a photo, title, and location.");
      return;
    }

    setIsSubmitting(true);

    try {
      // A. Upload Image to Supabase Storage
      const fileName = `${Date.now()}-found-item.jpg`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('item-images')
        .upload(fileName, decode(image.base64!), {
          contentType: 'image/jpeg',
        });

      if (storageError) throw storageError;

      // Public URL to save in the database
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);

      // B. Generate the AI Vector Embedding
      const embeddingArray = await generateImageEmbedding(image.base64!);

      // C. Save to the items table using dynamic campus ID
      const { error: dbError } = await supabase.from('items').insert({
        campus_id: selectedCampusId,
        type: 'found',
        title: title,
        description: description,
        location: location,
        image_url: publicUrl,
        embedding: embeddingArray,
        user_id: 'dummy-user-id',
        status: 'active'
      });

      if (dbError) throw dbError;

      Alert.alert("Success!", "Item reported successfully.");
      router.back();

    } catch (error: any) {
      console.error(error);
      Alert.alert("Upload Failed", error.message);
    } finally {
      setIsSubmitting(false);
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
      <Text style={styles.header}>Report a Found Item</Text>

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imageButtonText}>📷 Snap a Photo</Text>
        )}
      </TouchableOpacity>

      <TextInput 
        style={styles.input} 
        placeholder="Item Title (e.g. Blue Hydro Flask)" 
        value={title} 
        onChangeText={setTitle} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Where did you find it?" 
        value={location} 
        onChangeText={setLocation} 
      />
      <TextInput 
        style={[styles.input, { height: 80 }]} 
        placeholder="Extra details..." 
        multiline 
        value={description} 
        onChangeText={setDescription} 
      />

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={submitFoundItem} 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Found Item</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  imageButton: { height: 200, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  imagePreview: { width: '100%', height: '100%', borderRadius: 12 },
  imageButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 15, borderRadius: 10, marginBottom: 15 },
  submitButton: { backgroundColor: '#16a34a', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});