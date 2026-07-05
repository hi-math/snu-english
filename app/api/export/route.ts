import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rowsToCsv } from '@/lib/csv';
import type { Submission } from '@/lib/db';

// 제출된 답안(데이터) CSV 다운로드 — 학년별
// 각 학생당 한 행: 과제1, 과제2 내용을 나란히 표기
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get('grade');

  const subs = (
    grade
      ? db
          .prepare('SELECT * FROM submissions WHERE grade = ?')
          .all(grade)
      : db.prepare('SELECT * FROM submissions').all()
  ) as Submission[];

  // 학생 단위로 묶기
  const byStudent = new Map<
    string,
    {
      grade: string;
      class: string;
      number: string;
      name: string;
      task1: string;
      task2: string;
      updated1: string;
      updated2: string;
    }
  >();

  for (const s of subs) {
    const key = `${s.grade}|${s.class}|${s.number}`;
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        grade: s.grade,
        class: s.class,
        number: s.number,
        name: s.name,
        task1: '',
        task2: '',
        updated1: '',
        updated2: '',
      });
    }
    const rec = byStudent.get(key)!;
    rec.name = s.name;
    if (s.task === 1) {
      rec.task1 = s.content;
      rec.updated1 = s.updated_at;
    } else if (s.task === 2) {
      rec.task2 = s.content;
      rec.updated2 = s.updated_at;
    }
  }

  const list = [...byStudent.values()].sort(
    (a, b) =>
      Number(a.class) - Number(b.class) || Number(a.number) - Number(b.number)
  );

  const csv = rowsToCsv(
    ['grade', 'class', 'number', 'name', 'task1', 'task2', 'task1_updated', 'task2_updated'],
    list.map((r) => [
      r.grade,
      r.class,
      r.number,
      r.name,
      r.task1,
      r.task2,
      r.updated1,
      r.updated2,
    ])
  );

  const filename = grade ? `submissions_grade${grade}.csv` : 'submissions_all.csv';
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
