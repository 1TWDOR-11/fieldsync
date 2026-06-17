import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuthContext } from '../App';
import { IcTasks, IcClock, IcActivity, IcAlert, IcMapPin, IcUser } from '../components/Icons';

const BLUE = '#2563EB';
const TEAL = '#0D9488';
const WARN = '#B45309';
const DNGR = '#DC2626';
const INDG = '#4F46E5';

const S_COLOR = { pending: WARN, in_progress: BLUE, done: TEAL };
const S_LABEL = { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído' };
const P_COLOR = { low: TEAL, medium: WARN, high: DNGR };
const P_LABEL = { low: 'Baixa', medium: 'Média', high: 'Alta' };

function Badge({ color, label }) {
  return <span className="badge" style={{ color, borderColor: color + '40' }}>{label}</span>;
}

/* ── Vertical bar chart ── */
function VBarChart({ data, height = 130 }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="row gap-3" style={{ alignItems: 'flex-end', height, paddingTop: 8 }}>
      {data.map(d => (
        <div key={d.label} className="col" style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>{d.value}</span>
          <div style={{
            width: '100%', maxWidth: 40,
            height: `${Math.max(4, (d.value / max) * (height - 36))}px`,
            background: d.color, borderRadius: 2,
            transition: 'height .4s ease',
          }} />
          <span className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Horizontal bar list ── */
function HBarChart({ data }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="col gap-3">
      {data.map(d => (
        <div key={d.label}>
          <div className="row-between" style={{ marginBottom: 5 }}>
            <span className="text-muted" style={{ fontSize: 12 }}>{d.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-strong)' }}>{d.value}</span>
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 2, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', background: d.color, transition: 'width .4s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Mini pie chart ── */
function PieChart({ data, size = 110 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const r = size / 2;
  const slices = data.map(d => {
    const start = (acc / total) * 2 * Math.PI - Math.PI / 2;
    acc += d.value;
    const end = (acc / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = r + r * Math.cos(start), y1 = r + r * Math.sin(start);
    const x2 = r + r * Math.cos(end), y2 = r + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return { ...d, path: `M${r},${r} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z` };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total === 0 ? <circle cx={r} cy={r} r={r} fill="var(--surface-2)" /> :
        slices.map(s => <path key={s.label} d={s.path} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} />)}
    </svg>
  );
}

function Donut({ pct, size = 64, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TEAL} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="butt" style={{ transition: 'stroke-dasharray .5s ease' }} />
    </svg>
  );
}

function KpiCard({ label, value, sub, Icon, color }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="text-muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
        <Icon size={15} color={color} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-1px' }}>{value}</div>
      <div className="text-dim" style={{ fontSize: 11, marginTop: 5 }}>{sub}</div>
    </div>
  );
}

const TEAM_LABEL = { operational: 'Operacional', administrative: 'Administrativo', product: 'Produto', field: 'Campo' };
const TEAM_COLOR = { operational: BLUE, administrative: INDG, product: WARN, field: TEAL };
const OCC_COLOR = { open: DNGR, in_progress: WARN, resolved: TEAL };
const OCC_LABEL = { open: 'Abertas', in_progress: 'Em tratamento', resolved: 'Resolvidas' };

export default function Dashboard() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, done: 0 });
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [allOccurrences, setAllOccurrences] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/tasks/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/tasks').then(r => { setAllTasks(r.data); setTasks(r.data.slice(0, 5)); }).catch(() => {});
    api.get('/occurrences').then(r => { setAllOccurrences(r.data); setOccurrences(r.data.slice(0, 4)); }).catch(() => {});
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const firstName = user?.name?.split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const priorityData = ['low', 'medium', 'high'].map(p => ({ label: P_LABEL[p], value: allTasks.filter(t => t.priority === p).length, color: P_COLOR[p] }));
  const teamData = Object.keys(TEAM_LABEL).map(t => ({ label: TEAM_LABEL[t], value: projects.filter(p => p.team === t).length, color: TEAM_COLOR[t] }));
  const occStatusData = Object.keys(OCC_LABEL).map(s => ({ label: OCC_LABEL[s], value: allOccurrences.filter(o => o.status === s).length, color: OCC_COLOR[s] }));

  return (
    <div className="col gap-4">

      <header className="row-between">
        <div>
          <p className="text-dim" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            {greet}, {firstName}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.5px' }}>Operações em Campo</h1>
        </div>
        <div className="row gap-2 card" style={{ padding: '7px 14px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL }} />
          <span className="text-muted" style={{ fontSize: 12 }}>Sistema ativo</span>
        </div>
      </header>

      <div className="grid-kpi-4">
        <KpiCard label="Total" value={stats.total} sub="todas as tarefas" Icon={IcTasks} color={BLUE} />
        <KpiCard label="Pendentes" value={stats.pending} sub="aguardando" Icon={IcClock} color={WARN} />
        <KpiCard label="Em andamento" value={stats.in_progress} sub="em execução" Icon={IcActivity} color={INDG} />

        <div className="card row gap-3" style={{ padding: '18px 20px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Donut pct={pct} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-strong)' }}>{pct}%</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="text-dim" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>Concluídas</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-1px' }}>{stats.done}</div>
            <div className="text-dim" style={{ fontSize: 11, marginTop: 4 }}>de {stats.total} tarefas</div>
          </div>
        </div>
      </div>

      <div className="grid-3col">
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 3 }}>Tarefas por prioridade</div>
          <div className="text-dim" style={{ fontSize: 11, marginBottom: 8 }}>{allTasks.length} tarefas no total</div>
          <VBarChart data={priorityData} />
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 3 }}>Projetos por equipe</div>
          <div className="text-dim" style={{ fontSize: 11, marginBottom: 14 }}>{projects.length} projetos ativos</div>
          <HBarChart data={teamData} />
        </div>

        <div className="card col" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 3 }}>Ocorrências por status</div>
          <div className="text-dim" style={{ fontSize: 11, marginBottom: 8 }}>{allOccurrences.length} ocorrências registradas</div>
          <div className="row gap-4" style={{ alignItems: 'center', flex: 1 }}>
            <PieChart data={occStatusData} />
            <div className="col gap-2">
              {occStatusData.map(d => (
                <div key={d.label} className="row gap-2" style={{ alignItems: 'center' }}>
                  <span style={{ width: 7, height: 7, background: d.color, flexShrink: 0 }} />
                  <span className="text-muted" style={{ fontSize: 11 }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-strong)', marginLeft: 'auto' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-aside-lg">

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="row-between" style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>Tarefas recentes</span>
            <span className="text-dim" style={{ fontSize: 11 }}>{tasks.length}</span>
          </div>
          {tasks.length === 0
            ? <p className="text-dim" style={{ padding: '20px 18px', fontSize: 13 }}>Nenhuma tarefa ainda.</p>
            : tasks.map((t, i) => (
              <div key={t.id} className="row gap-3" style={{ padding: '11px 18px', borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: S_COLOR[t.status], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div className="row gap-3" style={{ marginTop: 3, flexWrap: 'wrap' }}>
                    {t.assigned_name && <span className="row gap-1 text-dim" style={{ fontSize: 11, alignItems: 'center' }}><IcUser size={10} color="currentColor" />{t.assigned_name}</span>}
                    {t.location && <span className="row gap-1 text-dim" style={{ fontSize: 11, alignItems: 'center' }}><IcMapPin size={10} color="currentColor" />{t.location}</span>}
                  </div>
                </div>
                <div className="row gap-2" style={{ flexShrink: 0 }}>
                  <Badge color={P_COLOR[t.priority]} label={P_LABEL[t.priority]} />
                  <Badge color={S_COLOR[t.status]} label={S_LABEL[t.status]} />
                </div>
              </div>
            ))
          }
        </div>

        <div className="card col" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>Ocorrências</span>
          </div>
          {occurrences.length === 0
            ? <p className="text-dim" style={{ padding: '20px 18px', fontSize: 13 }}>Sem ocorrências.</p>
            : occurrences.map((o, i) => (
              <div key={o.id} className="row gap-3" style={{ padding: '11px 16px', borderBottom: i < occurrences.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <IcAlert size={14} color={DNGR} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.task_title || 'Ocorrência geral'}</div>
                  <div className="text-dim" style={{ fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>{o.description?.slice(0, 72)}{o.description?.length > 72 ? '…' : ''}</div>
                  <div className="text-dim" style={{ fontSize: 10, marginTop: 4 }}>por {o.user_name}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
