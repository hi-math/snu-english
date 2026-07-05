import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getUploadsDir } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};
const EXT_TO_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

// 과제 사진 업로드 → 데이터 볼륨(uploads)에 저장. (public/ 이 아니라 볼륨이라 재배포에도 유지)
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

  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'PNG, JPG, GIF, WEBP, SVG 형식만 업로드할 수 있습니다.' },
      { status: 400 }
    );
  }

  const dir = getUploadsDir();
  // 같은 과제의 기존 파일(확장자 무관) 제거 후 새로 저장
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(`task${id}.`)) {
      try {
        fs.unlinkSync(path.join(dir, f));
      } catch {
        // 무시
      }
    }
  }

  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, `task${id}${ext}`), buf);

  // 캐시 무효화를 위해 크기를 버전으로 부여. 이 URL 이 DB image 에 저장됨.
  const url = `/api/tasks/image?id=${id}&v=${buf.length}`;
  return NextResponse.json({ ok: true, url });
}

// 저장된 과제 사진을 서빙
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (id !== 1 && id !== 2) {
    return new NextResponse('bad request', { status: 400 });
  }

  const dir = getUploadsDir();
  let found = '';
  try {
    found = fs.readdirSync(dir).find((f) => f.startsWith(`task${id}.`)) ?? '';
  } catch {
    found = '';
  }
  if (!found) {
    return new NextResponse('not found', { status: 404 });
  }

  const ext = path.extname(found).toLowerCase();
  const mime = EXT_TO_MIME[ext] ?? 'application/octet-stream';
  const buf = fs.readFileSync(path.join(dir, found));

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=60',
    },
  });
}
