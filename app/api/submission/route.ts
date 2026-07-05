import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 기존 답안 불러오기
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get('grade') ?? '';
  const klass = searchParams.get('class') ?? '';
  const number = searchParams.get('number') ?? '';
  const task = Number(searchParams.get('task') ?? '0');

  const row = db
    .prepare(
      'SELECT content FROM submissions WHERE grade = ? AND class = ? AND number = ? AND task = ?'
    )
    .get(grade, klass, number, task) as { content: string } | undefined;

  return NextResponse.json({ content: row?.content ?? '' });
}

// 답안 저장 (upsert)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const grade = String(body.grade ?? '').trim();
  const klass = String(body.class ?? '').trim();
  const number = String(body.number ?? '').trim();
  const name = String(body.name ?? '').trim();
  const task = Number(body.task ?? 0);
  const content = String(body.content ?? '');

  if (!grade || !klass || !number || !name || (task !== 1 && task !== 2)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO submissions (grade, class, number, name, task, content, created_at, updated_at)
     VALUES (@grade, @class, @number, @name, @task, @content, @now, @now)
     ON CONFLICT (grade, class, number, task)
     DO UPDATE SET content = @content, name = @name, updated_at = @now`
  ).run({ grade, class: klass, number, name, task, content, now });

  return NextResponse.json({ ok: true });
}
