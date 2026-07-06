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

        {/* 오른쪽: 일러스트 */}
        <div className="login-illust">
          <div className="login-illust-inner">
            <div
              style={{
                position: 'absolute',
                top: '12%',
                left: '16%',
                width: 84,
                height: 84,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%,#FFF4EE,#F0CDB6)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -44,
                left: -32,
                width: '72%',
                height: '56%',
                borderRadius: '50% 50% 0 0',
                background: '#8E4529',
                opacity: 0.92,
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -64,
                right: -42,
                width: '78%',
                height: '64%',
                borderRadius: '50% 50% 0 0',
                background: '#7A3213',
                opacity: 0.86,
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -30,
                left: '22%',
                width: '60%',
                height: '42%',
                borderRadius: '50% 50% 0 0',
                background: '#5E2810',
                opacity: 0.7,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'repeating-linear-gradient(45deg,rgba(255,255,255,0.05) 0 12px,transparent 12px 24px)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
