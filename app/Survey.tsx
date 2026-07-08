'use client';

import { useEffect, useState } from 'react';
import { SURVEY_QUESTIONS } from '@/lib/survey';
import type { StudentSession } from './LoginForm';

interface Answers {
  q1: string;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  q5: string;
}

export default function Survey({
  student,
  onSubmitted,
}: {
  student: StudentSession;
  onSubmitted: () => void;
}) {
  const [ans, setAns] = useState<Answers>({ q1: '', q2: null, q3: null, q4: null, q5: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 기존 응답 불러오기 (재접속 시)
  useEffect(() => {
    fetch(
      `/api/survey?grade=${encodeURIComponent(student.grade)}&class=${encodeURIComponent(
        student.class
      )}&number=${encodeURIComponent(student.number)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.survey) {
          const s = data.survey;
          setAns({
            q1: s.q1 ?? '',
            q2: s.q2 ?? null,
            q3: s.q3 ?? null,
            q4: s.q4 ?? null,
            q5: s.q5 ?? '',
          });
        }
      });
  }, [student]);

  function setChoice(key: 'q2' | 'q3' | 'q4', v: number) {
    setAns((a) => ({ ...a, [key]: v }));
  }

  function validate(): string {
    if (ans.q1.trim() === '' || isNaN(Number(ans.q1))) return '1번(거주 개월)을 숫자로 입력해 주세요.';
    if (!ans.q2) return '2번 문항을 선택해 주세요.';
    if (!ans.q3) return '3번 문항을 선택해 주세요.';
    if (!ans.q4) return '4번 문항을 선택해 주세요.';
    return '';
  }

  function openConfirm() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError('');
    setConfirmOpen(true);
  }

  async function submit() {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...student, ...ans }),
      });
      if (!res.ok) {
        setSaving(false);
        setError('저장에 실패했습니다. 다시 시도해 주세요.');
        return;
      }
      onSubmitted();
    } catch {
      setSaving(false);
      setError('서버에 연결할 수 없습니다.');
    }
  }

  return (
    <div className="survey-page">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <div className="brand-logo">
              <span />
            </div>
            <span className="brand-text">오류중학교 글쓰기 과업 (2026년)</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-name">
              {student.grade}학년 {student.class}반 {student.number}번 {student.name}
            </span>
          </div>
        </div>
      </div>

      <div className="survey-body">
        <span className="task-badge" style={{ marginBottom: 18 }}>
          SURVEY · 설문
        </span>

        {SURVEY_QUESTIONS.map((q, i) => (
          <div className="dcard survey-q" key={q.key}>
            <p className="survey-label">
              <span className="survey-num">{i + 1}.</span> {q.label}
            </p>

            {q.type === 'number' && (
              <div className="survey-number">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={ans.q1}
                  onChange={(e) => setAns((a) => ({ ...a, q1: e.target.value }))}
                  placeholder="0"
                />
                <span className="muted">{q.suffix}</span>
              </div>
            )}

            {q.type === 'choice' && (
              <div className="survey-choices">
                {q.options.map((opt, idx) => {
                  const val = idx + 1;
                  const selected = ans[q.key] === val;
                  return (
                    <button
                      type="button"
                      key={val}
                      className={`survey-choice${selected ? ' active' : ''}`}
                      onClick={() => setChoice(q.key, val)}
                    >
                      <span className="survey-choice-mark">{val}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === 'text' && (
              <textarea
                className="survey-text"
                value={ans.q5}
                onChange={(e) => setAns((a) => ({ ...a, q5: e.target.value }))}
                placeholder="자유롭게 작성해 주세요… (선택)"
              />
            )}
          </div>
        ))}

        {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="write-actions" style={{ paddingBottom: 40 }}>
          <button className="btn" onClick={openConfirm} disabled={saving}>
            {saving ? '제출 중…' : '설문 제출'}
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>설문을 제출하시겠습니까?</h3>
            <p className="muted">제출하면 모든 과정이 완료됩니다.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
                취소
              </button>
              <button className="btn" onClick={submit}>
                제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
