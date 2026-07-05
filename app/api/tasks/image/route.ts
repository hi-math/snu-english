import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// 과제 사진 업로드 → public/uploads 에 저장하고 경로 반환
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (id !== 1 && id !== 2) {
    return NextResponse.json({ error: '잘못된 과제 번호입니다.' }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  }

  const allowed: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  const ext = allowed[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'PNG, JPG, GIF, WEBP, SVG 형식만 업로드할 수 있습니다.' },
      { status: 400 }
    );
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  const filename = `task${id}${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), buf);

  // 캐시 무효화를 위해 쿼리스트링 버전 부여
  const version = buf.length;
  const url = `/uploads/${filename}?v=${version}`;
  return NextResponse.json({ ok: true, url });
}
