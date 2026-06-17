import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../App';
import { useTheme } from '../ThemeContext';
import Logo from '../Logo';
import { IcGrid, IcTasks, IcAlert, IcUsers, IcSummary, IcReports, IcLogOut, IcSun, IcMoon, IcSettings } from './Icons';

const NAV = [
  { to: '/', label: 'Dashboard', Icon: IcGrid, end: true },
  { to: '/summary', label: 'Resumo', Icon: IcSummary },
  { to: '/tasks', label: 'Tarefas', Icon: IcTasks },
  { to: '/occurrences', label: 'Ocorrências', Icon: IcAlert },
  { to: '/reports', label: 'Relatórios', Icon: IcReports },
  { to: '/users', label: 'Usuários', Icon: IcUsers, coordOnly: true },
  { to: '/admin', label: 'Administração', Icon: IcSettings, coordOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isCoord = user?.role === 'coordinator';

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '100vh' }}>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Logo size={17} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.2px', lineHeight: 1, color: '#fff' }}>FieldSync</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.32)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>Operations</div>
          </div>
        </div>

        <div className="sidebar-userchip">
          <NavLink to="/profile" title="Ver meu perfil" style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1, textDecoration: 'none' }}>
            <div className="sidebar-avatar" style={{ background: isCoord ? '#4F46E5' : '#0D9488' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#EDEEF0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, marginTop: 1, color: 'rgba(255,255,255,.45)' }}>
                {isCoord ? 'Coordenador' : 'Técnico de Campo'}
              </div>
            </div>
          </NavLink>
          <button
            className="sidebar-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <IcSun size={12} color="#F59E0B" /> : <IcMoon size={12} color="#93C5FD" />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Menu</div>
          {NAV.filter(({ coordOnly }) => !coordOnly || isCoord).map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              {({ isActive }) => (
                <>
                  <Icon size={15} color={isActive ? '#fff' : 'rgba(255,255,255,.4)'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 12 }}>
          <button className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }}>
            <IcLogOut size={13} color="currentColor" />
            Sair da conta
          </button>
        </div>

        <div className="sidebar-footer">
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>
            Criado por: <span style={{ color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>Hannya Cavalcante</span>
          </span>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', minWidth: 0 }} id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
