import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 배포 진단용: 앱이 실제로 DB를 어디에 쓰고 있는지, 쓰기 가능한지, 데이터가 몇 건인지 확인.
// 브라우저에서 /api/debug 로 열어 결과를 확인하세요.
export async function GET() {
  const resolvedDataDir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(process.cwd(), 'data');
  const dbPath = path.join(resolvedDataDir, 'app.db');

  // 폴더 내 파일들의 크기(바이트)를 재귀적으로 수집
  function listWithSizes(dir: string, prefix = ''): { file: string; bytes: number }[] {
    const out: { file: string; bytes: number }[] = [];
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return [{ file: prefix + '<readdir 실패: ' + (e as Error).message + '>', bytes: 0 }];
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        out.push(...listWithSizes(full, prefix + ent.name + '/'));
      } else {
        let bytes = 0;
        try {
          bytes = fs.statSync(full).size;
        } catch {
          bytes = -1;
        }
        out.push({ file: prefix + ent.name, bytes });
      }
    }
    return out;
  }

  const fileSizes = listWithSizes(resolvedDataDir);
  const totalBytes = fileSizes.reduce((sum, f) => sum + Math.max(0, f.bytes), 0);
  const filesInDataDir = fileSizes.map((f) => `${f.file} — ${(f.bytes / 1024).toFixed(1)} KB`);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  let dbExists = false;
  let dbSizeBytes = 0;
  let dbMtime = '';
  try {
    const st = fs.statSync(dbPath);
    dbExists = true;
    dbSizeBytes = st.size;
    dbMtime = st.mtime.toISOString();
  } catch {
    // 파일 없음
  }

  // 쓰기 가능 여부 테스트
  let writable = false;
  let writeErr = '';
  try {
    const testFile = path.join(resolvedDataDir, '.writetest');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    writable = true;
  } catch (e) {
    writeErr = (e as Error).message;
  }

  // 실제 데이터 건수
  let students = -1;
  let submissions = -1;
  let dbErr = '';
  try {
    students = (db.prepare('SELECT COUNT(*) AS c FROM students').get() as { c: number }).c;
    submissions = (db.prepare('SELECT COUNT(*) AS c FROM submissions').get() as { c: number }).c;
  } catch (e) {
    dbErr = (e as Error).message;
  }

  return NextResponse.json({
    env_DATA_DIR: process.env.DATA_DIR ?? null,
    cwd: process.cwd(),
    resolvedDataDir,
    dbPath,
    dbExists,
    dbSizeBytes,
    dbMtime,
    totalDataDirMB: totalMB,
    filesInDataDir,
    writable,
    writeErr,
    students,
    submissions,
    dbErr,
  });
}
