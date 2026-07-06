'use client';

import { useEffect, useState } from 'react';
import LoginForm, { StudentSession } from './LoginForm';
import TaskView from './TaskView';

// 과제별 독립 활동: 로그인 → 해당 과제 → 제출 → 완료.
// 세션은 과제별로 분리 저장하여 과제 1/2가 서로 독립적으로 동작한다.
export default function Activity({ taskId }: { taskId: number }) {
  const storageKey = `student_task${taskId}`;
  const [student, setStudent] = useState<StudentSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      try {
        setStudent(JSON.parse(raw));
      } catch {
        setStudent(null);
      }
    }
    setReady(true);
  }, [storageKey]);

  if (!ready) return null;

  // 과제 2는 다크그린 테마
  const themeClass = taskId === 2 ? 'theme-green' : undefined;

  const inner = !student ? (
    <LoginForm
      taskId={taskId}
      onSuccess={(s) => {
        sessionStorage.setItem(storageKey, JSON.stringify(s));
        setStudent(s);
      }}
    />
  ) : (
    <TaskView
      taskId={taskId}
      student={student}
      onExit={() => {
        sessionStorage.removeItem(storageKey);
        setStudent(null);
      }}
    />
  );

  return <div className={themeClass}>{inner}</div>;
}
