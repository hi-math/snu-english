// 설문 문항 정의 (UI · 관리자 · CSV export 공통 사용)

export interface ChoiceQuestion {
  key: 'q2' | 'q3' | 'q4';
  type: 'choice';
  label: string;
  options: string[]; // 저장값은 1부터 시작하는 인덱스
}
export interface NumberQuestion {
  key: 'q1';
  type: 'number';
  label: string;
  suffix?: string;
}
export interface TextQuestion {
  key: 'q5';
  type: 'text';
  label: string;
}

export const SURVEY_QUESTIONS: (ChoiceQuestion | NumberQuestion | TextQuestion)[] = [
  {
    key: 'q1',
    type: 'number',
    label: '영어권 국가 거주 기간은? (없으면 0)',
    suffix: '개월',
  },
  {
    key: 'q2',
    type: 'choice',
    label: '영어를 학습한 기간은 얼마나 되나요?',
    options: ['5년 미만', '5-6년', '7-8년', '9년 이상'],
  },
  {
    key: 'q3',
    type: 'choice',
    label: '평소 학교 수업 외에 영어 공부를 하는 시간은?',
    options: ['전혀 하지 않음', '주 1-2시간', '주 3-4시간', '주 5시간 이상'],
  },
  {
    key: 'q4',
    type: 'choice',
    label: '과거에 40단어 이상의 글을 영어로 써 본 적이 있나요?',
    options: ['없다', '한 두 번 써본 적이 있다', '여러 번 써 본 적이 있다', '일상적으로 자주 쓴다'],
  },
  {
    key: 'q5',
    type: 'text',
    label: '오늘 글쓰기에서 가장 어렵거나 막혔던 부분은 무엇인가요? 간단히 적어주세요.',
  },
];
