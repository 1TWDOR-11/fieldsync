import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

const STATUS_LABEL = { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído' };
const STATUS_COLOR = { pending: '#F59E0B', in_progress: '#3B82F6', done: '#10B981' };
const PRIORITY_LABEL = { low: 'Baixa', medium: 'Média', high: 'Alta' };
const PRIORITY_COLOR = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

export default function Tasks() {
  const { user, logout } = useAuthContext();
  const api = useApi();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch { Alert.alert('Erro', 'Não foi possível carregar as tarefas'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    try {
      await api.patch(`/tasks/${id}/status`, { status });
      load();
    } catch { Alert.alert('Erro', 'Não foi possível atualizar'); }
  }

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } }
    ]);
  }

  function renderTask({ item: t }) {
    return (
      <View style={[s.card, { borderLeftColor: STATUS_COLOR[t.status] }]} accessible accessibilityLabel={`Tarefa: ${t.title}, status: ${STATUS_LABEL[t.status]}`}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle} numberOfLines={2}>{t.title}</Text>
          <View style={[s.badge, { backgroundColor: STATUS_COLOR[t.status] + '20' }]}>
            <Text style={[s.badgeText, { color: STATUS_COLOR[t.status] }]}>{STATUS_LABEL[t.status]}</Text>
          </View>
        </View>
        {t.description ? <Text style={s.cardDesc} numberOfLines={2}>{t.description}</Text> : null}
        <View style={s.meta}>
          {t.location ? <Text style={s.metaText}>📍 {t.location}</Text> : null}
          {t.due_date ? <Text style={s.metaText}>📅 {t.due_date}</Text> : null}
          <Text style={[s.metaText, { color: PRIORITY_COLOR[t.priority] }]}>● {PRIORITY_LABEL[t.priority]}</Text>
        </View>
        <View style={s.actions}>
          {t.status === 'pending' && (
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#3B82F620' }]}
              onPress={() => updateStatus(t.id, 'in_progress')} accessibilityRole="button" accessibilityLabel="Iniciar tarefa">
              <Text style={[s.actionText, { color: '#3B82F6' }]}>▶ Iniciar</Text>
            </TouchableOpacity>
          )}
          {t.status === 'in_progress' && (
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#10B98120' }]}
              onPress={() => updateStatus(t.id, 'done')} accessibilityRole="button" accessibilityLabel="Concluir tarefa">
              <Text style={[s.actionText, { color: '#10B981' }]}>✓ Concluir</Text>
            </TouchableOpacity>
          )}
          {t.status === 'done' && (
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#F59E0B20' }]}
              onPress={() => updateStatus(t.id, 'pending')} accessibilityRole="button" accessibilityLabel="Reabrir tarefa">
              <Text style={[s.actionText, { color: '#F59E0B' }]}>↩ Reabrir</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EF444420' }]}
            onPress={() => router.push(`/occurrence?task_id=${t.id}&task_title=${encodeURIComponent(t.title)}`)}
            accessibilityRole="button" accessibilityLabel="Registrar ocorrência">
            <Text style={[s.actionText, { color: '#EF4444' }]}>⚠ Ocorrência</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1E40AF" />
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={s.subgreeting}>{tasks.length} tarefa(s) atribuída(s)</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn} accessibilityRole="button" accessibilityLabel="Sair">
          <Text style={s.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={t => String(t.id)}
        renderItem={renderTask}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#1E40AF']} />}
        ListEmptyComponent={<Text style={s.empty}>Nenhuma tarefa atribuída a você.</Text>}
        accessibilityLabel="Lista de tarefas"
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1E3A8A' },
  greeting: { fontSize: 18, fontWeight: '700', color: '#fff' },
  subgreeting: { fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,.15)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  logoutText: { color: '#fff', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, elevation: 2, shadowOpacity: .08 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  meta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  metaText: { fontSize: 12, color: '#64748B' },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionText: { fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 15 },
});
