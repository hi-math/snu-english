import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Submission, Survey } from '@/lib/db';

// 관리자 페이지용: 제출 답안 목록 (grade 필터 선택)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get('grade');

  const subs = (
    grade
      ? db
          .prepare(
            'SELECT * FROM submissions WHERE grade = ? ORDER BY CAST(class AS INTEGER), CAST(number AS INTEGER), task'
          )
          .all(grade)
      : db
          .prepare(
            'SELECT * FROM submissions ORDER BY CAST(grade AS INTEGER), CAST(class AS INTEGER), CAST(number AS INTEGER), task'
          )
          .all()
  ) as Submission[];

  // 학년 목록도 함께 제공
  const grades = (
    db.prepare('SELECT DISTINCT grade FROM students UNION SELECT DISTINCT grade FROM submissions').all() as {
      grade: string;
    }[]
  )
    .map((g) => g.grade)
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b));

  const surveys = (
    grade
      ? db.prepare('SELECT * FROM surveys WHERE grade = ?').all(grade)
      : db.prepare('SELECT * FROM surveys').all()
  ) as Survey[];

  return NextResponse.json({ submissions: subs, surveys, grades });
}

// 제출 답안 삭제
// - grade+class+number: 해당 학생의 답안(과제 1·2) 삭제
// - grade 만: 해당 학년 전체 삭제
// - 아무 것도 없으면: 전체 삭제
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get('grade');
  const klass = searchParams.get('class');
  const number = searchParams.get('number');

  let info;
  if (grade && klass && number) {
    info = db
      .prepare('DELETE FROM submissions WHERE grade = ? AND class = ? AND number = ?')
      .run(grade, klass, number);
    db.prepare('DELETE FROM surveys WHERE grade = ? AND class = ? AND number = ?').run(
      grade,
      klass,
      number
    );
  } else if (grade) {
    info = db.prepare('DELETE FROM submissions WHERE grade = ?').run(grade);
    db.prepare('DELETE FROM surveys WHERE grade = ?').run(grade);
  } else {
    info = db.prepare('DELETE FROM submissions').run();
    db.prepare('DELETE FROM surveys').run();
  }

  return NextResponse.json({ ok: true, deleted: info.changes });
}
