'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentModal, { StudentInput } from './StudentModal';
import TaskEditor from './TaskEditor';

interface Student {
  id: number;
  grade: string;
  class: string;
  number: string;
  name: string;
}
interface Submission {
  id: number;
  grade: string;
  class: string;
  number: string;
  name: string;
  task: number;
  content: string;
  updated_at: string;
}

type Menu = 'roster' | 'task1' | 'task2' | 'data';

const MENUS: { key: Menu; label: string }[] = [
  { key: 'roster', label: '학생 명단 관리' },
  { key: 'task1', label: '과제 1 관리' },
  { key: 'task2', label: '과제 2 관리' },
  { key: 'data', label: '학생 데이터' },
];

export default function AdminPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<Menu>('roster');

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">영어 쓰기 관리자</div>
        <nav className="sidebar-nav">
          {MENUS.map((m) => (
            <button
              key={m.key}
              className={menu === m.key ? 'active' : ''}
              onClick={() => setMenu(m.key)}
            >
              {m.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button onClick={() => router.push('/')}>로그인 화면으로</button>
        </div>
      </aside>

      <main className="admin-main">
        {menu === 'roster' && <RosterPanel />}
        {menu === 'task1' && <TaskEditor taskId={1} />}
        {menu === 'task2' && <TaskEditor taskId={2} />}
        {menu === 'data' && <DataPanel />}
      </main>
    </div>
  );
}

/* ===================== 학생 명단 관리 ===================== */
function RosterPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grade, setGrade] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; initial?: StudentInput } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const q = grade ? `?grade=${encodeURIComponent(grade)}` : '';
    const res = await fetch(`/api/students${q}`);
    const data = await res.json();
    setStudents(data.students ?? []);
    // 학년 목록
    const all = await (await fetch('/api/students')).json();
    const gs = [...new Set((all.students as Student[]).map((s) => s.grade))].sort(
      (a, b) => Number(a) - Number(b)
    );
    setGrades(gs);
  }, [grade]);

  useEffect(() => {
    load();
  }, [load]);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function del(id: number) {
    if (!confirm('이 학생을 삭제할까요?')) return;
    await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
    flash('삭제했습니다.');
    load();
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !confirm('CSV 업로드 시 기존 명단이 모두 삭제되고 새 파일로 대체됩니다. 계속할까요?')
    ) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    const text = await file.text();
    const res = await fetch('/api/students/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: text,
    });
    const data = await res.json();
    if (fileRef.current) fileRef.current.value = '';
    if (!res.ok) return flash(data.error || '업로드 실패');
    flash(`${data.count}명으로 대체되었습니다.`);
    load();
  }

  return (
    <>
      <div className="admin-header">
        <h1>학생 명단 관리</h1>
        <button className="btn" onClick={() => setModal({ mode: 'add' })}>
          + 학생 추가
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <label className="muted">학년</label>
          <select className="inline-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">전체</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}학년
              </option>
            ))}
          </select>
          <div className="spacer" />
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            CSV 업로드(대체)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={upload}
            style={{ display: 'none' }}
          />
          <a className="btn btn-secondary" href={`/api/students/export${grade ? `?grade=${grade}` : ''}`}>
            CSV 다운로드
          </a>
        </div>
        {msg && <p style={{ color: 'var(--primary-dark)' }}>{msg}</p>}
        <p className="muted" style={{ fontSize: 13 }}>
          CSV 형식: <span className="tag">grade,class,number,name</span> (한글 헤더 학년,반,번호,이름 도 가능)
        </p>

        <table className="compact-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>학년</th>
              <th style={{ width: 50 }}>반</th>
              <th style={{ width: 60 }}>번호</th>
              <th>이름</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.grade}</td>
                <td>{s.class}</td>
                <td>{s.number}</td>
                <td>{s.name}</td>
                <td className="actions">
                  <button
                    className="icon-btn"
                    onClick={() => setModal({ mode: 'edit', initial: s })}
                  >
                    수정
                  </button>
                  <button className="icon-btn danger" onClick={() => del(s.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 20 }}>
                  등록된 학생이 없습니다. "+ 학생 추가" 또는 CSV 업로드로 등록하세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <StudentModal
          title={modal.mode === 'add' ? '학생 추가' : '학생 수정'}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={() => {
            flash('저장했습니다.');
            load();
          }}
        />
      )}
    </>
  );
}

