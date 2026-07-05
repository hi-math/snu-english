import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rowsToCsv } from '@/lib/csv';
import type { Student } from '@/lib/db';

// 학생 명단 CSV 다운로드 (grade 필터 선택)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get('grade');

  const students = (
    grade
      ? db
          .prepare(
            'SELECT * FROM students WHERE grade = ? ORDER BY CAST(class AS INTEGER), CAST(number AS INTEGER)'
          )
          .all(grade)
      : db
          .prepare(
            'SELECT * FROM students ORDER BY CAST(grade AS INTEGER), CAST(class AS INTEGER), CAST(number AS INTEGER)'
          )
          .all()
  ) as Student[];

  const csv = rowsToCsv(
    ['grade', 'class', 'number', 'name'],
    students.map((s) => [s.grade, s.class, s.number, s.name])
  );

  const filename = grade ? `students_grade${grade}.csv` : 'students_all.csv';
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
