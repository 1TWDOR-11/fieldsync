import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuthContext } from '../App';
import { IcUsers, IcShield, IcUser, IcPlus, IcEdit, IcTrash, IcSearch, IcRefresh, IcX, IcCheck } from '../components/Icons';

function DeptTags({ departments }) {
  if (!departments?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {departments.map(d => (
        <span key={d.id} style={{ fontSize: 10, fontWeight: 600, color: d.color, background: d.color + '18', borderRadius: 4, padding: '2px 8px', lineHeight: 1.6 }}>{d.name}</span>
      ))}
    </div>
  );
}

function UserCard({ u, me, isCoord, onEdit, onDelete, onToggle }) {
  const accent = isCoord ? '#818CF8' : '#60A5FA';
  const accentBg = isCoord ? 'rgba(99,102,241,.18)' : 'rgba(59,130,246,.18)';
  const isMe = u.id === me?.id;

  return (
    <div style={{
      background: 'var(--surface-3)', borderRadius: 4, border: '1px solid var(--border)',
      padding: 18, display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
    }}>
      {/* Header: avatar + name/email — fixed two-line height regardless of name length */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 4, background: accentBg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: accent,
        }}>
          {u.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 14, color: 'var(--text-strong)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {u.name}{isMe && <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}> (você)</span>}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--text-dim)', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{u.email}</div>
        </div>
      </div>

      {/* Meta — leader + departments, consistent block, grows to fill remaining space */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {u.lead_name && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Liderado por <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{u.lead_name}</span>
          </div>
        )}
        <DeptTags departments={u.departments} />
      </div>

      {/* Footer — always pinned at the bottom, identical across cards */}
      <div style={{
        borderTop: '1px solid var(--border)', paddingTop: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Desde {new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onEdit(u)} title="Editar" style={iconBtn('#3B82F6')}><IcEdit size={12} color="#60A5FA" /></button>
          <button onClick={() => onToggle(u)} title={isCoord ? 'Mudar para Técnico' : 'Promover a Coordenador'} style={iconBtn('#6366F1')}><IcRefresh size={12} color="#818CF8" /></button>
          {!isMe && <button onClick={() => onDelete(u)} title="Excluir" style={iconBtn('#EF4444')}><IcTrash size={12} color="#F87171" /></button>}
        </div>
      </div>
    </div>
  );
}

const BLANK_FORM = { name: '', email: '', password: '', role: 'field', lead_id: '', department_ids: [] };

export default function Users() {
  const { user: me } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('cards'); // 'cards' | 'list'

  const load = () => api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); api.get('/departments').then(r => setDepartments(r.data)).catch(() => {}); }, []);

  const coordinatorOptions = users.filter(u => u.role === 'coordinator');

  const toggleDept = (id) => setForm(f => ({
    ...f,
    department_ids: f.department_ids.includes(id) ? f.department_ids.filter(x => x !== id) : [...f.department_ids, id]
  }));

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const coordinators = filtered.filter(u => u.role === 'coordinator');
  const fieldTechs = filtered.filter(u => u.role === 'field');

  function openCreate() { setEditUser(null); setForm(BLANK_FORM); setError(''); setShowModal(true); }
  function openEdit(u) {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, lead_id: u.lead_id || '', department_ids: (u.departments || []).map(d => d.id) });
    setError(''); setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    try {
      if (editUser) {
        const payload = { name: form.name, role: form.role, lead_id: form.lead_id || null, department_ids: form.department_ids };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editUser.id}`, payload);
        setSuccess('Usuário atualizado!');
      } else {
        await api.post('/auth/register', { ...form, lead_id: form.lead_id || null });
        setSuccess('Usuário criado!');
      }
      setShowModal(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
  }

  async function handleDelete(u) {
    if (!confirm(`Excluir "${u.name}"? Esta ação não pode ser desfeita.`)) return;
    try { await api.delete(`/users/${u.id}`); load(); } catch (err) { alert(err.response?.data?.error || 'Erro'); }
  }

  async function toggleRole(u) {
    await api.patch(`/users/${u.id}`, { role: u.role === 'coordinator' ? 'field' : 'coordinator' });
    load();
  }

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-strong)' }}>Usuários</h1>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: 14 }}>{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <IcPlus size={14} color="#fff" style={{ marginRight: 6 }} />
          Adicionar Usuário
        </button>
      </header>

      {success && (
        <div role="status" style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', color: '#6EE7B7', padding: '10px 16px', borderRadius: 4, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcCheck size={14} color="#6EE7B7" /> {success}
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total de usuários', value: users.length, color: '#3B82F6', Icon: IcUsers },
          { label: 'Coordenadores', value: users.filter(u => u.role === 'coordinator').length, color: '#6366F1', Icon: IcShield },
          { label: 'Técnicos de Campo', value: users.filter(u => u.role === 'field').length, color: '#10B981', Icon: IcUser },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} style={{ background: 'var(--surface-3)', borderRadius: 4, padding: '14px 18px', border: '1px solid rgba(var(--ink-rgb),.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 4, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={17} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-1px' }}>{value}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <IcSearch size={14} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input type="search" placeholder="Buscar por nome ou e-mail..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 4, border: '1px solid rgba(var(--ink-rgb),.08)', background: 'var(--surface-3)', color: 'var(--text-strong)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Coordinators section */}
      {coordinators.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <IcShield size={14} color="#818CF8" />
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em' }}>Coordenadores</h2>
            <span style={{ fontSize: 11, color: '#334155' }}>{coordinators.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {coordinators.map(u => (
              <UserCard key={u.id} u={u} me={me} isCoord onEdit={openEdit} onDelete={handleDelete} onToggle={toggleRole} />
            ))}
          </div>
        </section>
      )}

      {/* Field techs section */}
      {fieldTechs.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <IcUser size={14} color="#60A5FA" />
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em' }}>Técnicos de Campo</h2>
            <span style={{ fontSize: 11, color: '#334155' }}>{fieldTechs.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {fieldTechs.map(u => (
              <UserCard key={u.id} u={u} me={me} isCoord={false} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleRole} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#334155' }}>
          <IcUsers size={32} color="#1E293B" />
          <p style={{ marginTop: 12, fontSize: 14 }}>Nenhum usuário encontrado.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="user-modal-title"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--surface-3)', borderRadius: 4, padding: 28, width: '100%', maxWidth: 460, border: '1px solid rgba(var(--ink-rgb),.1)', boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 id="user-modal-title" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
                {editUser ? 'Editar Usuário' : 'Adicionar Usuário'}
              </h2>
              <button onClick={() => setShowModal(false)} aria-label="Fechar" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <IcX size={18} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="u-name" style={lbl}>Nome completo *</label>
                <input id="u-name" type="text" required placeholder="Nome do usuário"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp} />
              </div>
              {!editUser && (
                <div>
                  <label htmlFor="u-email" style={lbl}>E-mail *</label>
                  <input id="u-email" type="email" required placeholder="email@exemplo.com"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inp} />
                </div>
              )}
              <div>
                <label htmlFor="u-password" style={lbl}>{editUser ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}</label>
                <input id="u-password" type="password" required={!editUser} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Função</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                  {[
                    { val: 'field', Icon: IcUser, name: 'Técnico de Campo', hint: 'Executa tarefas no campo' },
                    { val: 'coordinator', Icon: IcShield, name: 'Coordenador', hint: 'Gerencia tarefas e equipes' },
                  ].map(({ val, Icon, name, hint }) => (
                    <button key={val} type="button" onClick={() => setForm(p => ({ ...p, role: val }))}
                      aria-pressed={form.role === val}
                      style={{ padding: '12px', borderRadius: 4, textAlign: 'left', cursor: 'pointer', transition: 'all .15s', border: form.role === val ? '1.5px solid #3B82F6' : '1px solid rgba(var(--ink-rgb),.08)', background: form.role === val ? 'rgba(59,130,246,.12)' : 'var(--surface-2)' }}>
                      <Icon size={18} color={form.role === val ? '#60A5FA' : '#475569'} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: form.role === val ? '#93C5FD' : '#94A3B8', marginTop: 7, marginBottom: 2 }}>{name}</div>
                      <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.4 }}>{hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Áreas / departamentos (selecione uma ou mais)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {departments.length === 0 && <span style={{ fontSize: 12, color: '#475569' }}>Nenhuma área cadastrada ainda.</span>}
                  {departments.map(d => {
                    const on = form.department_ids.includes(d.id);
                    return (
                      <button key={d.id} type="button" onClick={() => toggleDept(d.id)} aria-pressed={on} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 4, cursor: 'pointer',
                        border: on ? `1.5px solid ${d.color}` : '1px solid rgba(var(--ink-rgb),.1)',
                        background: on ? d.color + '18' : 'var(--surface-2)',
                        color: on ? d.color : '#94A3B8', fontSize: 12, fontWeight: 600,
                      }}>
                        {on && <IcCheck size={11} color={d.color} />}
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="u-lead" style={lbl}>Liderado por (coordenador / líder responsável)</label>
                <select id="u-lead" value={form.lead_id} onChange={e => setForm(p => ({ ...p, lead_id: e.target.value }))} style={inp}>
                  <option value="">Sem liderança definida</option>
                  {coordinatorOptions.filter(c => !editUser || c.id !== editUser.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div role="alert" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#FCA5A5', padding: '10px 14px', borderRadius: 4, fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', borderRadius: 4, border: '1px solid rgba(var(--ink-rgb),.1)', background: 'transparent', color: '#94A3B8', fontWeight: 500, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={btnPrimary}>{editUser ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 4, background: '#2563EB', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const iconBtn = c => ({ width: 30, height: 30, borderRadius: 4, border: `1px solid ${c}30`, background: c + '15', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' });
const lbl = { fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 };
const inp = { width: '100%', padding: '10px 12px', borderRadius: 4, border: '1px solid rgba(var(--ink-rgb),.08)', fontSize: 13, background: 'var(--surface-2)', color: 'var(--text-strong)', outline: 'none', boxSizing: 'border-box' };
