// 과제(제목 + 지문 + 지시 글상자 + 사진) 내용 정의.
// 내용을 바꾸려면 이 파일을 수정하거나, 관리자 페이지 > 과제 관리 에서 편집하세요.
// (관리자 페이지에서 수정하면 DB 값이 우선하며, 이 파일은 최초 시드용 기본값입니다.)
// image 는 public/ 폴더 기준 경로입니다. (예: /images/task1.svg)

export interface TaskContent {
  id: number;
  title: string;
  passage: string; // 상단 지문 (비우면 미표시)
  instruction: string; // 지문 아래 지시 글상자 (비우면 미표시)
  image: string; // public 경로. 비워두면 이미지 미표시.
}

const TASK1_TITLE = '아래 주제에 대한 글을 영어로 작성하세요. (최소 40단어)';
const TASK1_PASSAGE = `What do you like to do after school or on weekends? Write about your favorite activity.
(여러분은 자유 시간에 무엇을 하는 것을 좋아하나요? 운동, 휴식, 다양한 취미 활동 등 무엇이라도 좋습니다. 다음의 사항을 포함하여 그 활동에 관한 글을 써보세요.)`;
const TASK1_INSTRUCTION = `〈반드시 포함할 내용〉
1. 여러분이 자유 시간에 가장 좋아하는 활동은 **무엇**인가요?
2. **왜** 그 활동을 좋아하나요?
3. 그 활동은 보통 **언제, 얼마나 자주** 하나요?
4. 그 활동을 할 때 **구체적으로 무엇을** 하나요?
5. 주로 **혼자**하는 활동인가요, **누군가와 함께** 하는 활동인가요?`;

const TASK2_TITLE = '아래 주제에 대한 글을 영어로 작성하세요. (최소 40단어)';
const TASK2_PASSAGE = `Think about something you tried for the first time. Then write about that experience.
(어떤 일을 처음으로 시도해 보았던 적을 생각해 보세요. 자전거 타기, 요리하기, 캠핑 가기, 새로운 운동 배우기, 새로운 사람과 이야기한 경험, 노력했지만 쉽지 않았거나 결국 잘 되지 않았던 경험… 무엇이라도 좋습니다. 그 중 가장 기억에 특별하게 남는 경험은 무엇인가요? 다음의 사항을 포함하여 그 경험에 대한 글을 써보세요.)`;
const TASK2_INSTRUCTION = `〈반드시 포함할 내용〉
1. 처음 시도해 보았던 그 일은 **무엇**인가요?
2. 그 날은 **언제**였나요?
3. 그 날 **어디**에 있었나요?
4. 그 일을 시도했을 때 **기억에 남았던 점**은 무엇인가요?
5. 그 때 느꼈던 **특별한 기분**이 있나요?`;

export const TASKS: Record<number, TaskContent> = {
  1: {
    id: 1,
    title: TASK1_TITLE,
    passage: TASK1_PASSAGE,
    instruction: TASK1_INSTRUCTION,
    image: '/images/task1.svg',
  },
  2: {
    id: 2,
    title: TASK2_TITLE,
    passage: TASK2_PASSAGE,
    instruction: TASK2_INSTRUCTION,
    image: '/images/task2.svg',
  },
};
