import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import {
  IcUsers, IcTasks, IcFolder, IcBriefcase, IcLayers, IcAlert,
  IcUser, IcCheck, IcSettings, IcArrowRight, IcRefresh
} from '../components/Icons';

const TYPE_ICON = { user: IcUser, task: IcTasks, occurrence: IcAlert, client: IcBriefcase };
const TYPE_COLOR = { user: '#4F46E5', task: '#2563EB', occurrence: '#DC2626', client: '#B45309' };

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/activity?limit=15'),
      api.get('/health'),
    ]).then(([o, a, h]) => {
      setOverview(o.data);
      setActivity(a.data);
      setHealth(h.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const stats = overview ? [
    { label: 'Usuários', value: overview.users, Icon: IcUsers, to: '/users' },
    { label: 'Tarefas', value: overview.tasks, Icon: IcTasks, to: '/tasks' },
    { label: 'Projetos', value: overview.projects, Icon: IcFolder, to: '/reports' },
    { label: 'Clientes', value: overview.clients, Icon: IcBriefcase, to: '/reports' },
    { label: 'Áreas', value: overview.departments, Icon: IcLayers, to: '/reports' },
    { label: 'Ocorrências abertas', value: overview.openOccurrences, Icon: IcAlert, to: '/occurrences' },
  ] : [];

  return (
    <div className="col gap-4">
      <header className="row-between">
        <div>
          <p className="text-dim" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Sistema</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.5px' }}>Administração</h1>
        </div>
        <button onClick={load} className="btn btn-sm">
          <IcRefresh size={13} color="var(--text-muted)" /> Atualizar
        </button>
      </header>

      {/* System status */}
      <div className="card row-between" style={{ padding: '14px 18px' }}>
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: health?.status === 'ok' ? '#16A34A' : '#DC2626' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>
            {health?.status === 'ok' ? 'API operacional' : 'API indisponível'}
          </span>
          {health?.version && <span className="badge">v{health.version}</span>}
        </div>
        <span className="text-dim" style={{ fontSize: 12 }}>FieldSync Backend · localhost</span>
      </div>

      {/* Overview KPIs */}
      <div className="grid-kpi-3">
        {stats.map(({ label, value, Icon, to }) => (
          <Link key={label} to={to} className="card row-between" style={{ padding: '16px 18px', textDecoration: 'none' }}>
            <div>
              <div className="text-dim" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.5px' }}>{value ?? '—'}</div>
            </div>
            <Icon size={18} color="var(--text-dim)" />
          </Link>
        ))}
      </div>

      <div className="grid-aside">

        {/* Activity feed */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="row-between" style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>Atividade recente</span>
            <span className="text-dim" style={{ fontSize: 11 }}>{activity.length} eventos</span>
          </div>
          {activity.length === 0
            ? <p className="text-dim" style={{ padding: '20px 18px', fontSize: 13 }}>{loading ? 'Carregando...' : 'Nenhuma atividade registrada.'}</p>
            : activity.map((ev, i) => {
              const Icon = TYPE_ICON[ev.type] || IcCheck;
              const color = TYPE_COLOR[ev.type] || 'var(--text-dim)';
              return (
                <div key={i} className="row gap-3" style={{ padding: '11px 18px', borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <Icon size={13} color={color} />
                  <span style={{ fontSize: 13, color: 'var(--text-strong)', flex: 1 }}>{ev.label}</span>
                  <span className="text-dim" style={{ fontSize: 11, flexShrink: 0 }}>{timeAgo(ev.created_at)}</span>
                </div>
              );
            })
          }
        </div>

        {/* Quick links */}
        <div className="card col" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 12 }}>Gestão</div>
          <div className="col gap-2">
            {[
              { label: 'Usuários e permissões', to: '/users', Icon: IcUsers },
              { label: 'Áreas da empresa', to: '/reports', Icon: IcLayers },
              { label: 'Clientes e projetos', to: '/reports', Icon: IcBriefcase },
            ].map(({ label, to, Icon }) => (
              <Link key={label} to={to} className="row-between btn" style={{ textDecoration: 'none' }}>
                <span className="row gap-2" style={{ alignItems: 'center' }}>
                  <Icon size={14} color="var(--text-muted)" />
                  {label}
                </span>
                <IcArrowRight size={12} color="var(--text-dim)" />
              </Link>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', margin: '16px 0 10px' }}>Sobre</div>
          <div className="col gap-1 text-dim" style={{ fontSize: 12, lineHeight: 1.6 }}>
            <span>FieldSync — Plataforma de gestão em campo</span>
            <span>Criado por Hannya Cavalcante</span>
          </div>
        </div>
      </div>
    </div>
  );
}
