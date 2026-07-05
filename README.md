# 영어 쓰기 데이터 수집 플랫폼

중·고등학생 영어 쓰기 데이터를 수집하기 위한 Next.js 플랫폼입니다.
로컬(서버) SQLite 데이터베이스에 데이터가 저장되며, 관리자 페이지에서 학년별 CSV로
내려받을 수 있습니다.

## 구성

| 페이지 | 경로 | 설명 |
| --- | --- | --- |
| 로그인 | `/` | 학년·반·번호·이름 입력. 명단과 일치해야 진입 |
| 과제 1 | `/task1` | 좌우 5:5 분할 — 왼쪽 지문+사진, 오른쪽 입력창 |
| 과제 2 | `/task2` | 동일 구조의 두 번째 과제 |
| 관리자 | `/admin` | 이름에 `admin` 입력 시 이동 |

> 설문 페이지는 요청에 따라 만들지 않았습니다.

## 실행 방법

```bash
npm install
npm run build
npm run start      # 기본 http://localhost:3000
```

개발 모드: `npm run dev`

데이터베이스 파일은 `data/app.db` 에 자동 생성됩니다. (WAL 모드)

## 로그인

- 학년·반·번호·이름을 입력합니다. **관리자 페이지에서 등록한 명단과 일치**해야 로그인됩니다.
- **이름 칸에 `admin` 을 입력하면** 즉시 관리자 페이지로 이동합니다.

## 관리자 페이지 (`/admin`)

왼쪽 **사이드바**에 4개 메뉴가 있습니다.

### 1) 학생 명단 관리
- 컴팩트한 표로 명단을 확인 (학년 필터)
- 우측 상단 **"+ 학생 추가"** 버튼 → **모달**에서 학년·반·번호·이름 입력
- 각 행의 **수정**(모달) / **삭제**
- **CSV 업로드(대체)**: 업로드 시 기존 명단을 모두 삭제하고 새 파일로 **대체**합니다(병합 없음, 확인창 표시).
  - 헤더 `grade,class,number,name` (또는 한글 `학년,반,번호,이름`)
- **CSV 다운로드** (학년 필터 적용)
- 예시 파일: [`sample-students.csv`](sample-students.csv)

### 2) 과제 1 관리 / 3) 과제 2 관리
- 학생 화면에 표시될 **제목·지문·지시문**을 편집
- **사진 업로드**(PNG/JPG/GIF/WEBP/SVG) 또는 이미지 경로 직접 입력. 비우면 사진 미표시
- **저장** 시 즉시 학생 화면에 반영 (DB의 `tasks` 테이블에 저장)

### 4) 학생 데이터
- 학생별 과제 1·2 답안을 한눈에 확인 (학년 필터)
- **데이터 CSV 다운로드** — 학년별로 내려받기
  - 열: `grade, class, number, name, task1, task2, task1_updated, task2_updated`
  - Excel 한글 깨짐 방지를 위해 UTF-8 BOM 포함

## 과제 초기값

과제 내용은 DB(`tasks` 테이블)에 저장되며, **관리자 페이지 → 과제 관리**에서 편집합니다.
최초 실행 시 [`lib/tasks.ts`](lib/tasks.ts)의 기본값으로 시드됩니다(이후 관리자 수정이 우선).
업로드한 사진은 `public/uploads/` 에 저장됩니다.

## 데이터 구조 (SQLite)

- `students(id, grade, class, number, name)` — `(grade,class,number)` 유일
- `submissions(id, grade, class, number, name, task, content, created_at, updated_at)` — `(grade,class,number,task)` 유일

답안은 입력 중 자동 저장(1.2초 debounce)되며 **저장** 버튼으로 즉시 저장도 가능합니다.
