'use client';

import { useEffect, useState } from 'react';
import LoginForm, { StudentSession } from './LoginForm';
import TaskView from './TaskView';
import Survey from './Survey';

type Screen = 'task' | 'survey' | 'done';

// 과제별 독립 활동.
// 과제 1: 로그인 → 과제 → 완료
// 과제 2: 로그인 → 과제 → 설문 → 완료
export default function Activity({ taskId }: { taskId: number }) {
  const storageKey = `student_task${taskId}`;
  const [student, setStudent] = useState<StudentSession | null>(null);
  const [screen, setScreen] = useState<Screen>('task');
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

  const themeClass = taskId === 2 ? 'theme-green' : undefined;

  function exit() {
    sessionStorage.removeItem(storageKey);
    setStudent(null);
    setScreen('task');
  }

  let inner: React.ReactNode;

  if (!student) {
    inner = (
      <LoginForm
        taskId={taskId}
        onSuccess={(s) => {
          sessionStorage.setItem(storageKey, JSON.stringify(s));
          setStudent(s);
          setScreen('task');
        }}
      />
    );
  } else if (screen === 'task') {
    inner = (
      <TaskView
        taskId={taskId}
        student={student}
        onSubmitted={() => setScreen(taskId === 2 ? 'survey' : 'done')}
      />
    );
  } else if (screen === 'survey') {
    inner = <Survey student={student} onSubmitted={() => setScreen('done')} />;
  } else {
    inner = (
      <div className="done-wrap">
        <div className="done-card">
          <div className="done-check">
            <span />
          </div>
          <h1>제출이 완료되었습니다!</h1>
          <p>
            {student.grade}학년 {student.class}반 {student.number}번 {student.name} 님,
            <br />
            {taskId === 2
              ? '과제와 설문에 참여해 주셔서 감사합니다.'
              : `과제 ${taskId}에 참여해 주셔서 감사합니다.`}
          </p>
          <button className="done-btn" onClick={exit}>
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return <div className={themeClass}>{inner}</div>;
}
