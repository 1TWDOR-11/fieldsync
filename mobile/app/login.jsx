import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthContext } from '../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fieldsync-api.onrender.com/api';

const ROLES = [
  { val: 'field',       icon: '🔧', label: 'Técnico de Campo',  hint: 'Executa tarefas em campo' },
  { val: 'coordinator', icon: '📋', label: 'Coordenador',        hint: 'Gerencia tarefas e equipes' },
];

const FEATURES = [
  { icon: '📋', title: 'Gestão de tarefas',          desc: 'Crie, atribua e priorize tarefas para cada técnico' },
  { icon: '📷', title: 'Registro de ocorrências',    desc: 'Foto e descrição direto do celular, em campo' },
  { icon: '📊', title: 'Dashboard analítico',        desc: 'Indicadores de progresso e pendências em tempo real' },
  { icon: '📍', title: 'Rastreamento de atividades', desc: 'Visibilidade total de onde cada tarefa ocorre' },
];

export default function Login() {
  const { login } = useAuthContext();
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'field' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!form.email || !form.password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha');
      return;
    }
    if (mode === 'register' && !form.name) {
      Alert.alert('Atenção', 'Preencha seu nome completo');
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await axios.post(`${API_URL}${endpoint}`, form);
      await login(data.token, data.user);
      router.replace('/tasks');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível conectar ao servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#07101F" />
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ════════════════════════════
              1. LOGO
          ════════════════════════════ */}
          <View style={s.logoSection}>
            <View style={s.logoBox}>
              <Text style={s.logoSymbol}>∞</Text>
            </View>
            <View style={s.logoText}>
              <Text style={s.brandName}>FieldSync</Text>
              <Text style={s.brandSub}>FIELD OPERATIONS PLATFORM</Text>
            </View>
          </View>

          {/* ════════════════════════════
              2. HERO — textos informativos
          ════════════════════════════ */}
          <View style={s.hero}>
            <View style={s.heroBadge}>
              <View style={s.heroBadgeDot} />
              <Text style={s.heroBadgeText}>Plataforma de gestão em campo</Text>
            </View>

            <Text style={s.heroTitle}>
              Visibilidade total para suas equipes em campo
            </Text>
            <Text style={s.heroDesc}>
              Coordene tarefas, acompanhe o status em tempo real e registre ocorrências com foto — tudo integrado entre web e mobile.
            </Text>

            {/* Feature cards */}
            {FEATURES.map(({ icon, title, desc }) => (
              <View key={title} style={s.featureCard}>
                <Text style={s.featureIcon}>{icon}</Text>
                <View style={s.featureText}>
                  <Text style={s.featureTitle}>{title}</Text>
                  <Text style={s.featureDesc}>{desc}</Text>
                </View>
              </View>
            ))}

            {/* Stats */}
            <View style={s.statsRow}>
              {[['500+', 'Empresas'], ['12k', 'Tarefas/mês'], ['99.9%', 'Uptime']].map(([n, l], i) => (
                <View
                  key={l}
                  style={[
                    s.statItem,
                    i < 2 && s.statItemBorder,
                  ]}
                >
                  <Text style={s.statNum}>{n}</Text>
                  <Text style={s.statLabel}>{l}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ════════════════════════════
              3. FORMULÁRIO
          ════════════════════════════ */}
          <View style={s.form}>
            <Text style={s.formTitle}>
              {mode === 'login' ? 'Acessar plataforma' : 'Criar conta'}
            </Text>
            <Text style={s.formSubtitle}>
              {mode === 'login'
                ? 'Entre com suas credenciais para continuar'
                : 'Preencha os dados para criar seu acesso'}
            </Text>

            {/* Tabs */}
            <View style={s.tabs}>
              {[['login', 'Entrar'], ['register', 'Cadastrar']].map(([m, lbl]) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setMode(m);
                    setForm({ name: '', email: '', password: '', role: 'field' });
                  }}
                  style={[s.tab, mode === m && s.tabActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === m }}
                >
                  <Text style={[s.tabText, mode === m && s.tabTextActive]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nome */}
            {mode === 'register' && (
              <View style={s.field}>
                <Text style={s.fieldLabel}>Nome completo</Text>
                <TextInput
                  style={s.input}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#2E4A6A"
                  value={form.name}
                  onChangeText={v => setForm(p => ({ ...p, name: v }))}
                  returnKeyType="next"
                />
              </View>
            )}

            {/* E-mail */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>E-mail</Text>
              <TextInput
                style={s.input}
                placeholder="seu@email.com"
                placeholderTextColor="#2E4A6A"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={v => setForm(p => ({ ...p, email: v }))}
                returnKeyType="next"
              />
            </View>

            {/* Senha */}
            <View style={s.field}>
              <View style={s.fieldLabelRow}>
                <Text style={s.fieldLabel}>Senha</Text>
                {mode === 'login' && (
                  <Text style={s.forgotLink}>Esqueceu a senha?</Text>
                )}
              </View>
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor="#2E4A6A"
                secureTextEntry
                value={form.password}
                onChangeText={v => setForm(p => ({ ...p, password: v }))}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            {/* Cargos */}
            {mode === 'register' && (
              <View style={s.field}>
                <Text style={s.fieldLabel}>Função na equipe</Text>
                <View style={s.roleRow}>
                  {ROLES.map(({ val, icon, label, hint }, i) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setForm(p => ({ ...p, role: val }))}
                      style={[
                        s.roleBtn,
                        form.role === val && s.roleBtnActive,
                        i === 0 && { marginRight: 10 },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: form.role === val }}
                    >
                      <Text style={s.roleIcon}>{icon}</Text>
                      <Text style={[s.roleName, form.role === val && s.roleNameActive]}>
                        {label}
                      </Text>
                      <Text style={s.roleHint}>{hint}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Botão principal */}
            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>
                    {mode === 'login' ? 'Entrar na plataforma →' : 'Criar minha conta →'}
                  </Text>
              }
            </TouchableOpacity>

            {/* Trocar modo */}
            <View style={s.switchRow}>
              <Text style={s.switchText}>
                {mode === 'login' ? 'Ainda não tem acesso? ' : 'Já tem uma conta? '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setForm({ name: '', email: '', password: '', role: 'field' });
                }}
              >
                <Text style={s.switchLink}>
                  {mode === 'login' ? 'Criar conta' : 'Fazer login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ════════════════════════════
              4. RODAPÉ
          ════════════════════════════ */}
          <View style={s.footer}>
            <View style={s.footerLine} />
            <Text style={s.footerText}>© 2026 FieldSync. Todos os direitos reservados.</Text>
            <Text style={s.footerCredit}>Criado por Hannya Cavalcante</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const DARK_BG   = '#07101F';
const DARK_CARD = '#0E1E35';
const DARK_INP  = '#0A1627';
const BLUE      = '#1540A8';
const BLUE_LT   = '#3B82F6';
const TEAL      = '#0D9488';
const TEXT_WH   = '#F1F5F9';
const TEXT_MD   = '#94A3B8';
const TEXT_DIM  = '#334155';
const BORDER    = 'rgba(255,255,255,0.08)';

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: DARK_BG },
  kav:   { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: DARK_BG },

  /* ── 1. Logo ── */
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 28,
    backgroundColor: DARK_BG,
  },
  logoBox: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoSymbol: { fontSize: 22, color: '#fff', fontWeight: '900' },
  logoText:   { flex: 1 },
  brandName:  { fontSize: 18, fontWeight: '800', color: TEXT_WH, letterSpacing: -0.3 },
  brandSub:   { fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.4, marginTop: 2 },

  /* ── 2. Hero ── */
  hero: {
    backgroundColor: DARK_CARD,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBadgeDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: TEAL,
    marginRight: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEAL,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_WH,
    lineHeight: 30,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 20,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  featureIcon: { fontSize: 20, marginRight: 14, marginTop: 1 },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 13, fontWeight: '700',
    color: TEXT_WH, marginBottom: 3,
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 17,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  statNum:   { fontSize: 18, fontWeight: '800', color: BLUE_LT, marginBottom: 3 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },

  /* ── 3. Formulário ── */
  form: {
    backgroundColor: DARK_BG,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_WH,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 13,
    color: TEXT_MD,
    lineHeight: 19,
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD,
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: BLUE },
  tabText:       { fontSize: 14, color: '#475569', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  field:         { marginBottom: 18 },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  fieldLabel: {
    fontSize: 12, fontWeight: '600',
    color: TEXT_MD, letterSpacing: 0.2,
    marginBottom: 7,
  },
  forgotLink: { fontSize: 11, color: BLUE_LT },
  input: {
    backgroundColor: DARK_INP,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: TEXT_WH,
  },

  roleRow:        { flexDirection: 'row' },
  roleBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: DARK_CARD,
  },
  roleBtnActive: {
    borderColor: BLUE_LT,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  roleIcon:      { fontSize: 22, marginBottom: 6 },
  roleName: {
    fontSize: 12, color: TEXT_DIM,
    fontWeight: '600', textAlign: 'center',
    marginBottom: 3,
  },
  roleNameActive: { color: '#93C5FD' },
  roleHint: {
    fontSize: 10, color: '#1E3A5F',
    textAlign: 'center', lineHeight: 14,
  },

  btn: {
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
    shadowColor: BLUE_LT,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: { fontSize: 13, color: TEXT_DIM },
  switchLink: { fontSize: 13, color: BLUE_LT, fontWeight: '700' },

  /* ── 4. Rodapé ── */
  footer: {
    backgroundColor: DARK_CARD,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerLine: {
    width: 36, height: 1,
    backgroundColor: BORDER,
    marginBottom: 12,
  },
  footerText:   { fontSize: 11, color: TEXT_DIM, textAlign: 'center', marginBottom: 4 },
  footerCredit: { fontSize: 11, color: TEXT_DIM, textAlign: 'center' },
});
