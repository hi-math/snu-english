import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const grade = String(body.grade ?? '').trim();
  const klass = String(body.class ?? '').trim();
  const number = String(body.number ?? '').trim();
  const name = String(body.name ?? '').trim();

  if (!grade || !klass || !number || !name) {
    return NextResponse.json({ error: '모든 항목을 입력해 주세요.' }, { status: 400 });
  }

  const student = db
    .prepare(
      'SELECT * FROM students WHERE grade = ? AND class = ? AND number = ? AND name = ?'
    )
    .get(grade, klass, number, name);

  if (!student) {
    return NextResponse.json(
      { error: '등록된 학생 정보와 일치하지 않습니다. 학년/반/번호/이름을 확인하세요.' },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
