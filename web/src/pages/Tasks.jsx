import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useAuthContext } from '../App';
import {
  IcTasks, IcPlus, IcUser, IcMapPin, IcCalendar, IcCheck, IcTrash,
  IcActivity, IcClock, IcX, IcGrid, IcLayers, IcChevronDown, IcEdit, IcAlert, IcSend, IcMessage
} from '../components/Icons';

const BLUE = '#2563EB'; const TEAL = '#0D9488'; const WARN = '#B45309'; const DNGR = '#DC2626'; const INDG = '#4F46E5';

const S_COLOR = { pending: WARN, in_progress: BLUE, done: TEAL };
const S_LABEL = { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído' };
const P_COLOR = { low: TEAL, medium: WARN, high: DNGR };
const P_LABEL = { low: 'Baixa', medium: 'Média', high: 'Alta' };
const P_RANK  = { high: 3, medium: 2, low: 1 };
const COLS    = ['pending', 'in_progress', 'done'];

const SORTS = [
  { val: 'priority_desc', label: 'Maior prioridade' },
  { val: 'priority_asc',  label: 'Menor prioridade' },
  { val: 'alpha',         label: 'Ordem alfabética' },
  { val: 'recent',        label: 'Mais recentes' },
];

export default function Tasks() {
  const { user } = useAuthContext();
  const isCoord = user?.role === 'coordinator';
  const [tasks, setTasks]   = useState([]);
  const [users, setUsers]   = useState([]);
  const [filter, setFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sort, setSort]     = useState('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView]     = useState('list'); // 'list' | 'kanban'
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState(null); // task being viewed
  const [detailLog, setDetailLog] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [form, setForm]     = useState({ title: '', description: '', objective: '', assigned_to: '', priority: 'medium', location: '', due_date: '' });
  const [error, setError]   = useState('');

  const load = () => api.get('/tasks').then(r => setTasks(r.data)).catch(() => {});

  useEffect(() => {
    load();
    if (isCoord) api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const filtered = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => {
      if (assigneeFilter === 'all') return true;
      if (assigneeFilter === 'me') return t.assigned_to === user?.id;
      if (assigneeFilter === 'unassigned') return !t.assigned_to;
      return t.assigned_to === Number(assigneeFilter);
    });

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'priority_desc') arr.sort((a, b) => P_RANK[b.priority] - P_RANK[a.priority]);
    else if (sort === 'priority_asc') arr.sort((a, b) => P_RANK[a.priority] - P_RANK[b.priority]);
    else if (sort === 'alpha') arr.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    else arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return arr;
  }, [filtered, sort]);

  async function handleCreate(e) {
    e.preventDefault(); setError('');
    try {
      await api.post('/tasks', form);
      setShowModal(false);
      setForm({ title: '', description: '', objective: '', assigned_to: '', priority: 'medium', location: '', due_date: '' });
      load();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao criar tarefa'); }
  }

  async function updateStatus(id, status) {
    await api.patch(`/tasks/${id}/status`, { status });
    load();
    if (detail?.id === id) setDetail(d => ({ ...d, status }));
  }
  async function deleteTask(id) { if (!confirm('Excluir tarefa?')) return; await api.delete(`/tasks/${id}`); load(); setDetail(null); }

  function openDetail(t) {
    setDetail(t);
    setEditing(false);
    setComment('');
    setEditForm({ title: t.title, description: t.description || '', objective: t.objective || '', priority: t.priority, location: t.location || '', due_date: t.due_date || '', assigned_to: t.assigned_to || '' });
    api.get(`/occurrences?task_id=${t.id}`).then(r => setDetailLog(r.data)).catch(() => setDetailLog([]));
  }

  async function saveEdit() {
    await api.patch(`/tasks/${detail.id}`, editForm);
    setEditing(false);
    load();
    setDetail(d => ({ ...d, ...editForm }));
  }

  async function postComment() {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post('/occurrences', { task_id: detail.id, description: comment.trim() });
      setComment('');
      const r = await api.get(`/occurrences?task_id=${detail.id}`);
      setDetailLog(r.data);
    } finally { setPosting(false); }
  }

  const pills = [
    { val: 'all',        label: 'Todas',        count: tasks.length },
    { val: 'pending',    label: 'Pendentes',     count: tasks.filter(t=>t.status==='pending').length },
    { val: 'in_progress',label: 'Em andamento',  count: tasks.filter(t=>t.status==='in_progress').length },
    { val: 'done',       label: 'Concluídas',    count: tasks.filter(t=>t.status==='done').length },
  ];

  return (
    <div className="col gap-4">

      <header className="row-between" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="text-dim" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Campo</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.5px' }}>Tarefas</h1>
        </div>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <div className="row" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 2 }}>
            {[['list', IcLayers, 'Lista'], ['kanban', IcGrid, 'Kanban']].map(([val, Icon, label]) => (
              <button key={val} onClick={() => setView(val)} className="row gap-2" style={{
                padding: '6px 11px', borderRadius: 3, border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: view === val ? BLUE : 'transparent',
                color: view === val ? '#fff' : 'var(--text-muted)',
              }}>
                <Icon size={12} color={view === val ? '#fff' : 'var(--text-muted)'} /> {label}
              </button>
            ))}
          </div>

          <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className="input" style={{ width: 'auto', padding: '8px 10px', fontSize: 12, fontWeight: 500 }}>
            <option value="all">Todas as pessoas</option>
            <option value="me">Minhas tarefas</option>
            {isCoord && <option value="unassigned">Não atribuídas</option>}
            {isCoord && users.filter(u => u.id !== user?.id).map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setSortOpen(o => !o)} className="btn btn-sm">
              {SORTS.find(s => s.val === sort)?.label}
              <IcChevronDown size={11} color="var(--text-muted)" />
            </button>
            {sortOpen && (
              <div className="card" style={{ position: 'absolute', top: '110%', right: 0, padding: 4, minWidth: 170, zIndex: 20 }}>
                {SORTS.map(s => (
                  <button key={s.val} onClick={() => { setSort(s.val); setSortOpen(false); }} style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 2, border: 'none',
                    background: sort === s.val ? 'var(--surface-2)' : 'transparent',
                    color: sort === s.val ? 'var(--text-strong)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                  }}>{s.label}</button>
                ))}
              </div>
            )}
          </div>

          {isCoord && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <IcPlus size={14} color="#fff" /> Nova Tarefa
            </button>
          )}
        </div>
      </header>

      <div className="row gap-2">
        {pills.map(({ val, label, count }) => (
          <button key={val} onClick={() => setFilter(val)} className="pill" aria-pressed={filter === val}>
            {label}
            <span style={{ fontSize: 10, opacity: .7 }}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="col gap-3">
          {sorted.length === 0 && (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>Nenhuma tarefa encontrada.</div>
          )}
          {sorted.map((t) => (
            <article key={t.id} className="card anim-fade-up" onClick={() => openDetail(t)} style={{ padding: '16px 20px', cursor: 'pointer' }}>
              <div className="row-between" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>{t.title}</h2>
                  {t.description && <p className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{t.description}</p>}
                  <div className="row gap-3" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                    {t.assigned_name && <span className="row gap-1 text-dim" style={{ fontSize: 11, alignItems: 'center' }}><IcUser size={11} color="currentColor" />{t.assigned_name}</span>}
                    {t.location && <span className="row gap-1 text-dim" style={{ fontSize: 11, alignItems: 'center' }}><IcMapPin size={11} color="currentColor" />{t.location}</span>}
                    {t.due_date && <span className="row gap-1 text-dim" style={{ fontSize: 11, alignItems: 'center' }}><IcCalendar size={11} color="currentColor" />{t.due_date}</span>}
                  </div>
                </div>
                <div className="col gap-2" style={{ alignItems: 'flex-end' }}>
                  <span className="badge" style={{ color: S_COLOR[t.status], borderColor: S_COLOR[t.status] + '40' }}>{S_LABEL[t.status]}</span>
                  <span className="badge" style={{ color: P_COLOR[t.priority], borderColor: P_COLOR[t.priority] + '40' }}>{P_LABEL[t.priority]}</span>
                </div>
              </div>
              <div className="row gap-2" style={{ marginTop: 12, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                {t.status !== 'in_progress' && t.status !== 'done' && (
                  <button onClick={() => updateStatus(t.id, 'in_progress')} className="btn btn-ghost btn-sm"><IcActivity size={11} color={BLUE} /> Iniciar</button>
                )}
                {t.status !== 'done' && (
                  <button onClick={() => updateStatus(t.id, 'done')} className="btn btn-ghost btn-sm"><IcCheck size={11} color={TEAL} /> Concluir</button>
                )}
                {t.status !== 'pending' && (
                  <button onClick={() => updateStatus(t.id, 'pending')} className="btn btn-ghost btn-sm"><IcClock size={11} color={WARN} /> Reabrir</button>
                )}
                <button onClick={() => openDetail(t)} className="btn btn-ghost btn-sm"><IcUser size={11} color={INDG} /> Ver detalhes</button>
                {isCoord && (
                  <button onClick={() => deleteTask(t.id)} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}><IcTrash size={11} color={DNGR} /> Excluir</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {view === 'kanban' && (
        <div className="kanban-wrap">
        <div className="kanban-board">
          {COLS.map(col => {
            const colTasks = sorted.filter(t => t.status === col);
            return (
              <div key={col} className="card col gap-2" style={{ padding: 12, minHeight: 200 }}>
                <div className="row gap-2" style={{ padding: '2px 4px 8px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: S_COLOR[col] }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)' }}>{S_LABEL[col]}</span>
                  <span className="text-dim" style={{ fontSize: 10, marginLeft: 'auto' }}>{colTasks.length}</span>
                </div>
                {colTasks.length === 0 && <p className="text-dim" style={{ fontSize: 11, padding: '6px 4px' }}>Sem tarefas.</p>}
                {colTasks.map(t => (
                  <div key={t.id} onClick={() => openDetail(t)} className="panel" style={{ padding: '10px 12px', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>{t.title}</div>
                    <div className="row-between">
                      <span className="badge" style={{ color: P_COLOR[t.priority], borderColor: P_COLOR[t.priority] + '40' }}>{P_LABEL[t.priority]}</span>
                      {t.assigned_name && <span className="text-dim" style={{ fontSize: 10 }}>{t.assigned_name.split(' ')[0]}</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* ── DETAIL POPUP (centered) ── */}
      {detail && (
        <div className="modal-overlay" style={{ padding: 24 }} onClick={() => setDetail(null)}>
          <div className="modal col" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: 18 }}>
              <span className="badge" style={{ color: S_COLOR[detail.status], borderColor: S_COLOR[detail.status] + '40' }}>{S_LABEL[detail.status]}</span>
              <button onClick={() => setDetail(null)} className="btn-icon btn-ghost" style={{ border: 'none', background: 'none' }}><IcX size={18} color="var(--text-muted)" /></button>
            </div>

            {!editing ? (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>{detail.title}</h2>
                <div className="row gap-2" style={{ marginBottom: 18, flexWrap: 'wrap' }}>
                  <span className="badge" style={{ color: P_COLOR[detail.priority], borderColor: P_COLOR[detail.priority] + '40' }}>Prioridade {P_LABEL[detail.priority]}</span>
                  {detail.project_name && <span className="badge">{detail.project_name}</span>}
                </div>

                <div className="col gap-3" style={{ marginBottom: 20 }}>
                  {[
                    ['O que é a tarefa', detail.description],
                    ['Objetivo', detail.objective],
                  ].map(([label, val]) => val && (
                    <div key={label}>
                      <div className="label">{label}</div>
                      <p style={{ fontSize: 13, color: 'var(--text-strong)', lineHeight: 1.6 }}>{val}</p>
                    </div>
                  ))}
                  {!detail.description && !detail.objective && (
                    <p className="text-dim" style={{ fontSize: 12 }}>Nenhuma descrição ou objetivo cadastrado.</p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {[
                    [IcUser, 'Responsável', detail.assigned_name || 'Não atribuída'],
                    [IcMapPin, 'Local', detail.location || '—'],
                    [IcCalendar, 'Prazo', detail.due_date || '—'],
                    [IcUser, 'Criado por', detail.creator_name || '—'],
                  ].map(([Icon, label, val]) => (
                    <div key={label} className="panel" style={{ padding: '9px 11px' }}>
                      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 4 }}>
                        <Icon size={11} color="var(--text-dim)" />
                        <span className="label" style={{ marginBottom: 0, fontSize: 9 }}>{label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500 }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 10 }}>
                    <IcMessage size={12} color="var(--text-dim)" />
                    <span className="label" style={{ marginBottom: 0 }}>Andamento e comentários</span>
                    {detailLog.length > 0 && <span className="text-dim" style={{ fontSize: 10 }}>({detailLog.length})</span>}
                  </div>

                  {detailLog.length === 0
                    ? <p className="text-dim" style={{ fontSize: 12, marginBottom: 14 }}>Nenhum comentário ainda. Seja o primeiro a registrar o andamento.</p>
                    : (
                      <div className="col gap-2" style={{ marginBottom: 14, maxHeight: 240, overflowY: 'auto' }}>
                        {detailLog.map(o => (
                          <div key={o.id} className="row gap-2 panel" style={{ padding: '9px 11px' }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                              background: o.user_id === user?.id ? BLUE : 'var(--surface-2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, color: o.user_id === user?.id ? '#fff' : 'var(--text-muted)',
                            }}>
                              {o.user_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="row gap-2" style={{ alignItems: 'baseline', marginBottom: 3 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-strong)' }}>{o.user_name || 'Usuário'}</span>
                                <span className="text-dim" style={{ fontSize: 10 }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <p className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{o.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  <div className="row gap-2" style={{ alignItems: 'flex-end' }}>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }}
                      placeholder="Adicionar um comentário sobre o andamento..."
                      rows={2}
                      className="input"
                      style={{ resize: 'none', flex: 1 }}
                    />
                    <button onClick={postComment} disabled={posting || !comment.trim()} className="btn-icon" style={{
                      width: 36, height: 36, borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexShrink: 0,
                      background: comment.trim() ? BLUE : 'var(--surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: comment.trim() ? 'pointer' : 'default', opacity: posting ? .6 : 1,
                    }}>
                      <IcSend size={14} color={comment.trim() ? '#fff' : 'var(--text-dim)'} />
                    </button>
                  </div>
                </div>

                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  {detail.status !== 'in_progress' && detail.status !== 'done' && (
                    <button onClick={() => updateStatus(detail.id, 'in_progress')} className="btn btn-ghost btn-sm"><IcActivity size={11} color={BLUE} /> Iniciar</button>
                  )}
                  {detail.status !== 'done' && (
                    <button onClick={() => updateStatus(detail.id, 'done')} className="btn btn-ghost btn-sm"><IcCheck size={11} color={TEAL} /> Concluir</button>
                  )}
                  {detail.status !== 'pending' && (
                    <button onClick={() => updateStatus(detail.id, 'pending')} className="btn btn-ghost btn-sm"><IcClock size={11} color={WARN} /> Reabrir</button>
                  )}
                  {isCoord && (
                    <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm"><IcEdit size={11} color={INDG} /> Editar</button>
                  )}
                  {isCoord && (
                    <button onClick={() => deleteTask(detail.id)} className="btn btn-ghost btn-sm"><IcTrash size={11} color={DNGR} /> Excluir</button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 16 }}>Editar tarefa</h2>
                <div className="col gap-3">
                  <div><label className="label">Título</label><input className="input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
                  <div><label className="label">Descrição (o que é a tarefa)</label><textarea className="input" rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                  <div><label className="label">Objetivo</label><textarea className="input" rows={2} value={editForm.objective} onChange={e => setEditForm(f => ({ ...f, objective: e.target.value }))} style={{ resize: 'vertical' }} placeholder="Qual o resultado esperado?" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label className="label">Local</label><input className="input" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} /></div>
                    <div><label className="label">Prazo</label><input className="input" type="date" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label">Prioridade</label>
                      <select className="input" value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                        <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Atribuir a</label>
                      <select className="input" value={editForm.assigned_to} onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}>
                        <option value="">Ninguém</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="row gap-2" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
                    <button onClick={() => setEditing(false)} className="btn btn-ghost">Cancelar</button>
                    <button onClick={saveEdit} className="btn btn-primary">Salvar</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="row-between" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>Nova Tarefa</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><IcX size={18} color="var(--text-muted)" /></button>
            </div>
            <form onSubmit={handleCreate} className="col gap-3">
              <div>
                <label className="label">Título *</label>
                <input className="input" type="text" required placeholder="Ex: Instalação elétrica bloco A" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Descrição — o que é a tarefa</label>
                <textarea className="input" rows={2} placeholder="Detalhes do que precisa ser feito..." value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="label">Objetivo</label>
                <textarea className="input" rows={2} placeholder="Qual o resultado esperado..." value={form.objective}
                  onChange={e => setForm(p => ({ ...p, objective: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Local</label>
                  <input className="input" type="text" placeholder="Ex: Bloco A, Andar 3" value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Prazo</label>
                  <input className="input" type="date" value={form.due_date}
                    onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Prioridade</label>
                  <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="label">Atribuir a</label>
                  <select className="input" value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}>
                    <option value="">Ninguém</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              {error && <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)', color: '#F87171', padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: 12 }}>{error}</div>}
              <div className="row gap-2" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
