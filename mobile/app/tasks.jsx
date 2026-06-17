import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator, SafeAreaView, StatusBar,
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
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as tarefas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    try {
      await api.patch(`/tasks/${id}/status`, { status });
      load();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  }

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/login'); },
      },
    ]);
  }

  function renderTask({ item: t }) {
    const sColor = STATUS_COLOR[t.status];
    const pColor = PRIORITY_COLOR[t.priority];

    return (
      <View style={[s.card, { borderLeftColor: sColor }]}>
        {/* Header */}
        <View style={s.cardTop}>
          <Text style={s.cardTitle} numberOfLines={2}>{t.title}</Text>
          <View style={[s.badge, { backgroundColor: sColor + '20', borderColor: sColor + '40' }]}>
            <Text style={[s.badgeText, { color: sColor }]}>{STATUS_LABEL[t.status]}</Text>
          </View>
        </View>

        {/* Descrição */}
        {!!t.description && (
          <Text style={s.cardDesc} numberOfLines={2}>{t.description}</Text>
        )}

        {/* Meta */}
        <View style={s.meta}>
          {!!t.location && (
            <Text style={s.metaItem}>📍 {t.location}</Text>
          )}
          {!!t.due_date && (
            <Text style={s.metaItem}>📅 {t.due_date}</Text>
          )}
          <View style={[s.priorityBadge, { backgroundColor: pColor + '18' }]}>
            <View style={[s.priorityDot, { backgroundColor: pColor }]} />
            <Text style={[s.priorityText, { color: pColor }]}>{PRIORITY_LABEL[t.priority]}</Text>
          </View>
        </View>

        {/* Ações */}
        <View style={s.actions}>
          {t.status === 'pending' && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#3B82F620', borderColor: '#3B82F640' }]}
              onPress={() => updateStatus(t.id, 'in_progress')}
            >
              <Text style={[s.actionText, { color: '#3B82F6' }]}>▶  Iniciar</Text>
            </TouchableOpacity>
          )}
          {t.status === 'in_progress' && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#10B98120', borderColor: '#10B98140' }]}
              onPress={() => updateStatus(t.id, 'done')}
            >
              <Text style={[s.actionText, { color: '#10B981' }]}>✓  Concluir</Text>
            </TouchableOpacity>
          )}
          {t.status === 'done' && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B40' }]}
              onPress={() => updateStatus(t.id, 'pending')}
            >
              <Text style={[s.actionText, { color: '#F59E0B' }]}>↩  Reabrir</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#EF444420', borderColor: '#EF444440' }]}
            onPress={() =>
              router.push(`/occurrence?task_id=${t.id}&task_title=${encodeURIComponent(t.title)}`)
            }
          >
            <Text style={[s.actionText, { color: '#EF4444' }]}>⚠  Ocorrência</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={s.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#0B1526" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={s.loadingText}>Carregando tarefas…</Text>
      </SafeAreaView>
    );
  }

  const firstName = user?.name?.split(' ')[0];
  const pending   = tasks.filter(t => t.status === 'pending').length;
  const inProg    = tasks.filter(t => t.status === 'in_progress').length;
  const done      = tasks.filter(t => t.status === 'done').length;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1526" />

      <FlatList
        data={tasks}
        keyExtractor={t => String(t.id)}
        renderItem={renderTask}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={s.header}>
              <View style={s.headerLeft}>
                <Text style={s.greeting}>Olá, {firstName} 👋</Text>
                <Text style={s.subGreeting}>{tasks.length} tarefa(s) atribuída(s)</Text>
              </View>
              <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                <Text style={s.logoutText}>Sair</Text>
              </TouchableOpacity>
            </View>

            {/* KPIs */}
            <View style={s.kpiRow}>
              {[
                { label: 'Pendentes',    value: pending, color: '#F59E0B' },
                { label: 'Em andamento', value: inProg,  color: '#3B82F6' },
                { label: 'Concluídas',   value: done,    color: '#10B981' },
              ].map((k, i) => (
                <View
                  key={k.label}
                  style={[
                    s.kpiCard,
                    i > 0 && s.kpiCardBorder,
                  ]}
                >
                  <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
                  <Text style={s.kpiLabel}>{k.label}</Text>
                </View>
              ))}
            </View>

            <Text style={s.sectionTitle}>Suas tarefas</Text>
          </>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>Nenhuma tarefa atribuída</Text>
            <Text style={s.emptyDesc}>Quando uma tarefa for atribuída a você, ela aparecerá aqui.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#0B1526' },
  loadingScreen: {
    flex: 1, backgroundColor: '#0B1526',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { color: '#64748B', fontSize: 13, marginTop: 12 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft:   {},
  greeting:     { fontSize: 20, fontWeight: '700', color: '#F1F5F9' },
  subGreeting:  { fontSize: 12, color: '#64748B', marginTop: 2 },
  logoutBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  logoutText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },

  /* KPIs */
  kpiRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#131F33',
    borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  kpiCard: {
    flex: 1, paddingVertical: 14,
    alignItems: 'center',
  },
  kpiCardBorder: {
    borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.07)',
  },
  kpiValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  kpiLabel: { fontSize: 10, color: '#475569', marginTop: 3, textAlign: 'center' },

  sectionTitle: {
    fontSize: 13, fontWeight: '700',
    color: '#64748B', letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginHorizontal: 20, marginBottom: 12,
  },

  /* Lista */
  list: { paddingBottom: 32 },

  /* Card */
  card: {
    backgroundColor: '#131F33',
    borderRadius: 14,
    borderLeftWidth: 4,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15, fontWeight: '700',
    color: '#F1F5F9',
    marginRight: 10,
    lineHeight: 21,
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
    flexShrink: 0,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  cardDesc: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 10 },

  meta: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  metaItem: { fontSize: 12, color: '#475569', marginRight: 12, marginBottom: 4 },
  priorityBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  priorityDot: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
  priorityText: { fontSize: 11, fontWeight: '700' },

  actions: { flexDirection: 'row', flexWrap: 'wrap' },
  actionBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1,
    marginRight: 8, marginBottom: 4,
  },
  actionText: { fontSize: 13, fontWeight: '600' },

  /* Empty */
  empty: {
    alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 40,
  },
  emptyIcon:  { fontSize: 40, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 8 },
  emptyDesc:  { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 19 },
});
