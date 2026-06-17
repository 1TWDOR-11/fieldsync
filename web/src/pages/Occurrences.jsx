import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuthContext } from '../App';
import {
  IcAlert, IcPlus, IcUser, IcCalendar, IcX, IcSend, IcMessage,
  IcCheck, IcClock, IcActivity, IcChevronDown
} from '../components/Icons';

const BLUE = '#2563EB'; const TEAL = '#0D9488'; const WARN = '#B45309'; const DNGR = '#DC2626';

const S_COLOR = { open: DNGR, in_progress: WARN, resolved: TEAL };
const S_LABEL = { open: 'Aberta', in_progress: 'Em tratamento', resolved: 'Resolvida' };

export default function Occurrences() {
  const { user } = useAuthContext();
  const isCoord = user?.role === 'coordinator';
  const [occurrences, setOccurrences] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ task_id: '', description: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [detail, setDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const load = () => api.get('/occurrences').then(r => setOccurrences(r.data)).catch(() => {});

  useEffect(() => {
    load();
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => {});
    if (isCoord) api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSuccess('');
    const data = new FormData();
    data.append('description', form.description);
    if (form.task_id) data.append('task_id', form.task_id);
    if (file) data.append('image', file);
    try {
      await api.post('/occurrences', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ task_id: '', description: '' }); setFile(null);
      setSuccess('Ocorrência registrada com sucesso!');
      setShowModal(false);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.error || 'Erro'); }
  }

  function openDetail(o) {
    setDetail(o);
    setComment('');
    setAssignOpen(false);
    api.get(`/occurrences/${o.id}/comments`).then(r => setComments(r.data)).catch(() => setComments([]));
  }

  async function updateOccStatus(id, status) {
    await api.patch(`/occurrences/${id}`, { status });
    load();
    if (detail?.id === id) setDetail(d => ({ ...d, status }));
  }

  async function assignResponsible(id, assigned_to) {
    await api.patch(`/occurrences/${id}`, { assigned_to });
    load();
    setAssignOpen(false);
    if (detail?.id === id) {
      const u = users.find(u => u.id === Number(assigned_to));
      setDetail(d => ({ ...d, assigned_to, assigned_name: u?.name || null }));
    }
  }

  async function postComment() {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/occurrences/${detail.id}/comments`, { comment: comment.trim() });
      setComment('');
      const r = await api.get(`/occurrences/${detail.id}/comments`);
      setComments(r.data);
    } finally { setPosting(false); }
  }

  const filtered = filter === 'all' ? occurrences : occurrences.filter(o => o.status === filter);

  const pills = [
    { val: 'all', label: 'Todas', count: occurrences.length },
    { val: 'open', label: 'Abertas', count: occurrences.filter(o => o.status === 'open').length },
    { val: 'in_progress', label: 'Em tratamento', count: occurrences.filter(o => o.status === 'in_progress').length },
    { val: 'resolved', label: 'Resolvidas', count: occurrences.filter(o => o.status === 'resolved').length },
  ];

  return (
    <div className="col gap-4">
      <header className="row-between" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="text-dim" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Campo</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.5px' }}>Ocorrências</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn" style={{ background: DNGR, borderColor: DNGR, color: '#fff' }}>
          <IcPlus size={14} color="#fff" /> Nova Ocorrência
        </button>
      </header>

      {success && (
        <div className="row gap-2" style={{ background: 'rgba(13,148,136,.1)', border: '1px solid rgba(13,148,136,.3)', color: TEAL, padding: '9px 14px', borderRadius: 'var(--radius)', fontSize: 13, alignItems: 'center' }}>
          <IcCheck size={14} color={TEAL} /> {success}
        </div>
      )}

      <div className="row gap-2">
        {pills.map(({ val, label, count }) => (
          <button key={val} onClick={() => setFilter(val)} className="pill" aria-pressed={filter === val}>
            {label}
            <span style={{ fontSize: 10, opacity: .7 }}>{count}</span>
          </button>
        ))}
      </div>

      <div className="col gap-3">
        {filtered.length === 0 && (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>Nenhuma ocorrência encontrada.</div>
        )}
        {filtered.map(o => (
          <article key={o.id} className="card anim-fade-up" onClick={() => openDetail(o)} style={{ padding: '14px 18px', cursor: 'pointer' }}>
            <div className="row-between" style={{ alignItems: 'flex-start', gap: 14 }}>
              <div className="row gap-3" style={{ flex: 1, minWidth: 0 }}>
                <IcAlert size={15} color={S_COLOR[o.status]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-strong)' }}>{o.task_title || 'Ocorrência geral'}</div>
                  <p className="text-muted" style={{ fontSize: 12, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.description}</p>
                  <div className="row gap-3" style={{ marginTop: 6 }}>
                    <span className="text-dim" style={{ fontSize: 11 }}>por {o.user_name}</span>
                    {o.assigned_name && <span className="row gap-1" style={{ fontSize: 11, color: TEAL, alignItems: 'center' }}><IcUser size={10} color={TEAL} /> {o.assigned_name}</span>}
                  </div>
                </div>
              </div>
              <div className="col gap-2" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                <span className="badge" style={{ color: S_COLOR[o.status], borderColor: S_COLOR[o.status] + '40' }}>{S_LABEL[o.status]}</span>
                <span className="text-dim" style={{ fontSize: 11 }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ── DETAIL MODAL (centered) ── */}
      {detail && (
        <div className="modal-overlay" style={{ padding: 24 }} onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: 18 }}>
              <span className="badge" style={{ color: S_COLOR[detail.status], borderColor: S_COLOR[detail.status] + '40' }}>{S_LABEL[detail.status]}</span>
              <button onClick={() => setDetail(null)} className="btn-icon" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><IcX size={18} color="var(--text-muted)" /></button>
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>{detail.task_title || 'Ocorrência geral'}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-strong)', lineHeight: 1.6, marginBottom: 18 }}>{detail.description}</p>

            {detail.image_url && (
              <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${detail.image_url}`}
                alt="Foto da ocorrência"
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: 18 }} />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              <div className="panel" style={{ padding: '9px 11px' }}>
                <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 4 }}>
                  <IcUser size={11} color="var(--text-dim)" />
                  <span className="label" style={{ marginBottom: 0, fontSize: 9 }}>Reportado por</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500 }}>{detail.user_name}</div>
              </div>
              <div className="panel" style={{ padding: '9px 11px' }}>
                <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 4 }}>
                  <IcCalendar size={11} color="var(--text-dim)" />
                  <span className="label" style={{ marginBottom: 0, fontSize: 9 }}>Data</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500 }}>{new Date(detail.created_at).toLocaleString('pt-BR')}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="label">Responsável pela resolução</div>
              {isCoord ? (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setAssignOpen(o => !o)} className="row gap-2 input" style={{ alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                    <IcUser size={13} color={detail.assigned_name ? TEAL : 'var(--text-dim)'} />
                    <span style={{ fontSize: 13, color: detail.assigned_name ? 'var(--text-strong)' : 'var(--text-dim)', flex: 1, textAlign: 'left' }}>
                      {detail.assigned_name || 'Atribuir responsável'}
                    </span>
                    <IcChevronDown size={12} color="var(--text-dim)" />
                  </button>
                  {assignOpen && (
                    <div className="card" style={{ position: 'absolute', top: '110%', left: 0, right: 0, padding: 4, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                      {users.map(u => (
                        <button key={u.id} onClick={() => assignResponsible(detail.id, u.id)} style={{
                          display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 2, border: 'none',
                          background: detail.assigned_to === u.id ? 'var(--surface-2)' : 'transparent',
                          color: detail.assigned_to === u.id ? TEAL : 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                        }}>{u.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: detail.assigned_name ? 'var(--text-strong)' : 'var(--text-dim)' }}>
                  {detail.assigned_name || 'Ainda não atribuído'}
                </div>
              )}
            </div>

            <div className="row gap-2" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
              {detail.status !== 'open' && <button onClick={() => updateOccStatus(detail.id, 'open')} className="btn btn-ghost btn-sm"><IcAlert size={11} color={DNGR} /> Reabrir</button>}
              {detail.status !== 'in_progress' && <button onClick={() => updateOccStatus(detail.id, 'in_progress')} className="btn btn-ghost btn-sm"><IcActivity size={11} color={WARN} /> Em tratamento</button>}
              {detail.status !== 'resolved' && <button onClick={() => updateOccStatus(detail.id, 'resolved')} className="btn btn-ghost btn-sm"><IcCheck size={11} color={TEAL} /> Marcar resolvida</button>}
            </div>

            <div>
              <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 10 }}>
                <IcMessage size={12} color="var(--text-dim)" />
                <span className="label" style={{ marginBottom: 0 }}>Comentários</span>
                {comments.length > 0 && <span className="text-dim" style={{ fontSize: 10 }}>({comments.length})</span>}
              </div>

              {comments.length === 0
                ? <p className="text-dim" style={{ fontSize: 12, marginBottom: 14 }}>Nenhum comentário ainda.</p>
                : (
                  <div className="col gap-2" style={{ marginBottom: 14, maxHeight: 220, overflowY: 'auto' }}>
                    {comments.map(c => (
                      <div key={c.id} className="row gap-2 panel" style={{ padding: '9px 11px' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                          background: c.user_id === user?.id ? BLUE : 'var(--surface-2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: c.user_id === user?.id ? '#fff' : 'var(--text-muted)',
                        }}>
                          {c.user_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="row gap-2" style={{ alignItems: 'baseline', marginBottom: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-strong)' }}>{c.user_name || 'Usuário'}</span>
                            <span className="text-dim" style={{ fontSize: 10 }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{c.comment}</p>
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
                  placeholder="Adicionar um comentário..."
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
          </div>
        </div>
      )}

      {/* ── NEW OCCURRENCE MODAL ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="row-between" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>Nova Ocorrência</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><IcX size={18} color="var(--text-muted)" /></button>
            </div>
            <form onSubmit={handleSubmit} className="col gap-3">
              <div>
                <label className="label">Tarefa relacionada</label>
                <select className="input" value={form.task_id} onChange={e => setForm(p => ({ ...p, task_id: e.target.value }))}>
                  <option value="">Nenhuma (geral)</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Descrição *</label>
                <textarea className="input" rows={3} required placeholder="Descreva o que aconteceu..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="label">Foto (opcional)</label>
                <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
                  style={{ fontSize: 12, color: 'var(--text-muted)', width: '100%' }} />
                <div className="text-dim" style={{ fontSize: 11, marginTop: 4 }}>Máx. 5MB</div>
              </div>
              {error && <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)', color: '#F87171', padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: 12 }}>{error}</div>}
              <div className="row gap-2" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn" style={{ background: DNGR, borderColor: DNGR, color: '#fff' }}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
