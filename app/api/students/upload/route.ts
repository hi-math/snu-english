import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseCsv } from '@/lib/csv';

// CSV 업로드로 학생 명단을 대체(교체)합니다. 기존 명단을 모두 삭제 후 등록합니다.
// 헤더: grade,class,number,name (한글 헤더 학년,반,번호,이름 도 허용)
export async function POST(req: NextRequest) {
  const text = await req.text();
  if (!text.trim()) {
    return NextResponse.json({ error: '빈 파일입니다.' }, { status: 400 });
  }

  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
  if (rows.length === 0) {
    return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 });
  }

  // 헤더 매핑
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const map: Record<string, number> = {};
  header.forEach((h, i) => {
    if (h === 'grade' || h === '학년') map.grade = i;
    else if (h === 'class' || h === '반') map.class = i;
    else if (h === 'number' || h === 'no' || h === '번호') map.number = i;
    else if (h === 'name' || h === '이름') map.name = i;
  });

  const hasHeader =
    map.grade !== undefined &&
    map.class !== undefined &&
    map.number !== undefined &&
    map.name !== undefined;

  // 헤더가 없으면 열 순서를 grade,class,number,name 으로 가정
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const idx = hasHeader
    ? map
    : { grade: 0, class: 1, number: 2, name: 3 };

  const upsert = db.prepare(
    `INSERT INTO students (grade, class, number, name) VALUES (@grade, @class, @number, @name)
     ON CONFLICT (grade, class, number) DO UPDATE SET name = @name`
  );

  let count = 0;
  const tx = db.transaction(() => {
    // 대체 모드: 기존 명단 전체 삭제 후 등록
    db.prepare('DELETE FROM students').run();
    for (const r of dataRows) {
      const grade = (r[idx.grade] ?? '').trim();
      const klass = (r[idx.class] ?? '').trim();
      const number = (r[idx.number] ?? '').trim();
      const name = (r[idx.name] ?? '').trim();
      if (!grade || !klass || !number || !name) continue;
      upsert.run({ grade, class: klass, number, name });
      count++;
    }
  });
  tx();

  return NextResponse.json({ ok: true, count });
}
