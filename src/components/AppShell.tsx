import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type Nav = 'child' | 'parent' | 'none';

interface Props {
  children: ReactNode;
  nav?: Nav;
  flush?: boolean;
}

const CHILD_TABS = [
  { to: '/home', em: '🏠', label: '홈' },
  { to: '/plan', em: '🎯', label: '오늘 계획' },
  { to: '/parent', em: '👪', label: '부모' },
];

const PARENT_TABS = [
  { to: '/parent', em: '🏠', label: '요약' },
  { to: '/parent/report', em: '📊', label: '리포트' },
  { to: '/parent/plan', em: '🎯', label: '학습량' },
  { to: '/parent/levels', em: '⚙️', label: '수준' },
];

export default function AppShell({ children, nav = 'none', flush = false }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tabs = nav === 'child' ? CHILD_TABS : nav === 'parent' ? PARENT_TABS : [];

  return (
    <div className="shell">
      <div className={`shell__body${flush ? ' shell__body--flush' : ''}`}>{children}</div>
      {tabs.length > 0 && (
        <nav className="tabbar">
          {tabs.map((t) => {
            const active = pathname === t.to;
            return (
              <button
                key={t.to}
                className={`tabbar__item${active ? ' active' : ''}${
                  nav === 'parent' ? ' parent' : ''
                }`}
                onClick={() => navigate(t.to)}
                aria-current={active ? 'page' : undefined}
              >
                <span className="em" aria-hidden="true">
                  {t.em}
                </span>
                {t.label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
