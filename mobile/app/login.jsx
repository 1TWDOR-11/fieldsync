import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthContext } from '../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api';

export default function Login() {
  const { login } = useAuthContext();
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'field' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!form.email || !form.password) { Alert.alert('Atenção', 'Preencha e-mail e senha'); return; }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await axios.post(`${API_URL}${endpoint}`, form);
      await login(data.token, data.user);
      router.replace('/tasks');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível conectar');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#060E1E' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#060E1E" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── TOP: FORM ── */}
        <View style={s.formSection}>

          {/* Logo + brand */}
          <View style={s.brand}>
            <View style={s.logoBox}>
              {/* Logo SVG renderizado via View estilizado */}
              <Text style={s.logoSymbol}>∞</Text>
            </View>
            <View>
              <Text style={s.brandName}>FieldSync</Text>
              <Text style={s.brandSub}>FIELD OPERATIONS PLATFORM</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={s.headingArea}>
            <Text style={s.heading}>
              {mode === 'login' ? 'Acessar plataforma' : 'Criar conta'}
            </Text>
            <Text style={s.subheading}>
              {mode === 'login'
                ? 'Entre com suas credenciais para continuar'
                : 'Preencha os dados para criar seu acesso'}
            </Text>
          </View>

          {/* Tabs */}
          <View style={s.tabs} accessibilityRole="tablist">
            {[['login', 'Entrar'], ['register', 'Cadastrar']].map(([m, lbl]) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[s.tab, mode === m && s.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}
              >
                <Text style={[s.tabText, mode === m && s.tabTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          {mode === 'register' && (
            <View style={s.field}>
              <Text style={s.label}>Nome completo</Text>
              <TextInput style={s.input} placeholder="Seu nome completo" placeholderTextColor="#1E3A5F"
                value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))}
                accessibilityLabel="Nome completo" />
            </View>
          )}

          <View style={s.field}>
            <Text style={s.label}>E-mail</Text>
            <TextInput style={s.input} placeholder="seu@email.com" placeholderTextColor="#1E3A5F"
              keyboardType="email-address" autoCapitalize="none"
              value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))}
              accessibilityLabel="E-mail" />
          </View>

          <View style={s.field}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={s.label}>Senha</Text>
              {mode === 'login' && <Text style={s.forgot}>Esqueceu a senha?</Text>}
            </View>
            <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#1E3A5F"
              secureTextEntry value={form.password}
              onChangeText={v => setForm(p => ({ ...p, password: v }))}
              accessibilityLabel="Senha" />
          </View>

          {mode === 'register' && (
            <View style={s.field}>
              <Text style={s.label}>Função na equipe</Text>
              <View style={s.roleRow}>
                {[
                  ['field', '🔧', 'Técnico de Campo'],
                  ['coordinator', '📋', 'Coordenador'],
                ].map(([val, icon, name]) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setForm(p => ({ ...p, role: val }))}
                    style={[s.roleBtn, form.role === val && s.roleBtnActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: form.role === val }}
                  >
                    <Text style={s.roleIcon}>{icon}</Text>
                    <Text style={[s.roleName, form.role === val && s.roleNameActive]}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading} accessibilityRole="button">
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>{mode === 'login' ? 'Entrar na plataforma →' : 'Criar minha conta →'}</Text>
            }
          </TouchableOpacity>

          {/* Switch mode */}
          <View style={s.switchRow}>
            <Text style={s.switchText}>
              {mode === 'login' ? 'Ainda não tem acesso? ' : 'Já tem uma conta? '}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={s.switchLink}>{mode === 'login' ? 'Criar conta' : 'Fazer login'}</Text>
            </TouchableOpacity>
          </View>

          {/* Trust */}
          <View style={s.trust}>
            {['🔒 SSL seguro', '⚡ Acesso imediato', '🛡 Dados protegidos'].map(t => (
              <Text key={t} style={s.trustItem}>{t}</Text>
            ))}
          </View>
        </View>

        {/* ── BOTTOM: COMPANY INFO ── */}
        <View style={s.infoSection}>
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>FieldSync</Text>
            <View style={s.dividerLine} />
          </View>

          <Text style={s.infoHeadline}>Gestão inteligente para equipes em campo</Text>
          <Text style={s.infoSub}>Plataforma integrada entre app mobile e dashboard web para coordenação de operações em campo em tempo real.</Text>

          {/* Feature list */}
          <View style={s.featureList}>
            {[
              { icon: '📋', title: 'Gestão de tarefas', desc: 'Crie, atribua e priorize tarefas para cada técnico' },
              { icon: '📷', title: 'Registro de ocorrências', desc: 'Foto e descrição direto do celular, em campo' },
              { icon: '📊', title: 'Dashboard analítico', desc: 'Indicadores de progresso e pendências em tempo real' },
              { icon: '📍', title: 'Rastreamento de atividades', desc: 'Visibilidade total de onde cada tarefa ocorre' },
            ].map(({ icon, title, desc }) => (
              <View key={title} style={s.featureCard}>
                <Text style={s.featureIcon}>{icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.featureTitle}>{title}</Text>
                  <Text style={s.featureDesc}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            {[['500+', 'Empresas ativas'], ['12k', 'Tarefas/mês'], ['99.9%', 'Uptime']].map(([n, l]) => (
              <View key={l} style={s.statItem}>
                <Text style={s.statNum}>{n}</Text>
                <Text style={s.statLabel}>{l}</Text>
              </View>
            ))}
          </View>

          <Text style={s.copyright}>© 2025 FieldSync. Todos os direitos reservados.</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1 },

  /* ── Form section ── */
  formSection: {
    backgroundColor: '#060E1E',
    padding: 28,
    paddingTop: 52,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 36 },
  logoBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#1540A8',
    alignItems: 'center', justifyContent: 'center',
  },
  logoSymbol: { fontSize: 20, color: '#fff', fontWeight: '900' },
  brandName: { fontSize: 18, fontWeight: '800', color: '#F1F5F9', letterSpacing: -0.3 },
  brandSub: { fontSize: 9, color: 'rgba(255,255,255,.35)', letterSpacing: 1 },

  headingArea: { marginBottom: 24 },
  heading: { fontSize: 26, fontWeight: '800', color: '#F1F5F9', letterSpacing: -0.5, marginBottom: 5 },
  subheading: { fontSize: 13, color: '#475569', lineHeight: 18 },

  tabs: {
    flexDirection: 'row', backgroundColor: '#0D1B3E',
    borderRadius: 10, padding: 4, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,.06)',
  },
  tab: { flex: 1, padding: 9, borderRadius: 7, alignItems: 'center' },
  tabActive: { backgroundColor: '#1540A8' },
  tabText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 7, letterSpacing: 0.2 },
  forgot: { fontSize: 11, color: '#3B82F6' },
  input: {
    backgroundColor: '#0D1B3E', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#F1F5F9',
  },
  roleRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleBtn: {
    flex: 1, padding: 12, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', backgroundColor: '#0D1B3E',
  },
  roleBtnActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,.12)' },
  roleIcon: { fontSize: 20, marginBottom: 4 },
  roleName: { fontSize: 12, color: '#64748B', fontWeight: '500', textAlign: 'center' },
  roleNameActive: { color: '#93C5FD', fontWeight: '700' },

  btn: {
    backgroundColor: '#1540A8', padding: 15, borderRadius: 12,
    alignItems: 'center', marginTop: 8, marginBottom: 18,
    shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 16, elevation: 6,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  switchText: { fontSize: 13, color: '#334155' },
  switchLink: { fontSize: 13, color: '#60A5FA', fontWeight: '700' },

  trust: { flexDirection: 'row', justifyContent: 'center', gap: 12, flexWrap: 'wrap' },
  trustItem: { fontSize: 10, color: '#1E3A5F' },

  /* ── Info section ── */
  infoSection: {
    backgroundColor: '#0D1B3E',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.06)',
    padding: 28, paddingBottom: 44,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,.07)' },
  dividerText: { fontSize: 11, fontWeight: '700', color: '#1E3A5F', letterSpacing: 1 },

  infoHeadline: { fontSize: 20, fontWeight: '800', color: '#E2E8F0', letterSpacing: -0.4, marginBottom: 10, lineHeight: 26 },
  infoSub: { fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 20, marginBottom: 28 },

  featureList: { gap: 14, marginBottom: 28 },
  featureCard: {
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.06)',
    borderRadius: 12, padding: 14,
  },
  featureIcon: { fontSize: 22, marginTop: 1 },
  featureTitle: { fontSize: 13, fontWeight: '700', color: '#E2E8F0', marginBottom: 3 },
  featureDesc: { fontSize: 11, color: 'rgba(255,255,255,.35)', lineHeight: 16 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.06)',
    borderRadius: 12, overflow: 'hidden', marginBottom: 28,
  },
  statItem: { flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,.06)' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#60A5FA', marginBottom: 2 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,.35)', textAlign: 'center' },

  copyright: { fontSize: 11, color: '#1E3A5F', textAlign: 'center' },
});
