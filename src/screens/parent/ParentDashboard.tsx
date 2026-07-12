import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import AppShell from '../../components/AppShell';
import { metRate, streak } from '../../lib/dailyPlan';

export default function ParentDashboard() {
  const { activeChild, children, selectChild } = useApp();
  const navigate = useNavigate();

  if (!activeChild) return <Navigate to="/profiles" replace />;

  const stars = Object.values(activeChild.progress.starsByArea).reduce((a, b) => a + b, 0);
  const completed = activeChild.progress.completedActivityIds.length;
  const s = streak(activeChild.logs);
  const week = metRate(activeChild.logs, 7);

  const links = [
    { to: '/parent/report', em: '📊', label: '진도 리포트', desc: '영역별 도달 수준·다음 단계' },
    { to: '/parent/plan', em: '🎯', label: '학습량·자기주도', desc: '하루 목표·자기주도 단계' },
    { to: '/parent/levels', em: '⚙️', label: '수준 설정', desc: '영역별 준비/기본/도전' },
  ];

  return (
    <AppShell nav="parent">
      <div className="row" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="page-title">부모 화면</h1>
          <p className="page-sub">
            {activeChild.profile.avatarEmoji} {activeChild.profile.name} · 만 {activeChild.profile.age}세
          </p>
        </div>
        <button className="avatar-badge" onClick={() => navigate('/home')} aria-label="아이 화면">
          🧒
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 8 }}>
        <div className="stat">
          <b>{completed}</b>
          <span>완료 활동</span>
        </div>
        <div className="stat">
          <b style={{ color: 'var(--sun)' }}>{stars}</b>
          <span>모은 별</span>
        </div>
        <div className="stat">
          <b>
            {s}
            <span style={{ fontSize: 13 }}>일</span>
          </b>
          <span>연속 참여</span>
        </div>
      </div>
      <p className="page-sub" style={{ marginBottom: 16 }}>
        최근 7일 중 {week.met}일 목표 달성
      </p>

      <div className="stack">
        {links.map((l) => (
          <button
            key={l.to}
            className="quest"
            onClick={() => navigate(l.to)}
            style={{ borderColor: 'var(--hair)' }}
          >
            <span className="quest__icon" style={{ background: 'rgba(154,109,224,.16)' }}>
              {l.em}
            </span>
            <span className="quest__text">
              <b>{l.label}</b>
              <span>{l.desc}</span>
            </span>
            <span className="qbadge qbadge--wait">›</span>
          </button>
        ))}
      </div>

      <p className="section-label muted" style={{ marginTop: 20 }}>
        프로필 전환
      </p>
      <div className="profile-grid">
        {children.map((c) => (
          <button
            key={c.profile.id}
            className="profile-card"
            style={c.profile.id === activeChild.profile.id ? { borderColor: 'var(--grape)' } : undefined}
            onClick={() => selectChild(c.profile.id)}
          >
            <div className="face">{c.profile.avatarEmoji}</div>
            <div className="nm">{c.profile.name}</div>
            <div className="page-sub">{c.profile.age}살</div>
          </button>
        ))}
        <button className="profile-card profile-card--add" onClick={() => navigate('/profiles')}>
          <div style={{ fontSize: 22 }}>＋</div>
          <div style={{ fontWeight: 800, fontSize: 12, marginTop: 2 }}>프로필 관리</div>
        </button>
      </div>
    </AppShell>
  );
}
