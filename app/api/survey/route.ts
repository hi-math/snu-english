import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Survey } from '@/lib/db';

// 기존 설문 응답 불러오기
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get('grade') ?? '';
  const klass = searchParams.get('class') ?? '';
  const number = searchParams.get('number') ?? '';

  const row = db
    .prepare('SELECT * FROM surveys WHERE grade = ? AND class = ? AND number = ?')
    .get(grade, klass, number) as Survey | undefined;

  return NextResponse.json({ survey: row ?? null });
}

// 설문 저장 (upsert)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const grade = String(body.grade ?? '').trim();
  const klass = String(body.class ?? '').trim();
  const number = String(body.number ?? '').trim();
  const name = String(body.name ?? '').trim();

  if (!grade || !klass || !number || !name) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const q1 = String(body.q1 ?? '').trim();
  const toChoice = (v: unknown) => {
    const n = Number(v);
    return n >= 1 && n <= 4 ? n : null;
  };
  const q2 = toChoice(body.q2);
  const q3 = toChoice(body.q3);
  const q4 = toChoice(body.q4);
  const q5 = String(body.q5 ?? '');

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO surveys (grade, class, number, name, q1, q2, q3, q4, q5, created_at, updated_at)
     VALUES (@grade, @class, @number, @name, @q1, @q2, @q3, @q4, @q5, @now, @now)
     ON CONFLICT (grade, class, number)
     DO UPDATE SET name = @name, q1 = @q1, q2 = @q2, q3 = @q3, q4 = @q4, q5 = @q5, updated_at = @now`
  ).run({ grade, class: klass, number, name, q1, q2, q3, q4, q5, now });

  return NextResponse.json({ ok: true });
}
