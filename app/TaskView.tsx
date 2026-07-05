'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskContent } from '@/lib/tasks';

interface StudentSession {
  grade: string;
  class: string;
  number: string;
  name: string;
}

// **볼드** 마크업을 <strong> 으로 렌더링
function renderInline(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

// 지시 글상자 → 디자인의 체크리스트 카드로 렌더링
function Checklist({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return null;
  const [title, ...items] = lines;
  return (
    <div className="dcard">
      <p className="checklist-title">{title}</p>
      <div className="checklist">
        {items.map((line, i) => {
          const m = line.match(/^\s*(\d+)\.\s*(.*)$/);
          if (m) {
            return (
              <div className="checklist-item" key={i}>
                <span className="num">{m[1]}.</span>
                <span>{renderInline(m[2])}</span>
              </div>
            );
          }
          return (
            <div className="checklist-item" key={i}>
              <span>{renderInline(line)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

const TIME_LIMIT = 1200; // 20분 (표시용, 강제 종료 없음)

export default function TaskView({ taskId }: { taskId: number }) {
  const router = useRouter();
  const [task, setTask] = useState<TaskContent | null>(null);
  const [student, setStudent] = useState<StudentSession | null>(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [imgError, setImgError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [remaining, setRemaining] = useState(TIME_LIMIT);
  const loadedRef = useRef(false);

  // 과제 내용 불러오기
  useEffect(() => {
    setImgError(false);
    fetch(`/api/tasks?id=${taskId}`)
      .then((r) => r.json())
      .then((data) => setTask(data.task));
  }, [taskId]);

  // 세션 확인 및 기존 답안 불러오기
  useEffect(() => {
    const raw = sessionStorage.getItem('student');
    if (!raw) {
      router.replace('/');
      return;
    }
    const s: StudentSession = JSON.parse(raw);
    setStudent(s);

    fetch(
      `/api/submission?grade=${encodeURIComponent(s.grade)}&class=${encodeURIComponent(
        s.class
      )}&number=${encodeURIComponent(s.number)}&task=${taskId}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.content === 'string') setContent(data.content);
      })
      .finally(() => {
        loadedRef.current = true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // 남은 시간 타이머 (표시용)
  useEffect(() => {
    setRemaining(TIME_LIMIT);
    const t = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [taskId]);

  const save = useCallback(
    async (value: string, silent = false) => {
      if (!student) return;
      if (!silent) setStatus('saving');
      try {
        const res = await fetch('/api/submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...student, task: taskId, content: value }),
        });
        setStatus(res.ok ? 'saved' : 'error');
      } catch {
        setStatus('error');
      }
    },
    [student, taskId]
  );

  // 자동 저장 (입력 후 1.2초 debounce)
  useEffect(() => {
    if (!loadedRef.current || !student) return;
    setStatus('saving');
    const t = setTimeout(() => save(content, true).then(() => setStatus('saved')), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  function logout() {
    sessionStorage.removeItem('student');
    router.replace('/');
  }

  async function confirmSubmit() {
    setConfirmOpen(false);
    await save(content);
    if (taskId === 1) {
      router.push('/task2');
    } else {
      setDone(true);
    }
  }

  const studentLabel = student
    ? `${student.grade}학년 ${student.class}반 ${student.number}번 ${student.name}`
    : '';
  const wordCount = (content.trim().match(/\S+/g) || []).length;
  const saveText = status === 'saving' ? '저장 중…' : status === 'error' ? '저장 실패' : '저장됨';
  const low = remaining <= 120;

  // 완료 화면
  if (done) {
    return (
      <div className="done-wrap">
        <div className="done-card">
          <div className="done-check">
            <span />
          </div>
          <h1>제출이 완료되었습니다!</h1>
          <p>
            {studentLabel} 님,
            <br />
            과제에 참여해 주셔서 감사합니다.
          </p>
          <button className="done-btn" onClick={logout}>
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: 40 }} className="muted">
        불러오는 중…
      </div>
    );
  }

  // 지문(passage): 첫 줄 = 영어 주제, 나머지 = 한글 설명
  const passageLines = task.passage.split('\n');
  const topicEn = passageLines[0] || '';
  const topicKo = passageLines.slice(1).join('\n').trim();

  return (
    <div className="task-page-wrap">
      {/* 상단바 */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <div className="brand-logo">
              <span />
            </div>
            <span className="brand-text">오류중학교 글쓰기 과업 (2026년)</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-name">{studentLabel}</span>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="task-layout">
        {/* 왼쪽: 과제 안내 */}
        <div className="task-col-left">
          <div>
            <span className="task-badge">TASK {taskId}</span>
            <h2 className="task-title">{task.title}</h2>
          </div>

          {task.passage && (
            <div className="dcard">
              {topicEn && <p className="topic-en">{topicEn}</p>}
              {topicKo && <p className="topic-ko">{topicKo}</p>}
            </div>
          )}

          {task.instruction && <Checklist text={task.instruction} />}

          {task.image && !imgError && (
            <div>
              <p className="ref-note">아래 사진은 참고용입니다.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="ref-img"
                src={task.image}
                alt={task.title}
                onError={() => setImgError(true)}
              />
            </div>
          )}
        </div>

        {/* 오른쪽: 작성 패널 */}
        <div className="task-col-right-wrap">
          <div className="task-col-right">
            <div className="write-meta-top">
              <div className="write-meta">
                <span className={`wordcount${wordCount >= 40 ? ' ok' : ''}`}>
                  {wordCount} 단어 <small>/ 최소 40</small>
                </span>
                <span className="savestate">
                  <span className="dot" />
                  {saveText}
                </span>
              </div>
              <span className={`timer${low ? ' low' : ''}`}>
                <span className="dot" />
                남은 시간 {fmt(remaining)}
              </span>
            </div>
            <textarea
              className="answer-area"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="여기에 영어로 작성하세요…"
            />
          </div>
          <div className="write-actions">
            <button className="btn btn-sm" onClick={() => setConfirmOpen(true)}>
              제출하기
            </button>
          </div>
        </div>
      </div>

      {/* 제출 확인 모달 */}
      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>제출하시겠습니까?</h3>
            <p className="muted">
              {taskId === 1 ? '제출 후 과제 2로 이동합니다.' : '제출하면 응시가 완료됩니다.'}
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
                취소
              </button>
              <button className="btn" onClick={confirmSubmit}>
                제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
