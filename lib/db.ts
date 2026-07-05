import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { TASKS } from './tasks';

// 로컬 데이터베이스 파일 위치 (data/app.db)
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');

// Next.js dev 모드에서 hot-reload 시 커넥션이 중복 생성되는 것을 방지
const globalForDb = globalThis as unknown as { __db?: Database.Database };

function createDb(): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade TEXT NOT NULL,
      class TEXT NOT NULL,
      number TEXT NOT NULL,
      name TEXT NOT NULL,
      UNIQUE (grade, class, number)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade TEXT NOT NULL,
      class TEXT NOT NULL,
      number TEXT NOT NULL,
      name TEXT NOT NULL,
      task INTEGER NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (grade, class, number, task)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      passage TEXT NOT NULL DEFAULT '',
      instruction TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT ''
    );
  `);

  // 스키마 마이그레이션
  const cols = db.prepare('PRAGMA table_info(tasks)').all() as { name: string }[];
  const hasInstruction = cols.some((c) => c.name === 'instruction');
  const hasPrompt = cols.some((c) => c.name === 'prompt'); // 구버전 스키마 표시

  if (!hasInstruction) {
    db.exec("ALTER TABLE tasks ADD COLUMN instruction TEXT NOT NULL DEFAULT ''");
  }

  // 과제 기본값 시드 (행이 없을 때만)
  const seed = db.prepare(
    'INSERT OR IGNORE INTO tasks (id, title, passage, instruction, image) VALUES (?, ?, ?, ?, ?)'
  );
  for (const t of Object.values(TASKS)) {
    seed.run(t.id, t.title, t.passage, t.instruction, t.image);
  }

  // 구버전(prompt 컬럼 존재) DB를 새 레이아웃 기본값으로 1회 정규화.
  // 관리자가 업로드한 사진(image)은 그대로 보존.
  if (hasPrompt) {
    const norm = db.prepare(
      "UPDATE tasks SET title = ?, passage = ?, instruction = ?, image = CASE WHEN image IS NULL OR image = '' THEN ? ELSE image END WHERE id = ?"
    );
    for (const t of Object.values(TASKS)) {
      norm.run(t.title, t.passage, t.instruction, t.image, t.id);
    }
    try {
      db.exec('ALTER TABLE tasks DROP COLUMN prompt');
    } catch {
      // DROP COLUMN 미지원 환경에서는 미사용 컬럼으로 남겨둠 (동작에 영향 없음)
    }
  }

  return db;
}

export const db = globalForDb.__db ?? createDb();
if (process.env.NODE_ENV !== 'production') globalForDb.__db = db;

export interface Student {
  id: number;
  grade: string;
  class: string;
  number: string;
  name: string;
}

export interface Submission {
  id: number;
  grade: string;
  class: string;
  number: string;
  name: string;
  task: number;
  content: string;
  created_at: string;
  updated_at: string;
}
