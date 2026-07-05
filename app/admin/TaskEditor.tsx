'use client';

import { useEffect, useRef, useState } from 'react';

interface Task {
  id: number;
  title: string;
  passage: string;
  instruction: string;
  image: string;
}

export default function TaskEditor({ taskId }: { taskId: number }) {
  const [task, setTask] = useState<Task | null>(null);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch(`/api/tasks?id=${taskId}`)
      .then((r) => r.json())
      .then((d) => setTask(d.task));
  }

  useEffect(load, [taskId]);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function upd(field: keyof Task, value: string) {
    setTask((t) => (t ? { ...t, [field]: value } : t));
  }

  async function save() {
    if (!task) return;
    setSaving(true);
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    setSaving(false);
    flash(res.ok ? '저장했습니다.' : '저장 실패');
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !task) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/tasks/image?id=${taskId}`, { method: 'POST', body: fd });
    const data = await res.json();
    if (fileRef.current) fileRef.current.value = '';
    if (!res.ok) return flash(data.error || '업로드 실패');
    upd('image', data.url);
    flash('사진을 업로드했습니다. 저장 버튼을 눌러 반영하세요.');
  }

  if (!task) return <div className="muted">불러오는 중...</div>;

  return (
    <div className="card">
      <h2>과제 {taskId} 내용</h2>
      <p className="muted">
        학생 과제 화면의 왼쪽에 표시되는 제목·지문·지시 글상자·사진을 편집합니다.
      </p>

      <div className="task-edit-field">
        <label>제목</label>
        <input value={task.title} onChange={(e) => upd('title', e.target.value)} />
      </div>

      <div className="task-edit-field">
        <label>지문 (상단, 비우면 미표시)</label>
        <textarea rows={4} value={task.passage} onChange={(e) => upd('passage', e.target.value)} />
      </div>

      <div className="task-edit-field">
        <label>지시 글상자 (지문 아래)</label>
        <textarea
          rows={12}
          value={task.instruction}
          onChange={(e) => upd('instruction', e.target.value)}
        />
        <p className="muted" style={{ fontSize: 13 }}>
          첫 줄은 가운데 정렬 제목으로 표시되고, 나머지 줄은 좌측 정렬됩니다. 굵게 표시하려면
          <span className="tag" style={{ margin: '0 4px' }}>**강조할 글자**</span>
          처럼 별표 두 개로 감싸세요.
        </p>
      </div>

      <div className="task-edit-field">
        <label>사진</label>
        <div className="toolbar" style={{ marginBottom: 6 }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadImage} />
        </div>
        <input
          value={task.image}
          onChange={(e) => upd('image', e.target.value)}
          placeholder="이미지 경로 (예: /uploads/task1.png). 비우면 사진 미표시"
        />
        {task.image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="img-preview" src={task.image} alt="미리보기" />
        )}
      </div>

      <div className="toolbar">
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </div>
  );
}
