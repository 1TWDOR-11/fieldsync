import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuthContext } from '../App';
import { useTheme } from '../ThemeContext';
import Logo from '../Logo';
import { IcUser, IcShield, IcAlert, IcSun, IcMoon } from '../components/Icons';

const BLUE = '#2563EB';
const TEAL = '#0D9488';

export default function Login() {
  const { login } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'field' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post(mode === 'login' ? '/auth/login' : '/auth/register', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao conectar com o servidor');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto', minHeight: '100vh', background: 'var(--surface)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

        {/* ── LEFT — informational hero ── */}
        <div style={{ background: '#0B1220', display: 'grid', gridTemplateRows: 'auto 1fr', padding: '48px 56px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', columnGap: 12, minHeight: 40 }}>
            <Logo size={26} color="white" />
            <div style={{ display: 'grid', rowGap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -.2, lineHeight: 1 }}>FieldSync</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: '.04em' }}>FIELD OPERATIONS PLATFORM</span>
            </div>
          </div>

          {/* Single centered block — mirrors the right panel's centered form block */}
          <div style={{ display: 'grid', alignContent: 'center', rowGap: 22 }}>
            <div style={{ display: 'grid', gridAutoFlow: 'column', justifyContent: 'start', alignItems: 'center', columnGap: 8 }}>
              <span style={{ width: 16, height: 1, background: TEAL, display: 'block' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: TEAL, textTransform: 'uppercase' }}>Plataforma de gestão em campo</span>
            </div>

            <h1 style={{ fontSize: 38, fontWeight: 700, color: '#F1F3F6', lineHeight: 1.15, letterSpacing: '-0.8px' }}>
              Visibilidade total para suas equipes em campo
            </h1>

            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, maxWidth: 400 }}>
              Coordene tarefas, acompanhe o status em tempo real e registre ocorrências com foto, tudo em uma plataforma integrada entre web e mobile.
            </p>

            <div style={{ display: 'grid', rowGap: 14 }}>
              {[
                'Gestão e priorização de tarefas por equipe',
                'Rastreamento de status em tempo real',
                'Registro de ocorrências com fotos',
                'Indicadores e relatórios por projeto',
              ].map(text => (
                <div key={text} style={{ display: 'grid', gridTemplateColumns: '6px 1fr', alignItems: 'center', columnGap: 10 }}>
                  <span style={{ width: 5, height: 5, background: TEAL }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT — login form ── */}
        <div style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'grid', placeItems: 'center', padding: '48px 56px', position: 'relative' }}>
          <button
            className="sidebar-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            aria-label="Alternar tema"
            style={{ position: 'absolute', top: 24, right: 24, width: 30, height: 30, border: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            {theme === 'dark' ? <IcSun size={14} color="#F59E0B" /> : <IcMoon size={14} color="#93C5FD" />}
          </button>

          <div style={{ width: '100%', maxWidth: 380, display: 'grid', rowGap: 24 }}>

            <div style={{ display: 'grid', rowGap: 6, textAlign: 'center' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.3px' }}>
                {mode === 'login' ? 'Acessar plataforma' : 'Criar conta'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {mode === 'login' ? 'Entre com suas credenciais para continuar.' : 'Preencha os dados abaixo para criar seu acesso.'}
              </p>
            </div>

            <div role="tablist" className="row" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 3 }}>
              {[['login', 'Entrar'], ['register', 'Cadastrar']].map(([m, label]) => (
                <button key={m} role="tab" aria-selected={mode === m}
                  onClick={() => { setMode(m); setError(''); }}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 3, border: 'none', cursor: 'pointer',
                    background: mode === m ? BLUE : 'transparent',
                    color: mode === m ? '#fff' : 'var(--text-muted)',
                    fontWeight: mode === m ? 600 : 400, fontSize: 13, transition: 'all .15s'
                  }}>{label}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="col gap-4">

              {mode === 'register' && (
                <Field id="name" label="Nome completo" type="text" placeholder="Seu nome completo"
                  value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              )}

              <Field id="email" label="E-mail" type="email" placeholder="seu@email.com"
                value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />

              <div className="col gap-2">
                <div className="row-between">
                  <label htmlFor="password" className="label" style={{ marginBottom: 0 }}>Senha</label>
                  {mode === 'login' && <span style={{ fontSize: 12, color: BLUE, cursor: 'pointer' }}>Esqueceu a senha?</span>}
                </div>
                <input id="password" type="password" required placeholder="••••••••" className="input"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>

              {mode === 'register' && (
                <div className="col gap-2">
                  <label className="label">Função na equipe</label>
                  <div className="row gap-2">
                    {[
                      { val: 'field',       Icon: IcUser,   name: 'Técnico de Campo', hint: 'Executa tarefas no campo' },
                      { val: 'coordinator', Icon: IcShield, name: 'Coordenador',        hint: 'Gerencia tarefas e equipes' },
                    ].map(({ val, Icon, name, hint }) => (
                      <button key={val} type="button" onClick={() => setForm(f => ({ ...f, role: val }))}
                        aria-pressed={form.role === val}
                        className="col gap-1"
                        style={{
                          flex: 1, padding: 12, borderRadius: 'var(--radius)', fontSize: 12, cursor: 'pointer', textAlign: 'left',
                          border: form.role === val ? `1px solid ${BLUE}` : '1px solid var(--border)',
                          background: form.role === val ? 'var(--surface-2)' : 'var(--surface)',
                        }}>
                        <Icon size={16} color={form.role === val ? BLUE : 'var(--text-muted)'} />
                        <span style={{ fontWeight: 600, color: form.role === val ? 'var(--text-strong)' : 'var(--text-muted)' }}>{name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.4 }}>{hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div role="alert" className="row gap-2" style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)', color: '#F87171', padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: 13 }}>
                  <IcAlert size={14} color="#F87171" /> <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', padding: 12, fontSize: 14, opacity: loading ? .7 : 1 }}>
                {loading ? 'Aguarde' : mode === 'login' ? 'Entrar na plataforma' : 'Criar minha conta'}
              </button>
            </form>

            <div className="row gap-3" style={{ alignItems: 'center' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>ou</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-dim)' }}>
              {mode === 'login' ? 'Ainda não tem acesso? ' : 'Já tem uma conta? '}
              <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: TEAL, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {mode === 'login' ? 'Criar conta grátis' : 'Fazer login'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="row-between" style={{ padding: '14px 56px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>© 2026 FieldSync. Todos os direitos reservados.</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Criado por: <strong style={{ color: 'var(--text-muted)' }}>Hannya Cavalcante</strong>
        </span>
      </div>
    </div>
  );
}

function Field({ id, label, type, placeholder, value, onChange }) {
  return (
    <div className="col gap-2">
      <label htmlFor={id} className="label" style={{ marginBottom: 0 }}>{label}</label>
      <input id={id} type={type} required placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} aria-required="true" className="input" />
    </div>
  );
}
