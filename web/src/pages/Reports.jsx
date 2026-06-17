import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuthContext } from '../App';
import {
  IcBriefcase, IcFolder, IcPlus, IcEdit, IcTrash,
  IcSearch, IcFilter, IcRefresh, IcX, IcCheck, IcBuilding, IcLayers, IcUser, IcMapPin, IcCalendar, IcChevronDown
} from '../components/Icons';

const CLIENT_STATUS = {
  prospect: { label: 'Prospect', color: '#6366F1' },
  active: { label: 'Ativo', color: '#10B981' },
  inactive: { label: 'Inativo', color: '#475569' },
  churned: { label: 'Churned', color: '#EF4444' },
};

const PROJ_STATUS = {
  planning: { label: 'Planejamento', color: '#6366F1' },
  active: { label: 'Ativo', color: '#3B82F6' },
  on_hold: { label: 'Em espera', color: '#F59E0B' },
  completed: { label: 'Concluído', color: '#10B981' },
  cancelled: { label: 'Cancelado', color: '#EF4444' },
};

const TASK_STATUS = {
  pending: { label: 'Pendente', color: '#F59E0B' },
  in_progress: { label: 'Em andamento', color: '#3B82F6' },
  done: { label: 'Concluído', color: '#10B981' },
};

const TEAM_COLOR = { operational: '#3B82F6', administrative: '#6366F1', product: '#F59E0B', field: '#10B981' };
const TEAM_LABEL = { operational: 'Operacional', administrative: 'Administrativo', product: 'Produto', field: 'Campo' };
const SEGMENTS = ['Todos', 'Tecnologia', 'Saúde', 'Educação', 'Varejo', 'Indústria', 'Serviços', 'Outros'];

function Badge({ color, label }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 4, background: color + '20', color, letterSpacing: '.03em', display: 'inline-block' }}>
      {label}
    </span>
  );
}

