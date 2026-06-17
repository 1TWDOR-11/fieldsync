import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, SafeAreaView, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApi } from '../hooks/useApi';

export default function Occurrence() {
  const { task_id, task_title } = useLocalSearchParams();
  const api = useApi();
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos acessar a galeria'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos acessar a câmera'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function handleSubmit() {
    if (!description.trim()) { Alert.alert('Atenção', 'Digite uma descrição'); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append('description', description);
    if (task_id) formData.append('task_id', task_id);
    if (image) {
      formData.append('image', { uri: image.uri, name: 'occurrence.jpg', type: 'image/jpeg' });
    }
    try {
      await api.post('/occurrences', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Sucesso', 'Ocorrência registrada!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível registrar');
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar">
          <Text style={s.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Registrar Ocorrência</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {task_title ? (
          <View style={s.taskBadge}>
            <Text style={s.taskBadgeText}>📋 {decodeURIComponent(task_title)}</Text>
          </View>
        ) : null}

        <Text style={s.label}>Descrição *</Text>
        <TextInput
          style={s.textarea}
          placeholder="Descreva o que aconteceu..."
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
          accessibilityLabel="Descrição da ocorrência"
        />

        <Text style={s.label}>Foto (opcional)</Text>
        <View style={s.photoRow}>
          <TouchableOpacity style={s.photoBtn} onPress={takePhoto} accessibilityRole="button" accessibilityLabel="Tirar foto">
            <Text style={s.photoBtnText}>📷 Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.photoBtn} onPress={pickImage} accessibilityRole="button" accessibilityLabel="Escolher da galeria">
            <Text style={s.photoBtnText}>🖼 Galeria</Text>
          </TouchableOpacity>
        </View>
        {image && (
          <View style={{ marginBottom: 20 }}>
            <Image source={{ uri: image.uri }} style={s.preview} resizeMode="cover" accessibilityLabel="Foto selecionada" />
            <TouchableOpacity onPress={() => setImage(null)} accessibilityRole="button" accessibilityLabel="Remover foto">
              <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 6 }}>✕ Remover foto</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading} accessibilityRole="button">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Registrar Ocorrência</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#1E3A8A' },
  back: { color: '#fff', fontSize: 15 },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  body: { padding: 20 },
  taskBadge: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 20 },
  taskBadgeText: { color: '#1E40AF', fontWeight: '600', fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
  textarea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 14, minHeight: 120, marginBottom: 20 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, alignItems: 'center' },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },
  preview: { width: '100%', height: 200, borderRadius: 12 },
  submitBtn: { backgroundColor: '#1E40AF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
