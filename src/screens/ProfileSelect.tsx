import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AppShell from '../components/AppShell';
import { LEVELS, defaultLevelForAge } from '../lib/levels';

const AVATARS = ['🦊', '🐢', '🐰', '🐼', '🦁', '🐧', '🐨', '🦕', '🐳', '🦉'];

export default function ProfileSelect() {
  const { children, selectChild, addChild } = useApp();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(children.length === 0);
  const [name, setName] = useState('');
  const [age, setAge] = useState(6);
  const [avatar, setAvatar] = useState(AVATARS[0]);

  function pick(id: string) {
    selectChild(id);
    navigate('/home');
  }

  function create() {
    addChild(name, age, avatar);
    navigate('/home');
  }

  return (
    <AppShell nav="none">
      <div className="center" style={{ margin: '18px 0 20px' }}>
        <div style={{ fontSize: 40 }}>🎒</div>
        <h1 className="page-title" style={{ marginTop: 8 }}>초등준비 도우미</h1>
        <p className="page-sub">누구의 차례인가요?</p>
      </div>

      {!adding ? (
        <div className="profile-grid">
          {children.map((c) => (
            <button key={c.profile.id} className="profile-card" onClick={() => pick(c.profile.id)}>
              <div className="face">{c.profile.avatarEmoji}</div>
              <div className="nm">{c.profile.name}</div>
              <div className="page-sub">
                {c.profile.age}살 · {LEVELS[defaultLevelForAge(c.profile.age)].short}
              </div>
            </button>
          ))}
          <button className="profile-card profile-card--add" onClick={() => setAdding(true)}>
            <div style={{ fontSize: 26 }}>＋</div>
            <div style={{ fontWeight: 800, fontSize: 13, marginTop: 2 }}>새 프로필 만들기</div>
          </button>
        </div>
      ) : (
        <div className="stack">
          <div className="field">
            <label htmlFor="nm">이름</label>
            <input
              id="nm"
              value={name}
              placeholder="아이 이름"
              maxLength={10}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>나이</label>
            <div className="stepper">
              <button onClick={() => setAge((a) => Math.max(4, a - 1))} aria-label="나이 줄이기">
                −
              </button>
              <span className="v">{age}살</span>
              <button onClick={() => setAge((a) => Math.min(8, a + 1))} aria-label="나이 늘리기">
                ＋
              </button>
            </div>
            <p className="page-sub center">추천 시작 수준: {LEVELS[defaultLevelForAge(age)].name}</p>
          </div>

          <div className="field">
            <label>아바타</label>
            <div className="avatar-picker">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  className={`avatar-opt${avatar === a ? ' avatar-opt--sel' : ''}`}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn--block btn--lg" onClick={create}>
            시작하기 →
          </button>
          {children.length > 0 && (
            <button className="back-btn" onClick={() => setAdding(false)}>
              ← 프로필 목록으로
            </button>
          )}
        </div>
      )}
    </AppShell>
  );
}
