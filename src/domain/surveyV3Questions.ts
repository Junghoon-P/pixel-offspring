import type { TraitAxis } from "./personalityModel";
export const QUESTION_IDS_V3 = ["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q12","q13","q14","q15","q16","q17","q18","q19","q20","q21","q22","q23","q24"] as const;
export const ANSWER_OPTIONS = ["a", "b", "c", "d", "e"] as const;
export type AnswerOption = typeof ANSWER_OPTIONS[number];
export interface SurveyQuestion {
  id: typeof QUESTION_IDS_V3[number];
  text: string;
  a: string;
  b: string;
  axis: TraitAxis;
  aScore: number;
}
export const QUESTIONS_V3: SurveyQuestion[] = [
  {"id": "q1", "text": "산책 중 처음 보는 골목이 나왔다.", "a": "늘 가던 길로 이어 걷는다", "b": "어떤 곳인지 들어가 본다", "axis": "adventure", "aScore": -1},
  {"id": "q5", "text": "약속 없는 오후를 보내는 방법은?", "a": "이것저것 하며 움직인다", "b": "한곳에서 느긋하게 쉰다", "axis": "energy", "aScore": 1},
  {"id": "q9", "text": "친구와 여행을 준비한다.", "a": "동선을 정해두면 편하다", "b": "현장에서 고르면 편하다", "axis": "spontaneity", "aScore": -1},
  {"id": "q13", "text": "마음에 꼭 드는 선물을 받았다.", "a": "좋은 이유를 바로 이야기한다", "b": "오래 간직하며 마음을 표현한다", "axis": "expression", "aScore": 1},
  {"id": "q17", "text": "친구와 의견이 엇갈렸다.", "a": "바로 이야기를 나누며 정리한다", "b": "먼저 생각을 정리한 뒤 이야기한다", "axis": "conflict", "aScore": 1},
  {"id": "q21", "text": "친구가 힘든 하루 이야기를 꺼냈다.", "a": "도움이 될 방법을 함께 찾는다", "b": "어떤 기분이었는지 먼저 듣는다", "axis": "support", "aScore": 1},
  {"id": "q2", "text": "단골 식당에 새 메뉴가 생겼다.", "a": "새 메뉴를 주문한다", "b": "좋아하던 메뉴를 주문한다", "axis": "adventure", "aScore": 1},
  {"id": "q6", "text": "즐거운 외출을 마치고 집에 왔다.", "a": "바로 쉬는 시간이 필요하다", "b": "좋아하는 일을 더 하고 싶다", "axis": "energy", "aScore": -1},
  {"id": "q10", "text": "주말에 하고 싶은 일이 몇 가지 있다.", "a": "그날 끌리는 것부터 한다", "b": "미리 정한 순서대로 한다", "axis": "spontaneity", "aScore": 1},
  {"id": "q14", "text": "마음에 드는 사진을 찍었다.", "a": "혼자 몇 번 더 들여다본다", "b": "바로 누군가에게 보여준다", "axis": "expression", "aScore": -1},
  {"id": "q18", "text": "약속 때문에 서운한 마음이 생겼다.", "a": "감정이 가라앉은 뒤 꺼낸다", "b": "오래 남기기 전에 꺼낸다", "axis": "conflict", "aScore": -1},
  {"id": "q22", "text": "내가 속상한 일을 이야기할 때 바라는 것은?", "a": "내 마음을 먼저 알아주는 것", "b": "해결할 방법을 함께 찾는 것", "axis": "support", "aScore": -1},
  {"id": "q3", "text": "취미에 쓸 도구를 하나 고른다면?", "a": "손에 익은 도구", "b": "처음 써보는 도구", "axis": "adventure", "aScore": -1},
  {"id": "q7", "text": "축제에 도착했다.", "a": "여러 부스를 돌아본다", "b": "마음에 드는 곳에 오래 머문다", "axis": "energy", "aScore": 1},
  {"id": "q11", "text": "다음 주에 친구를 만나기로 했다.", "a": "시간·장소를 일찍 정하고 싶다", "b": "가까워지면 정하고 싶다", "axis": "spontaneity", "aScore": -1},
  {"id": "q15", "text": "친구에게 좋은 일이 생겼다.", "a": "신나게 반응하며 축하한다", "b": "조용히 메시지나 선물을 챙긴다", "axis": "expression", "aScore": 1},
  {"id": "q19", "text": "대화 중 서로의 의도가 어긋난 것 같다.", "a": "그 자리에서 뜻을 확인한다", "b": "혼자 돌아본 뒤 다시 묻는다", "axis": "conflict", "aScore": 1},
  {"id": "q23", "text": "친구가 도전에서 실패하고 찾아왔다.", "a": "다음에 시도할 방법을 같이 생각한다", "b": "지금의 아쉬움을 충분히 나눈다", "axis": "support", "aScore": 1},
  {"id": "q4", "text": "다시 여행할 기회가 생겼다.", "a": "안 가본 곳을 찾아본다", "b": "좋았던 곳을 다시 찾는다", "axis": "adventure", "aScore": 1},
  {"id": "q8", "text": "주말 하루에 자유시간이 생겼다.", "a": "한 가지를 느긋하게 즐긴다", "b": "여러 가지를 해보고 싶다", "axis": "energy", "aScore": -1},
  {"id": "q12", "text": "예상보다 자유시간이 많이 남았다.", "a": "그때 끌리는 일을 고른다", "b": "하고 싶었던 목록을 확인한다", "axis": "spontaneity", "aScore": 1},
  {"id": "q16", "text": "함께 본 영화가 무척 좋았다.", "a": "감상을 혼자 정리하고 싶다", "b": "바로 이야기를 나누고 싶다", "axis": "expression", "aScore": -1},
  {"id": "q20", "text": "함께 정해야 할 일에 의견 차이가 있다.", "a": "각자 생각할 시간을 갖는다", "b": "함께 이야기하며 답을 찾는다", "axis": "conflict", "aScore": -1},
  {"id": "q24", "text": "걱정이 많아 친구와 통화하고 싶다.", "a": "마음을 나누며 정리하고 싶다", "b": "선택지를 비교하며 정리하고 싶다", "axis": "support", "aScore": -1},
];
export const answerLabel = (question: SurveyQuestion, option: AnswerOption): string => ({
  a: `${question.a} · 매우 가까워요`, b: `${question.a} · 조금 가까워요`,
  c: "둘 다 비슷해요", d: `${question.b} · 조금 가까워요`, e: `${question.b} · 매우 가까워요`,
})[option];
