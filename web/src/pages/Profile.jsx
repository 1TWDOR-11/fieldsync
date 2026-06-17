import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuthContext } from '../App';
import { IcUser, IcShield, IcCalendar, IcTasks, IcCheck, IcAlert, IcEdit, IcX } from '../components/Icons';

const BLUE = '#2563EB'; const TEAL = '#0D9488'; const INDG = '#4F46E5';

export default function Profile() {
  const { user, updateUser } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [myOccurrences, setMyOccurrences] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', current_password: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    api.get('/tasks').then(r => setMyTasks(r.data.filter(t => t.assigned_to === user?.id))).catch(() => {});
    api.get('/occurrences').then(r => setMyOccurrences(r.data.filter(o => o.user_id === user?.id))).catch(() => {});
  };

  useEffect(load, []);

  const openEdit = () => {
    setForm({ name: profile?.name || '', current_password: '', password: '' });
    setError(''); setSuccess('');
    setEditing(true);
  };

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    try {
      const payload = { name: form.name };
      if (form.password) { payload.password = form.password; payload.current_password = form.current_password; }
      await api.patch('/users/me', payload);
      updateUser({ name: form.name });
      setSuccess('Perfil atualizado com sucesso!');
      setEditing(false);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.error || 'Erro ao atualizar perfil'); }
  }

  if (!profile) return null;

  const isCoord = profile.role === 'coordinator';
  const doneTasks = myTasks.filter(t => t.status === 'done').length;
  const pendingTasks = myTasks.filter(t => t.status !== 'done').length;

  return (
    <div className="col gap-4" style={{ maxWidth: 760 }}>
      <header>
        <p className="text-dim" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Conta</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.5px' }}>Meu Perfil</h1>
      </header>

      {success && (
        <div className="row gap-2" style={{ background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.3)', color: TEAL, padding: '9px 14px', borderRadius: 'var(--radius)', fontSize: 13, alignItems: 'center' }}>
          <IcCheck size={14} color={TEAL} /> {success}
        </div>
      )}

      {/* Identity card */}
      <div className="card" style={{ padding: '22px 22px' }}>
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 8, flexShrink: 0,
              background: isCoord ? INDG : TEAL,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff',
            }}>
              {profile.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>{profile.name}</div>
              <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>{profile.email}</div>
              <div className="row gap-2" style={{ marginTop: 8 }}>
                <span className="badge" style={{ color: isCoord ? INDG : TEAL, borderColor: (isCoord ? INDG : TEAL) + '40' }}>
                  {isCoord ? 'Coordenador' : 'Técnico de Campo'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={openEdit} className="btn btn-sm">
            <IcEdit size={12} color="var(--text-muted)" /> Editar perfil
          </button>
        </div>

        <div className="grid-kpi-3" style={{ gap: 8, marginTop: 20 }}>
          <div className="panel" style={{ padding: '9px 11px' }}>
            <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 4 }}>
              <IcCalendar size={11} color="var(--text-dim)" />
              <span className="label" style={{ marginBottom: 0, fontSize: 9 }}>Membro desde</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500 }}>{new Date(profile.created_at).toLocaleDateString('pt-BR')}</div>
          </div>
          <div className="panel" style={{ padding: '9px 11px' }}>
            <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 4 }}>
              <IcUser size={11} color="var(--text-dim)" />
              <span className="label" style={{ marginBottom: 0, fontSize: 9 }}>Liderado por</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500 }}>{profile.lead_name || 'Não atribuído'}</div>
          </div>
          <div className="panel" style={{ padding: '9px 11px' }}>
            <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 4 }}>
              <IcShield size={11} color="var(--text-dim)" />
              <span className="label" style={{ marginBottom: 0, fontSize: 9 }}>Áreas</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500 }}>
              {profile.departments?.length ? profile.departments.map(d => d.name).join(', ') : 'Nenhuma'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-kpi-3">
        <div className="card row-between" style={{ padding: '16px 18px' }}>
          <div>
            <div className="text-dim" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Tarefas atribuídas</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.5px' }}>{myTasks.length}</div>
          </div>
          <IcTasks size={18} color={BLUE} />
        </div>
        <div className="card row-between" style={{ padding: '16px 18px' }}>
          <div>
            <div className="text-dim" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Concluídas</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.5px' }}>{doneTasks}</div>
          </div>
          <IcCheck size={18} color={TEAL} />
        </div>
        <div className="card row-between" style={{ padding: '16px 18px' }}>
          <div>
            <div className="text-dim" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Ocorrências registradas</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.5px' }}>{myOccurrences.length}</div>
          </div>
          <IcAlert size={18} color="#DC2626" />
        </div>
      </div>

      {/* My tasks list */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row-between" style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>Minhas tarefas</span>
          <span className="text-dim" style={{ fontSize: 11 }}>{pendingTasks} pendentes</span>
        </div>
        {myTasks.length === 0
          ? <p className="text-dim" style={{ padding: '20px 18px', fontSize: 13 }}>Nenhuma tarefa atribuída a você.</p>
          : myTasks.slice(0, 6).map((t, i) => (
            <div key={t.id} className="row-between" style={{ padding: '11px 18px', borderBottom: i < Math.min(myTasks.length, 6) - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-strong)' }}>{t.title}</span>
              <span className="badge">{t.status === 'done' ? 'Concluído' : t.status === 'in_progress' ? 'Em andamento' : 'Pendente'}</span>
            </div>
          ))
        }
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="row-between" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>Editar perfil</h2>
              <button onClick={() => setEditing(false)} className="btn-icon" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><IcX size={18} color="var(--text-muted)" /></button>
            </div>
            <form onSubmit={handleSubmit} className="col gap-3">
              <div>
                <label className="label">Nome completo</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Senha atual (para trocar a senha)</label>
                <input className="input" type="password" placeholder="••••••••" value={form.current_password} onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))} />
              </div>
              <div>
                <label className="label">Nova senha (deixe vazio para manter)</label>
                <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              {error && <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)', color: '#F87171', padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: 12 }}>{error}</div>}
              <div className="row gap-2" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
