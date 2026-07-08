import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rowsToCsv } from '@/lib/csv';
import type { Submission, Survey } from '@/lib/db';
import { SURVEY_QUESTIONS } from '@/lib/survey';

// 설문 선택형(q2/q3/q4) 값(1-4) → 라벨
function choiceLabel(key: 'q2' | 'q3' | 'q4', value: number | null): string {
  if (!value) return '';
  const q = SURVEY_QUESTIONS.find((x) => x.key === key);
  if (q && q.type === 'choice') {
    return `${value}. ${q.options[value - 1] ?? ''}`;
  }
  return String(value);
}

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

  // 설문 데이터 불러와 학생 키로 매핑
  const surveys = (
    grade
      ? db.prepare('SELECT * FROM surveys WHERE grade = ?').all(grade)
      : db.prepare('SELECT * FROM surveys').all()
  ) as Survey[];
  const surveyByStudent = new Map<string, Survey>();
  for (const sv of surveys) {
    const key = `${sv.grade}|${sv.class}|${sv.number}`;
    surveyByStudent.set(key, sv);
    // 설문만 있고 제출 답안이 없는 학생도 누락되지 않도록 추가
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        grade: sv.grade,
        class: sv.class,
        number: sv.number,
        name: sv.name,
        task1: '',
        task2: '',
        updated1: '',
        updated2: '',
      });
    }
  }

  const list = [...byStudent.values()].sort(
    (a, b) =>
      Number(a.class) - Number(b.class) || Number(a.number) - Number(b.number)
  );

  const csv = rowsToCsv(
    [
      'grade',
      'class',
      'number',
      'name',
      'task1',
      'task2',
      'task1_updated',
      'task2_updated',
      '설문_영어권거주개월',
      '설문_영어학습기간',
      '설문_주당공부시간',
      '설문_영작경험',
      '설문_어려웠던점',
    ],
    list.map((r) => {
      const sv = surveyByStudent.get(`${r.grade}|${r.class}|${r.number}`);
      return [
        r.grade,
        r.class,
        r.number,
        r.name,
        r.task1,
        r.task2,
        r.updated1,
        r.updated2,
        sv?.q1 ?? '',
        choiceLabel('q2', sv?.q2 ?? null),
        choiceLabel('q3', sv?.q3 ?? null),
        choiceLabel('q4', sv?.q4 ?? null),
        sv?.q5 ?? '',
      ];
    })
  );

  const filename = grade ? `submissions_grade${grade}.csv` : 'submissions_all.csv';
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