function ProgressBar({ value, color = '#3B82F6' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, background: color, height: '100%', borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color: '#64748B', minWidth: 28, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

const INPUT = {
  background: 'var(--surface-2)', border: '1px solid rgba(var(--ink-rgb),.1)', borderRadius: 4,
  color: 'var(--text-strong)', padding: '9px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box', outline: 'none'
};

const BLANK_CLIENT = { name: '', contact_name: '', contact_email: '', segment: 'Outros', status: 'prospect', needs: '', service: '', responsible_id: '', attachments: '' };
const BLANK_PROJ = { name: '', client_id: '', team: 'operational', status: 'planning', start_date: '', end_date: '', description: '', progress: 0 };
const BLANK_DEPT = { name: '', description: '', color: '#1A6FFF', lead_id: '' };
const DEPT_COLORS = ['#1A6FFF', '#00C9A7', '#6366F1', '#F59E0B', '#FF4D6A', '#10B981'];

export default function Reports() {
  const { user } = useAuthContext();
  const isCoord = user?.role === 'coordinator';

  const [tab, setTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [segFilter, setSegFilter] = useState('Todos');
  const [teamFilter, setTeamFilter] = useState('all');
  const [modal, setModal] = useState(null); // { type: 'client'|'project'|'department', data: {...} }
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [clientDetail, setClientDetail] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);
  const [expandedProject, setExpandedProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loadingProjectTasks, setLoadingProjectTasks] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/clients'), api.get('/projects'), api.get('/departments'), api.get('/users')]).then(([c, p, d, u]) => {
      setClients(c.data);
      setProjects(p.data);
      setDepartments(d.data);
      setUsers(u.data);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openModal = (type, data = null) => {
    setForm(data ? { ...data } : type === 'client' ? { ...BLANK_CLIENT } : type === 'project' ? { ...BLANK_PROJ } : { ...BLANK_DEPT });
    setModal({ type, edit: !!data });
    setErr('');
  };
  const closeModal = () => { setModal(null); setForm({}); setErr(''); };

  const saveClient = async () => {
    if (!form.name) return setErr('Nome obrigatório');
    setSaving(true);
    try {
      if (modal.edit) await api.patch(`/clients/${form.id}`, form);
      else await api.post('/clients', form);
      load(); closeModal();
    } catch { setErr('Erro ao salvar'); } finally { setSaving(false); }
  };

  const saveProject = async () => {
    if (!form.name) return setErr('Nome obrigatório');
    setSaving(true);
    try {
      if (modal.edit) await api.patch(`/projects/${form.id}`, form);
      else await api.post('/projects', form);
      load(); closeModal();
    } catch { setErr('Erro ao salvar'); } finally { setSaving(false); }
  };

  const deleteClient = async (id) => {
    if (!window.confirm('Excluir cliente?')) return;
    await api.delete(`/clients/${id}`);
    setClients(c => c.filter(x => x.id !== id));
  };

  const openClientDetail = (c) => {
    setClientDetail(c);
    setExpandedProject(null);
    setProjectTasks([]);
    api.get(`/clients/${c.id}/projects`).then(r => setClientProjects(r.data)).catch(() => setClientProjects([]));
  };

  const toggleProjectExpand = (p) => {
    if (expandedProject?.id === p.id) { setExpandedProject(null); setProjectTasks([]); return; }
    setExpandedProject(p);
    setLoadingProjectTasks(true);
    api.get(`/tasks?project_id=${p.id}`).then(r => setProjectTasks(r.data)).catch(() => setProjectTasks([])).finally(() => setLoadingProjectTasks(false));
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Excluir projeto?')) return;
    await api.delete(`/projects/${id}`);
    setProjects(p => p.filter(x => x.id !== id));
  };

  const saveDepartment = async () => {
    if (!form.name) return setErr('Nome obrigatório');
    setSaving(true);
    try {
      if (modal.edit) await api.patch(`/departments/${form.id}`, form);
      else await api.post('/departments', form);
      load(); closeModal();
    } catch { setErr('Erro ao salvar'); } finally { setSaving(false); }
  };

  const deleteDepartment = async (id) => {
    if (!window.confirm('Excluir área?')) return;
    await api.delete(`/departments/${id}`);
    setDepartments(d => d.filter(x => x.id !== id));
  };

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name?.toLowerCase().includes(q) || c.contact_name?.toLowerCase().includes(q);
    const matchSeg = segFilter === 'Todos' || c.segment === segFilter;
    return matchQ && matchSeg;
  });

  const filteredProjects = projects.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name?.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q);
    const matchTeam = teamFilter === 'all' || p.team === teamFilter;
    return matchQ && matchTeam;
  });

  const clientsKpi = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    prospect: clients.filter(c => c.status === 'prospect').length,
    churned: clients.filter(c => c.status === 'churned').length,
  };

  const projectsKpi = Object.keys(TEAM_LABEL).map(t => ({
    team: t, label: TEAM_LABEL[t], color: TEAM_COLOR[t],
    count: projects.filter(p => p.team === t).length,
    active: projects.filter(p => p.team === t && p.status === 'active').length,
  }));

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-strong)' }}>Relatórios</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>Gestão de clientes, projetos e fluxos de equipe</p>
        </div>
        {isCoord && (
          <button onClick={() => openModal(tab === 'clients' ? 'client' : tab === 'projects' ? 'project' : 'department')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 4, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <IcPlus size={15} color="#fff" />
            {tab === 'clients' ? 'Novo cliente' : tab === 'projects' ? 'Novo projeto' : 'Nova área'}
          </button>
        )}
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(var(--ink-rgb),.06)', marginBottom: 24 }}>
        {[{ id: 'clients', label: 'Clientes', Icon: IcBuilding }, { id: 'projects', label: 'Projetos por equipe', Icon: IcFolder }, { id: 'departments', label: 'Áreas da empresa', Icon: IcLayers }].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => { setTab(id); setSearch(''); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: '8px 8px 0 0', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === id ? 'var(--surface-3)' : 'transparent', color: tab === id ? '#3B82F6' : '#64748B', borderBottom: tab === id ? '2px solid #3B82F6' : '2px solid transparent' }}>
            <Icon size={14} color={tab === id ? '#3B82F6' : '#64748B'} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── CLIENTS TAB ─── */}
      {tab === 'clients' && (
        <>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total', value: clientsKpi.total, color: '#3B82F6' },
              { label: 'Ativos', value: clientsKpi.active, color: '#10B981' },
              { label: 'Prospects', value: clientsKpi.prospect, color: '#6366F1' },
              { label: 'Churned', value: clientsKpi.churned, color: '#EF4444' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--surface-3)', borderRadius: 4, padding: '14px 16px', border: `1px solid rgba(var(--ink-rgb),.06)` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <IcSearch size={14} color="#475569" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." style={{ ...INPUT, paddingLeft: 34 }} />
            </div>
            <select value={segFilter} onChange={e => setSegFilter(e.target.value)} style={{ ...INPUT, width: 'auto', background: 'var(--surface-3)' }}>
              {SEGMENTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={load} style={{ background: 'rgba(var(--ink-rgb),.06)', border: '1px solid rgba(var(--ink-rgb),.1)', borderRadius: 4, padding: '9px 12px', cursor: 'pointer', color: '#64748B' }}>
              <IcRefresh size={14} color="#64748B" />
            </button>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--surface-3)', borderRadius: 4, border: '1px solid rgba(var(--ink-rgb),.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(var(--ink-rgb),.06)' }}>
                  {['Cliente', 'Segmento', 'Contato', 'Status', 'Projetos', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c, i) => (
                  <tr key={c.id} onClick={() => openClientDetail(c)} style={{ borderBottom: i < filteredClients.length - 1 ? '1px solid rgba(var(--ink-rgb),.04)' : 'none', cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--ink-rgb),.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{c.name}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{c.segment || '–'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#94A3B8' }}>{c.contact_name || '–'}</div>
                      {c.contact_email && <div style={{ fontSize: 11, color: '#475569' }}>{c.contact_email}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge color={CLIENT_STATUS[c.status]?.color || '#475569'} label={CLIENT_STATUS[c.status]?.label || c.status} />
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{c.project_count ?? 0}</td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      {isCoord && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openModal('client', c)} style={{ background: 'none', border: '1px solid rgba(var(--ink-rgb),.1)', borderRadius: 4, padding: '5px 8px', cursor: 'pointer', color: '#64748B' }}><IcEdit size={12} color="#64748B" /></button>
                          <button onClick={() => deleteClient(c.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,.3)', borderRadius: 4, padding: '5px 8px', cursor: 'pointer', color: '#EF4444' }}><IcTrash size={12} color="#EF4444" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#334155' }}>Nenhum cliente encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── PROJECTS TAB ─── */}
      {tab === 'projects' && (
        <>
          {/* Team KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {projectsKpi.map(({ team, label, color, count, active }) => (
              <div key={team} style={{ background: 'var(--surface-3)', borderRadius: 4, padding: '14px 16px', border: '1px solid rgba(var(--ink-rgb),.06)', cursor: 'pointer', outline: teamFilter === team ? `2px solid ${color}` : 'none' }} onClick={() => setTeamFilter(teamFilter === team ? 'all' : team)}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)', marginTop: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{active} ativos</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <IcSearch size={14} color="#475569" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar projeto ou cliente..." style={{ ...INPUT, paddingLeft: 34 }} />
            </div>
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} style={{ ...INPUT, width: 'auto', background: 'var(--surface-3)' }}>
              <option value="all">Todas as equipes</option>
              {Object.entries(TEAM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* Project cards by team group */}
          {(teamFilter === 'all' ? Object.keys(TEAM_LABEL) : [teamFilter]).map(team => {
            const list = filteredProjects.filter(p => p.team === team);
            if (list.length === 0) return null;
            return (
              <div key={team} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: TEAM_COLOR[team], display: 'block' }} />
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{TEAM_LABEL[team]}</h3>
                  <span style={{ fontSize: 11, color: '#334155' }}>{list.length} projeto{list.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {list.map(p => (
                    <div key={p.id} style={{ background: 'var(--surface-3)', borderRadius: 4, border: '1px solid rgba(var(--ink-rgb),.06)', padding: 16, position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 13 }}>{p.name}</div>
                          {p.client_name && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{p.client_name}</div>}
                        </div>
                        <Badge color={PROJ_STATUS[p.status]?.color || '#475569'} label={PROJ_STATUS[p.status]?.label || p.status} />
                      </div>
                      {p.description && <p style={{ fontSize: 11, color: '#64748B', marginBottom: 10, lineHeight: 1.5, marginTop: 0 }}>{p.description.slice(0, 80)}{p.description.length > 80 ? '…' : ''}</p>}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: '#475569' }}>Progresso</span>
                          <span style={{ fontSize: 10, color: '#64748B' }}>{p.task_count > 0 ? `${p.done_count}/${p.task_count} tarefas` : 'Sem tarefas'}</span>
                        </div>
                        <ProgressBar value={p.progress || 0} color={TEAM_COLOR[team]} />
                      </div>
                      {isCoord && (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => openModal('project', p)} style={{ background: 'none', border: '1px solid rgba(var(--ink-rgb),.1)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}><IcEdit size={12} color="#64748B" /></button>
                          <button onClick={() => deleteProject(p.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,.3)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}><IcTrash size={12} color="#EF4444" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredProjects.length === 0 && <p style={{ color: '#334155', fontSize: 13, padding: 24, textAlign: 'center' }}>Nenhum projeto encontrado.</p>}
        </>
      )}

      {/* ─── DEPARTMENTS TAB ─── */}
      {tab === 'departments' && (
        <>
          <p style={{ color: '#64748B', fontSize: 13, marginBottom: 18 }}>
            Cadastre as diferentes áreas/setores da empresa (ex: operações, administrativo, produto, comercial) para organizar equipes e responsabilidades.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {departments.map(d => (
              <div key={d.id} style={{ background: 'var(--surface-3)', borderRadius: 4, border: '1px solid rgba(var(--ink-rgb),.06)', padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 4, background: d.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IcLayers size={16} color={d.color} />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 14 }}>{d.name}</div>
                  </div>
                  {isCoord && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openModal('department', d)} style={{ background: 'none', border: '1px solid rgba(var(--ink-rgb),.1)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}><IcEdit size={12} color="#64748B" /></button>
                      <button onClick={() => deleteDepartment(d.id)} style={{ background: 'none', border: '1px solid rgba(239,68,68,.3)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}><IcTrash size={12} color="#EF4444" /></button>
                    </div>
                  )}
                </div>
                {d.description && <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginBottom: 12 }}>{d.description}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingTop: 10, borderTop: '1px solid rgba(var(--ink-rgb),.06)' }}>
                  <IcUser size={12} color="#475569" />
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{d.lead_name ? `Responsável: ${d.lead_name}` : 'Sem responsável definido'}</span>
                </div>
              </div>
            ))}
          </div>
          {departments.length === 0 && <p style={{ color: '#334155', fontSize: 13, padding: 24, textAlign: 'center' }}>Nenhuma área cadastrada ainda.</p>}
        </>
      )}

      {/* ─── CLIENT DETAIL MODAL ─── */}
      {clientDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,.80)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: 24 }} onClick={() => setClientDetail(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 600, maxWidth: '94vw', maxHeight: '88vh', overflowY: 'auto',
            background: 'var(--surface)', border: '1px solid rgba(var(--ink-rgb),.1)', borderRadius: 4,
            padding: '28px 28px', boxShadow: '0 30px 90px rgba(0,0,0,.55)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <Badge color={CLIENT_STATUS[clientDetail.status]?.color || '#475569'} label={CLIENT_STATUS[clientDetail.status]?.label || clientDetail.status} />
              <button onClick={() => setClientDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><IcX size={18} color="rgba(var(--ink-rgb),.4)" /></button>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 4 }}>{clientDetail.name}</h2>
            <p style={{ fontSize: 12, color: 'rgba(var(--ink-rgb),.35)', marginBottom: 20 }}>{clientDetail.segment || 'Sem segmento definido'}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                [IcUser, 'Ponto focal', clientDetail.contact_name || 'Não definido'],
                ['@', 'E-mail', clientDetail.contact_email || '—'],
                [IcBriefcase, 'Serviço contratado', clientDetail.service || 'Não definido'],
                [IcUser, 'Responsável (próximos passos)', clientDetail.responsible_name || 'Não atribuído'],
              ].map(([Icon, label, val], i) => (
                <div key={i} style={{ background: 'rgba(var(--ink-rgb),.04)', borderRadius: 4, padding: '10px 12px', border: '1px solid rgba(var(--ink-rgb),.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {typeof Icon === 'string' ? <span style={{ fontSize: 10, color: 'rgba(var(--ink-rgb),.3)' }}>{Icon}</span> : <Icon size={11} color="rgba(var(--ink-rgb),.3)" />}
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(var(--ink-rgb),.3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(var(--ink-rgb),.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Necessidades do cliente</div>
              <p style={{ fontSize: 13, color: 'var(--text-strong)', lineHeight: 1.6 }}>{clientDetail.needs || 'Nenhuma necessidade registrada ainda.'}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(var(--ink-rgb),.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Anexos importantes</div>
              {clientDetail.attachments
                ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {clientDetail.attachments.split('\n').filter(Boolean).map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(var(--ink-rgb),.04)', borderRadius: 4, padding: '7px 12px', border: '1px solid rgba(var(--ink-rgb),.06)' }}>
                        <IcFolder size={12} color="#1A6FFF" />
                        <span style={{ fontSize: 12, color: 'var(--text-strong)' }}>{a}</span>
                      </div>
                    ))}
                  </div>
                )
                : <p style={{ fontSize: 12, color: 'rgba(var(--ink-rgb),.25)' }}>Nenhum anexo registrado.</p>}
            </div>

            {/* Linked projects — delivery/success tracking */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(var(--ink-rgb),.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                Projetos vinculados e processo de entrega ({clientProjects.length})
              </div>
              {clientProjects.length === 0
                ? <p style={{ fontSize: 12, color: 'rgba(var(--ink-rgb),.25)' }}>Nenhum projeto vinculado a este cliente.</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {clientProjects.map(p => {
                      const open = expandedProject?.id === p.id;
                      const responsibleNames = [...new Set(projectTasks.map(t => t.assigned_name).filter(Boolean))];
                      return (
                        <div key={p.id} style={{ background: 'rgba(var(--ink-rgb),.035)', border: '1px solid rgba(var(--ink-rgb),.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div onClick={() => toggleProjectExpand(p)} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IcChevronDown size={12} color="rgba(var(--ink-rgb),.3)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{p.name}</div>
                                  <div style={{ fontSize: 11, color: 'rgba(var(--ink-rgb),.3)', marginTop: 2 }}>{TEAM_LABEL[p.team]} · {p.task_count > 0 ? `${p.done_count}/${p.task_count} tarefas concluídas` : 'Sem tarefas'}</div>
                                </div>
                              </div>
                              <Badge color={PROJ_STATUS[p.status]?.color || '#475569'} label={PROJ_STATUS[p.status]?.label || p.status} />
                            </div>
                            <ProgressBar value={p.progress || 0} color={TEAM_COLOR[p.team]} />
                          </div>

                          {open && (
                            <div style={{ borderTop: '1px solid rgba(var(--ink-rgb),.06)', padding: '12px 14px', background: 'rgba(var(--ink-rgb),.02)' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(var(--ink-rgb),.3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                                Responsáveis pelo andamento
                              </div>
                              {responsibleNames.length === 0
                                ? <p style={{ fontSize: 12, color: 'rgba(var(--ink-rgb),.25)', marginBottom: 14 }}>Nenhuma tarefa atribuída ainda.</p>
                                : (
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                                    {responsibleNames.map(name => (
                                      <span key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-strong)', background: 'rgba(var(--ink-rgb),.06)', borderRadius: 4, padding: '4px 10px' }}>
                                        <IcUser size={10} color="rgba(var(--ink-rgb),.4)" /> {name}
                                      </span>
                                    ))}
                                  </div>
                                )}

                              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(var(--ink-rgb),.3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                                Tarefas do projeto ({projectTasks.length})
                              </div>
                              {loadingProjectTasks
                                ? <p style={{ fontSize: 12, color: 'rgba(var(--ink-rgb),.25)' }}>Carregando...</p>
                                : projectTasks.length === 0
                                  ? <p style={{ fontSize: 12, color: 'rgba(var(--ink-rgb),.25)' }}>Nenhuma tarefa cadastrada para este projeto.</p>
                                  : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                      {projectTasks.map(t => (
                                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: 'rgba(var(--ink-rgb),.04)', borderRadius: 4, padding: '8px 12px' }}>
                                          <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 12, color: 'var(--text-strong)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                                            <div style={{ fontSize: 10, color: 'rgba(var(--ink-rgb),.3)', marginTop: 1 }}>{t.assigned_name || 'Não atribuída'}</div>
                                          </div>
                                          <Badge color={TASK_STATUS[t.status]?.color || '#475569'} label={TASK_STATUS[t.status]?.label || t.status} />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ─── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface-3)', borderRadius: 4, padding: 28, width: 460, maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(var(--ink-rgb),.1)', boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
                {modal.edit ? 'Editar' : modal.type === 'department' ? 'Nova' : 'Novo'} {modal.type === 'client' ? 'cliente' : modal.type === 'project' ? 'projeto' : 'área da empresa'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><IcX size={18} color="#475569" /></button>
            </div>

            {modal.type === 'client' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['nome', 'name', 'text', 'Nome do cliente *'],
                  ['contato', 'contact_name', 'text', 'Nome do contato'],
                  ['email', 'contact_email', 'email', 'E-mail do contato']].map(([, key, type, ph]) => (
                  <input key={key} type={type} placeholder={ph} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={INPUT} />
                ))}
                <select value={form.segment || 'Outros'} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} style={{ ...INPUT, background: 'var(--surface-2)' }}>
                  {SEGMENTS.slice(1).map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={form.status || 'prospect'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...INPUT, background: 'var(--surface-2)' }}>
                  {Object.entries(CLIENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <textarea placeholder="Necessidades do cliente" value={form.needs || ''} onChange={e => setForm(f => ({ ...f, needs: e.target.value }))} rows={2} style={{ ...INPUT, resize: 'vertical' }} />
                <input placeholder="Serviço contratado" value={form.service || ''} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} style={INPUT} />
                <select value={form.responsible_id || ''} onChange={e => setForm(f => ({ ...f, responsible_id: e.target.value }))} style={{ ...INPUT, background: 'var(--surface-2)' }}>
                  <option value="">Sem responsável definido</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <textarea placeholder="Anexos importantes (um por linha: ex. Contrato.pdf)" value={form.attachments || ''} onChange={e => setForm(f => ({ ...f, attachments: e.target.value }))} rows={2} style={{ ...INPUT, resize: 'vertical' }} />
              </div>
            )}

            {modal.type === 'project' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input placeholder="Nome do projeto *" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={INPUT} />
                <select value={form.client_id || ''} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={{ ...INPUT, background: 'var(--surface-2)' }}>
                  <option value="">Sem cliente vinculado</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={form.team || 'operational'} onChange={e => setForm(f => ({ ...f, team: e.target.value }))} style={{ ...INPUT, background: 'var(--surface-2)' }}>
                  {Object.entries(TEAM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={form.status || 'planning'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...INPUT, background: 'var(--surface-2)' }}>
                  {Object.entries(PROJ_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input type="date" placeholder="Início" value={form.start_date || ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={INPUT} />
                  <input type="date" placeholder="Término" value={form.end_date || ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={INPUT} />
                </div>
                <textarea placeholder="Descrição" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...INPUT, resize: 'vertical' }} />
                <div>
                  <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 6 }}>Progresso: {form.progress || 0}%</label>
                  <input type="range" min={0} max={100} value={form.progress || 0} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#3B82F6' }} />
                </div>
              </div>
            )}

            {modal.type === 'department' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input placeholder="Nome da área *" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={INPUT} />
                <textarea placeholder="Descrição da área e responsabilidades" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...INPUT, resize: 'vertical' }} />
                <select value={form.lead_id || ''} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))} style={{ ...INPUT, background: 'var(--surface-2)' }}>
                  <option value="">Sem responsável definido</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <div>
                  <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 8 }}>Cor de identificação</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {DEPT_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '2px solid #fff' : '2px solid transparent',
                        cursor: 'pointer', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {err && <div style={{ marginTop: 12, fontSize: 12, color: '#EF4444' }}>{err}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={closeModal} style={{ flex: 1, background: 'rgba(var(--ink-rgb),.05)', border: '1px solid rgba(var(--ink-rgb),.1)', borderRadius: 4, padding: '10px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button onClick={modal.type === 'client' ? saveClient : modal.type === 'project' ? saveProject : saveDepartment} disabled={saving} style={{ flex: 1, background: '#2563EB', border: 'none', borderRadius: 4, padding: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                {saving ? 'Salvando…' : modal.edit ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