/* ===================== 학생 데이터 ===================== */
function DataPanel() {
  const [grade, setGrade] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const load = useCallback(async () => {
    const q = grade ? `?grade=${encodeURIComponent(grade)}` : '';
    const res = await fetch(`/api/submissions${q}`);
    const data = await res.json();
    setSubmissions(data.submissions ?? []);
    setGrades(data.grades ?? []);
  }, [grade]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteOne(s: Submission) {
    if (
      !confirm(
        `${s.grade}학년 ${s.class}반 ${s.number}번 ${s.name} 학생의 데이터(과제 1·2)를 삭제할까요? 되돌릴 수 없습니다.`
      )
    )
      return;
    const params = new URLSearchParams({ grade: s.grade, class: s.class, number: s.number });
    await fetch(`/api/submissions?${params.toString()}`, { method: 'DELETE' });
    load();
  }

  async function deleteAll() {
    const scope = grade ? `${grade}학년 전체` : '전체';
    if (!confirm(`${scope} 학생 데이터를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    if (!confirm('정말로 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) return;
    const q = grade ? `?grade=${encodeURIComponent(grade)}` : '';
    await fetch(`/api/submissions${q}`, { method: 'DELETE' });
    load();
  }

  const grouped = (() => {
    const map = new Map<string, { s: Submission; task1: string; task2: string }>();
    for (const sub of submissions) {
      const key = `${sub.grade}|${sub.class}|${sub.number}`;
      if (!map.has(key)) map.set(key, { s: sub, task1: '', task2: '' });
      const rec = map.get(key)!;
      rec.s = { ...rec.s, name: sub.name };
      if (sub.task === 1) rec.task1 = sub.content;
      if (sub.task === 2) rec.task2 = sub.content;
    }
    return [...map.values()].sort(
      (a, b) => Number(a.s.class) - Number(b.s.class) || Number(a.s.number) - Number(b.s.number)
    );
  })();

  return (
    <>
      <div className="admin-header">
        <h1>학생 데이터</h1>
        <a className="btn" href={`/api/export${grade ? `?grade=${grade}` : ''}`}>
          데이터 CSV 다운로드
        </a>
      </div>

      <div className="card">
        <div className="toolbar">
          <label className="muted">학년</label>
          <select className="inline-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">전체</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}학년
              </option>
            ))}
          </select>
          <div className="spacer" />
          <button
            className="btn btn-danger"
            onClick={deleteAll}
            disabled={grouped.length === 0}
          >
            {grade ? `${grade}학년 데이터 삭제` : '전체 데이터 삭제'}
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: 55 }}>학년</th>
              <th style={{ width: 45 }}>반</th>
              <th style={{ width: 55 }}>번호</th>
              <th style={{ width: 90 }}>이름</th>
              <th>과제 1</th>
              <th>과제 2</th>
              <th style={{ width: 70 }}></th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((r) => (
              <tr key={`${r.s.grade}-${r.s.class}-${r.s.number}`}>
                <td>{r.s.grade}</td>
                <td>{r.s.class}</td>
                <td>{r.s.number}</td>
                <td>{r.s.name}</td>
                <td className="cell-content">{r.task1 || <span className="muted">-</span>}</td>
                <td className="cell-content">{r.task2 || <span className="muted">-</span>}</td>
                <td className="actions">
                  <button className="icon-btn danger" onClick={() => deleteOne(r.s)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {grouped.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 20 }}>
                  아직 제출된 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
