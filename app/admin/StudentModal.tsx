'use client';

import { useState } from 'react';

export interface StudentInput {
  id?: number;
  grade: string;
  class: string;
  number: string;
  name: string;
}

export default function StudentModal({
  initial,
  title,
  onClose,
  onSaved,
}: {
  initial?: StudentInput;
  title: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StudentInput>(
    initial ?? { grade: '', class: '', number: '', name: '' }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.grade || !form.class || !form.number || !form.name.trim()) {
      setError('모든 항목을 입력하세요.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/students', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || '저장 실패');
      return;
    }
    onSaved();
    onClose();
  }

  function upd(field: keyof StudentInput, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{title}</h3>
        <div className="row-2">
          <div className="field">
            <label>학년</label>
            <input value={form.grade} onChange={(e) => upd('grade', e.target.value)} inputMode="numeric" />
          </div>
          <div className="field">
            <label>반</label>
            <input value={form.class} onChange={(e) => upd('class', e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <div className="field">
          <label>번호</label>
          <input value={form.number} onChange={(e) => upd('number', e.target.value)} inputMode="numeric" />
        </div>
        <div className="field">
          <label>이름</label>
          <input value={form.name} onChange={(e) => upd('name', e.target.value)} />
        </div>
        {error && <div className="error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button className="btn" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
