import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, SafeAreaView, ActivityIndicator,
  StatusBar,
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
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria de fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acessar a câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function handleSubmit() {
    if (!description.trim()) {
      Alert.alert('Atenção', 'Digite uma descrição para a ocorrência');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('description', description);
    if (task_id) formData.append('task_id', task_id);
    if (image) {
      formData.append('image', { uri: image.uri, name: 'occurrence.jpg', type: 'image/jpeg' });
    }
    try {
      await api.post('/occurrences', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Sucesso', 'Ocorrência registrada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível registrar a ocorrência');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1526" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Registrar Ocorrência</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Tarefa vinculada */}
        {!!task_title && (
          <View style={s.taskTag}>
            <Text style={s.taskTagIcon}>📋</Text>
            <Text style={s.taskTagText} numberOfLines={2}>
              {decodeURIComponent(task_title)}
            </Text>
          </View>
        )}

        {/* Descrição */}
        <Text style={s.label}>Descrição *</Text>
        <TextInput
          style={s.textarea}
          placeholder="Descreva o que aconteceu com detalhes..."
          placeholderTextColor="#2E4A6A"
          multiline
          numberOfLines={5}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        {/* Foto */}
        <Text style={s.label}>Foto (opcional)</Text>
        <View style={s.photoRow}>
          <TouchableOpacity style={s.photoBtn} onPress={takePhoto}>
            <Text style={s.photoBtnIcon}>📷</Text>
            <Text style={s.photoBtnText}>Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.photoBtn, { marginLeft: 10 }]} onPress={pickImage}>
            <Text style={s.photoBtnIcon}>🖼</Text>
            <Text style={s.photoBtnText}>Galeria</Text>
          </TouchableOpacity>
        </View>

        {/* Preview da imagem */}
        {!!image && (
          <View style={s.previewWrap}>
            <Image source={{ uri: image.uri }} style={s.preview} resizeMode="cover" />
            <TouchableOpacity style={s.removePhoto} onPress={() => setImage(null)}>
              <Text style={s.removePhotoText}>✕  Remover foto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botão */}
        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.submitText}>Registrar Ocorrência</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0B1526' },
  scroll: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#131F33',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn:     { paddingVertical: 4, paddingRight: 12 },
  backText:    { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },

  body: { padding: 20, paddingBottom: 40 },

  /* Tarefa */
  taskTag: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0E2044',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  taskTagIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  taskTagText: { flex: 1, color: '#93C5FD', fontSize: 14, fontWeight: '600', lineHeight: 20 },

  /* Campos */
  label: {
    fontSize: 12, fontWeight: '700',
    color: '#64748B', letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textarea: {
    backgroundColor: '#131F33',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#F1F5F9',
    minHeight: 120,
    marginBottom: 24,
    lineHeight: 20,
  },

  /* Foto */
  photoRow: { flexDirection: 'row', marginBottom: 16 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131F33',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  photoBtnIcon: { fontSize: 18, marginRight: 8 },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },

  previewWrap: { marginBottom: 24 },
  preview: {
    width: '100%', height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  removePhoto: { alignItems: 'center' },
  removePhotoText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  /* Submit */
  submitBtn: {
    backgroundColor: '#1540A8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
