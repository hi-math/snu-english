import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Submission } from '@/lib/db';

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

  return NextResponse.json({ submissions: subs, grades });
}
