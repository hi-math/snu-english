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

  let filesInDataDir: string[] = [];
  try {
    filesInDataDir = fs.readdirSync(resolvedDataDir);
  } catch (e) {
    filesInDataDir = ['<readdir 실패: ' + (e as Error).message + '>'];
  }

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
    filesInDataDir,
    writable,
    writeErr,
    students,
    submissions,
    dbErr,
  });
}
