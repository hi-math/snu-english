import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 학생 명단 조회 (grade 필터 선택)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get('grade');

  const rows = grade
    ? db
        .prepare(
          'SELECT * FROM students WHERE grade = ? ORDER BY CAST(class AS INTEGER), CAST(number AS INTEGER)'
        )
        .all(grade)
    : db
        .prepare(
          'SELECT * FROM students ORDER BY CAST(grade AS INTEGER), CAST(class AS INTEGER), CAST(number AS INTEGER)'
        )
        .all();

  return NextResponse.json({ students: rows });
}

// 학생 추가
export async function POST(req: NextRequest) {
  const body = await req.json();
  const grade = String(body.grade ?? '').trim();
  const klass = String(body.class ?? '').trim();
  const number = String(body.number ?? '').trim();
  const name = String(body.name ?? '').trim();

  if (!grade || !klass || !number || !name) {
    return NextResponse.json({ error: '모든 항목을 입력해 주세요.' }, { status: 400 });
  }

  try {
    const info = db
      .prepare('INSERT INTO students (grade, class, number, name) VALUES (?, ?, ?, ?)')
      .run(grade, klass, number, name);
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch {
    return NextResponse.json(
      { error: '이미 존재하는 학년/반/번호 입니다.' },
      { status: 409 }
    );
  }
}

// 학생 수정
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  const grade = String(body.grade ?? '').trim();
  const klass = String(body.class ?? '').trim();
  const number = String(body.number ?? '').trim();
  const name = String(body.name ?? '').trim();

  if (!id || !grade || !klass || !number || !name) {
    return NextResponse.json({ error: '모든 항목을 입력해 주세요.' }, { status: 400 });
  }

  try {
    db.prepare(
      'UPDATE students SET grade = ?, class = ?, number = ?, name = ? WHERE id = ?'
    ).run(grade, klass, number, name, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: '중복된 학년/반/번호 입니다.' },
      { status: 409 }
    );
  }
}

// 학생 삭제
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });
  db.prepare('DELETE FROM students WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
