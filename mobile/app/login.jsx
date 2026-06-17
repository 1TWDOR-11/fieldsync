import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, SafeAreaView,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthContext } from '../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fieldsync-api.onrender.com/api';

const ROLES = [
  { val: 'field',       icon: '🔧', label: 'Técnico de Campo',  hint: 'Executa tarefas no campo' },
  { val: 'coordinator', icon: '📋', label: 'Coordenador',        hint: 'Gerencia tarefas e equipes' },
];

const BULLETS = [
  'Gestão e priorização de tarefas por equipe',
  'Rastreamento de status em tempo real',
  'Registro de ocorrências com fotos',
  'Indicadores e relatórios por projeto',
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
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ══════════════════════════════
              LOGO
          ══════════════════════════════ */}
          <View style={s.logoSection}>
            {/* Ícone — aproximação do SVG original */}
            <View style={s.logoIconWrap}>
              <View style={s.logoArc1} />
              <View style={s.logoArc2} />
            </View>
            <View style={s.logoTextWrap}>
              <Text style={s.logoName}>FieldSync</Text>
              <Text style={s.logoSub}>FIELD OPERATIONS PLATFORM</Text>
            </View>
          </View>

          {/* ══════════════════════════════
              HERO — textos informativos
          ══════════════════════════════ */}
          <View style={s.hero}>
            {/* Label com linha decorativa */}
            <View style={s.heroLabel}>
              <View style={s.heroLabelLine} />
              <Text style={s.heroLabelText}>Plataforma de gestão em campo</Text>
            </View>

            <Text style={s.heroTitle}>
              Visibilidade total para suas equipes em campo
            </Text>

            <Text style={s.heroDesc}>
              Coordene tarefas, acompanhe o status em tempo real e registre ocorrências com foto, tudo em uma plataforma integrada entre web e mobile.
            </Text>

            {/* Bullets */}
            <View style={s.bulletList}>
              {BULLETS.map(text => (
                <View key={text} style={s.bulletRow}>
                  <View style={s.bulletDot} />
                  <Text style={s.bulletText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ══════════════════════════════
              FORMULÁRIO
          ══════════════════════════════ */}
          <View style={s.formSection}>

            <Text style={s.formTitle}>
              {mode === 'login' ? 'Acessar plataforma' : 'Criar conta'}
            </Text>
            <Text style={s.formSubtitle}>
              {mode === 'login'
                ? 'Entre com suas credenciais para continuar.'
                : 'Preencha os dados abaixo para criar seu acesso.'}
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
                <Text style={s.label}>Nome completo</Text>
                <TextInput
                  style={s.input}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#3D4A5C"
                  value={form.name}
                  onChangeText={v => setForm(p => ({ ...p, name: v }))}
                  returnKeyType="next"
                />
              </View>
            )}

            {/* E-mail */}
            <View style={s.field}>
              <Text style={s.label}>E-mail</Text>
              <TextInput
                style={s.input}
                placeholder="seu@email.com"
                placeholderTextColor="#3D4A5C"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={v => setForm(p => ({ ...p, email: v }))}
                returnKeyType="next"
              />
            </View>

            {/* Senha */}
            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>Senha</Text>
                {mode === 'login' && (
                  <Text style={s.forgotLink}>Esqueceu a senha?</Text>
                )}
              </View>
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor="#3D4A5C"
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
                <Text style={s.label}>Função na equipe</Text>
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

            {/* Botão */}
            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>
                    {mode === 'login' ? 'Entrar na plataforma' : 'Criar minha conta'}
                  </Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>ou</Text>
              <View style={s.dividerLine} />
            </View>

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
                  {mode === 'login' ? 'Criar conta grátis' : 'Fazer login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════════════════════
              RODAPÉ
          ══════════════════════════════ */}
          <View style={s.footer}>
            <Text style={s.footerLeft}>© 2026 FieldSync. Todos os direitos reservados.</Text>
            <Text style={s.footerRight}>
              Criado por: <Text style={s.footerCreator}>Hannya Cavalcante</Text>
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────
   Cores idênticas ao web
──────────────────────────────────────── */
const BG_HERO   = '#0B1220';   // fundo do painel esquerdo web
const BG_FORM   = '#12161C';   // var(--surface) dark
const BG_INPUT  = '#0F1318';   // var(--bg-input) dark
const BLUE      = '#2563EB';
const TEAL      = '#0D9488';
const BORDER    = 'rgba(255,255,255,0.10)';
const TEXT_STR  = '#E6E8EB';
const TEXT_MUT  = '#8B92A0';
const TEXT_DIM  = '#565E6B';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG_HERO },
  kav:  { flex: 1 },

  /* ── Logo ── */
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 32,
    backgroundColor: BG_HERO,
  },
  logoIconWrap: {
    width: 32, height: 32,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Duas meias-luas aproximando o logo SVG */
  logoArc1: {
    position: 'absolute',
    width: 18, height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#fff',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    top: 0, left: 0,
  },
  logoArc2: {
    position: 'absolute',
    width: 18, height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#fff',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    bottom: 0, right: 0,
  },
  logoTextWrap: { flex: 1 },
  logoName: {
    fontSize: 18, fontWeight: '700',
    color: '#fff', letterSpacing: -0.2,
  },
  logoSub: {
    fontSize: 9, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2, marginTop: 1,
  },

  /* ── Hero ── */
  hero: {
    backgroundColor: BG_HERO,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  heroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroLabelLine: {
    width: 16, height: 1,
    backgroundColor: TEAL,
    marginRight: 8,
  },
  heroLabelText: {
    fontSize: 11, fontWeight: '600',
    color: TEAL, letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 26, fontWeight: '700',
    color: '#F1F3F6', lineHeight: 34,
    letterSpacing: -0.5, marginBottom: 14,
  },
  heroDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.55)',
    lineHeight: 20, marginBottom: 22,
  },
  bulletList: {},
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletDot: {
    width: 5, height: 5,
    backgroundColor: TEAL,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },

  /* ── Formulário ── */
  formSection: {
    backgroundColor: BG_FORM,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  formTitle: {
    fontSize: 22, fontWeight: '700',
    color: TEXT_STR, letterSpacing: -0.3,
    textAlign: 'center', marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 13, color: TEXT_MUT,
    textAlign: 'center', lineHeight: 19,
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: BG_INPUT,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 4, padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1, paddingVertical: 9,
    borderRadius: 3, alignItems: 'center',
  },
  tabActive: { backgroundColor: BLUE },
  tabText:       { fontSize: 13, color: TEXT_MUT, fontWeight: '400' },
  tabTextActive: { color: '#fff', fontWeight: '600' },

  field:    { marginBottom: 16 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11, fontWeight: '600',
    color: TEXT_MUT, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 6,
  },
  forgotLink: { fontSize: 12, color: BLUE },
  input: {
    backgroundColor: BG_INPUT,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 4,
    paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 14, color: TEXT_STR,
  },

  roleRow: { flexDirection: 'row' },
  roleBtn: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 4, alignItems: 'center',
    borderWidth: 1, borderColor: BORDER,
    backgroundColor: BG_INPUT,
  },
  roleBtnActive: {
    borderColor: BLUE,
    backgroundColor: BG_FORM,
  },
  roleIcon: { fontSize: 20, marginBottom: 6 },
  roleName: {
    fontSize: 12, fontWeight: '600',
    color: TEXT_MUT, textAlign: 'center',
    marginBottom: 2,
  },
  roleNameActive: { color: TEXT_STR },
  roleHint: {
    fontSize: 10, color: TEXT_DIM,
    textAlign: 'center', lineHeight: 14,
  },

  btn: {
    backgroundColor: BLUE,
    paddingVertical: 13,
    borderRadius: 4, alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8, marginBottom: 20,
    minHeight: 44,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: {
    fontSize: 12, color: TEXT_DIM,
    marginHorizontal: 12,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: { fontSize: 13, color: TEXT_DIM },
  switchLink: { fontSize: 13, color: TEAL, fontWeight: '600' },

  /* ── Rodapé ── */
  footer: {
    backgroundColor: BG_FORM,
    borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 24, paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft:    { fontSize: 10, color: TEXT_DIM },
  footerRight:   { fontSize: 10, color: TEXT_DIM },
  footerCreator: { fontWeight: '600', color: TEXT_MUT },
});
