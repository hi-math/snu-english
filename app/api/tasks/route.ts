import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { TaskContent } from '@/lib/tasks';

// 과제 내용 조회 (id 지정 시 단일, 없으면 전체)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(id)) as
      | TaskContent
      | undefined;
    return NextResponse.json({ task: row ?? null });
  }

  const rows = db.prepare('SELECT * FROM tasks ORDER BY id').all() as TaskContent[];
  return NextResponse.json({ tasks: rows });
}

// 과제 내용 수정
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (id !== 1 && id !== 2) {
    return NextResponse.json({ error: '잘못된 과제 번호입니다.' }, { status: 400 });
  }
  const title = String(body.title ?? '').trim() || `과제 ${id}`;
  const passage = String(body.passage ?? '');
  const instruction = String(body.instruction ?? '');
  const image = String(body.image ?? '').trim();

  db.prepare(
    'UPDATE tasks SET title = ?, passage = ?, instruction = ?, image = ? WHERE id = ?'
  ).run(title, passage, instruction, image, id);

  return NextResponse.json({ ok: true });
}
