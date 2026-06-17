import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuthContext } from '../App';
import {
  IcActivity, IcTasks, IcUsers, IcAlert, IcBriefcase,
  IcClock, IcCheck, IcTrend, IcFolder, IcPieChart
} from '../components/Icons';

function KpiCard({ label, value, sub, color, Icon }) {
  return (
    <div style={{ background: 'var(--surface-3)', borderRadius: 4, padding: '18px 20px', border: '1px solid rgba(var(--ink-rgb),.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 4, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-1px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, color = '#3B82F6' }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(value, 100)}%`, background: color, height: '100%', borderRadius: 4, transition: 'width .6s ease' }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} />
    </div>
  );
}

const STATUS_COLOR = { pending: '#F59E0B', in_progress: '#3B82F6', done: '#10B981' };
const STATUS_LABEL = { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído' };
const PRIORITY_COLOR = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };
const TEAM_COLOR = { operational: '#3B82F6', administrative: '#6366F1', product: '#F59E0B', field: '#10B981' };
const TEAM_LABEL = { operational: 'Operacional', administrative: 'Administrativo', product: 'Produto', field: 'Campo' };

export default function Summary() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, done: 0 });
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [occurrences, setOccurrences] = useState([]);

  useEffect(() => {
    api.get('/tasks/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => {});
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    api.get('/clients').then(r => setClients(r.data)).catch(() => {});
    api.get('/occurrences').then(r => setOccurrences(r.data)).catch(() => {});
  }, []);

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const coordinators = users.filter(u => u.role === 'coordinator').length;
  const fieldTechs = users.filter(u => u.role === 'field').length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  const tasksByStatus = ['pending', 'in_progress', 'done'].map(s => ({
    label: STATUS_LABEL[s], value: stats[s] || 0,
    pct: stats.total > 0 ? Math.round(((stats[s] || 0) / stats.total) * 100) : 0,
    color: STATUS_COLOR[s]
  }));

  const projectsByTeam = Object.keys(TEAM_LABEL).map(t => ({
    team: t, label: TEAM_LABEL[t], color: TEAM_COLOR[t],
    count: projects.filter(p => p.team === t).length
  })).filter(x => x.count > 0);

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-strong)' }}>Resumo Geral</h1>
        <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>Visão consolidada de toda a operação</p>
      </header>

      {/* KPI row */}
      <div className="grid-kpi-5" style={{ marginBottom: 28 }}>
        <KpiCard label="Tarefas totais" value={stats.total} color="#3B82F6" Icon={IcTasks} sub={`${pct}% concluídas`} />
        <KpiCard label="Em andamento" value={stats.in_progress} color="#6366F1" Icon={IcActivity} sub="tarefas ativas" />
        <KpiCard label="Usuários" value={users.length} color="#10B981" Icon={IcUsers} sub={`${coordinators} coord. · ${fieldTechs} técnicos`} />
        <KpiCard label="Clientes" value={clients.length} color="#F59E0B" Icon={IcBriefcase} sub={`${activeClients} ativos`} />
        <KpiCard label="Projetos" value={projects.length} color="#EF4444" Icon={IcFolder} sub={`${activeProjects} em andamento`} />
      </div>

      <div className="grid-2col" style={{ gap: 20, marginBottom: 20 }}>

        {/* Task progress */}
        <section style={{ background: 'var(--surface-3)', borderRadius: 4, padding: 22, border: '1px solid rgba(var(--ink-rgb),.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>Status das tarefas</h2>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{pct}%</span>
          </div>
          <ProgressBar value={pct} color="#2563EB" />
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tasksByStatus.map(({ label, value, pct: p, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{value} <span style={{ color: '#475569', fontWeight: 400 }}>({p}%)</span></span>
                </div>
                <ProgressBar value={p} color={color} />
              </div>
            ))}
          </div>
        </section>

        {/* Team composition */}
        <section style={{ background: 'var(--surface-3)', borderRadius: 4, padding: 22, border: '1px solid rgba(var(--ink-rgb),.06)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 20 }}>Composição da equipe</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Coordenadores', value: coordinators, color: '#6366F1', desc: 'Gerenciam tarefas' },
              { label: 'Técnicos de Campo', value: fieldTechs, color: '#3B82F6', desc: 'Executam tarefas' },
            ].map(({ label, value, color, desc }) => (
              <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 4, padding: '14px 16px', border: '1px solid rgba(var(--ink-rgb),.06)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)' }}>{label}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{desc}</div>
              </div>
            ))}
          </div>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.04em' }}>Projetos por equipe</h3>
          {projectsByTeam.length === 0
            ? <p style={{ fontSize: 13, color: '#334155' }}>Nenhum projeto cadastrado ainda.</p>
            : projectsByTeam.map(({ label, count, color }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)' }}>{count}</span>
                </div>
                <ProgressBar value={projects.length > 0 ? Math.round((count / projects.length) * 100) : 0} color={color} />
              </div>
            ))
          }
        </section>
      </div>

      <div className="grid-aside" style={{ gap: 20 }}>

        {/* Recent tasks */}
        <section style={{ background: 'var(--surface-3)', borderRadius: 4, border: '1px solid rgba(var(--ink-rgb),.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(var(--ink-rgb),.06)', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>Tarefas recentes</h2>
            <span style={{ fontSize: 11, color: '#475569' }}>{tasks.length} total</span>
          </div>
          {tasks.slice(0, 6).map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: i < 5 ? '1px solid rgba(var(--ink-rgb),.04)' : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[t.status], flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{t.assigned_name || 'Não atribuída'}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: STATUS_COLOR[t.status] + '20', color: STATUS_COLOR[t.status], fontWeight: 600, flexShrink: 0 }}>{STATUS_LABEL[t.status]}</span>
              <span style={{ fontSize: 10, color: PRIORITY_COLOR[t.priority], flexShrink: 0 }}>● {t.priority}</span>
            </div>
          ))}
          {tasks.length === 0 && <p style={{ padding: '20px', color: '#475569', fontSize: 13 }}>Nenhuma tarefa ainda.</p>}
        </section>

        {/* Recent occurrences */}
        <section style={{ background: 'var(--surface-3)', borderRadius: 4, border: '1px solid rgba(var(--ink-rgb),.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(var(--ink-rgb),.06)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>Ocorrências recentes</h2>
          </div>
          {occurrences.slice(0, 5).map((o, i) => (
            <div key={o.id} style={{ padding: '11px 16px', borderBottom: i < 4 ? '1px solid rgba(var(--ink-rgb),.04)' : 'none', display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IcAlert size={13} color="#EF4444" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-strong)' }}>{o.task_title || 'Geral'}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 1, lineHeight: 1.4 }}>{o.description?.slice(0, 60)}{o.description?.length > 60 ? '…' : ''}</div>
                <div style={{ fontSize: 10, color: '#334155', marginTop: 3 }}>por {o.user_name}</div>
              </div>
            </div>
          ))}
          {occurrences.length === 0 && <p style={{ padding: '20px', color: '#475569', fontSize: 13 }}>Nenhuma ocorrência.</p>}
        </section>
      </div>
    </div>
  );
}
