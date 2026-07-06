'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface StudentSession {
  grade: string;
  class: string;
  number: string;
  name: string;
}

export default function LoginForm({
  taskId,
  onSuccess,
}: {
  taskId?: number;
  onSuccess: (student: StudentSession) => void;
}) {
  const router = useRouter();
  const [grade, setGrade] = useState('');
  const [klass, setKlass] = useState('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [classOpen, setClassOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // 이름에 admin 입력 시 관리자 페이지로 이동
    if (name.trim().toLowerCase() === 'admin') {
      router.push('/admin');
      return;
    }

    if (!grade || !klass.trim() || !number.trim() || !name.trim()) {
      setError('모든 항목을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, class: klass, number, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        setLoading(false);
        return;
      }
      onSuccess({ grade, class: klass, number, name: name.trim() });
    } catch {
      setError('서버에 연결할 수 없습니다.');
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        {/* 왼쪽: 입력 폼 */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-brand">
            <div className="brand-logo">
              <span />
            </div>
            <span className="brand-text">오류중학교 글쓰기 과업 (2026년)</span>
          </div>

          {taskId && <div className="login-task-badge">과제 {taskId}</div>}

          <div className="login-fields">
            <div className="f f-grade">
              <label htmlFor="grade">학년</label>
              <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">학년 선택</option>
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </div>
            <div className="f f-small" style={{ position: 'relative' }}>
              <label>반</label>
              <button
                type="button"
                className="f-select-btn"
                onClick={() => setClassOpen((o) => !o)}
              >
                {klass ? `${klass}반` : <span className="f-ph">반</span>}
              </button>
              {classOpen && (
                <>
                  <div className="f-pop-backdrop" onClick={() => setClassOpen(false)} />
                  <div className="f-popover">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        className={`f-pop-item${klass === String(n) ? ' active' : ''}`}
                        onClick={() => {
                          setKlass(String(n));
                          setClassOpen(false);
                        }}
                      >
                        {n}반
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="f f-small">
              <label htmlFor="number">번호</label>
              <input
                id="number"
                type="number"
                min="1"
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
            <div className="f f-name">
              <label htmlFor="name">이름</label>
              <input
                id="name"
                type="text"
                placeholder="이름 입력"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="btn login-btn" disabled={loading}>
            {loading ? '확인 중…' : '시작하기 ▶'}
          </button>
        </form>

        {/* 오른쪽: 일러스트 (글쓰기 모티프) */}
        <div className="login-illust">
          <div className="login-illust-inner">
            <svg
              className="illust-svg"
              viewBox="0 0 400 400"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* 장식용 반투명 원 */}
              <circle cx="72" cy="86" r="44" fill="rgba(255,255,255,0.13)" />
              <circle cx="332" cy="322" r="66" fill="rgba(255,255,255,0.10)" />
              <circle cx="350" cy="70" r="16" fill="rgba(255,255,255,0.18)" />

              {/* 종이 */}
              <g transform="rotate(-6 200 205)">
                <rect x="116" y="86" width="168" height="228" rx="16" fill="#ffffff" />
                <rect x="116" y="86" width="168" height="228" rx="16" fill="rgba(0,0,0,0.02)" />
                {/* 글줄 */}
                <rect x="140" y="126" width="120" height="11" rx="5.5" fill="#E7E2DC" />
                <rect x="140" y="156" width="128" height="11" rx="5.5" fill="#E7E2DC" />
                <rect x="140" y="186" width="96" height="11" rx="5.5" fill="#E7E2DC" />
                <rect x="140" y="216" width="120" height="11" rx="5.5" fill="#E7E2DC" />
                <rect x="140" y="246" width="70" height="11" rx="5.5" fill="#E7E2DC" />
              </g>

              {/* 연필 */}
              <g transform="rotate(38 286 250)">
                <rect x="276" y="150" width="20" height="150" rx="5" fill="#F4C15B" />
                <rect x="276" y="150" width="20" height="18" fill="#EE9E52" />
                <rect x="276" y="168" width="20" height="6" fill="#D98441" />
                <polygon points="276,300 296,300 286,326" fill="#F1E6D0" />
                <polygon points="282,315 290,315 286,326" fill="#3A3A3A" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
