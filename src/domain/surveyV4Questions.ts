import type { TraitAxis } from "./personalityModel";
export const QUESTION_IDS_V4 = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"] as const;
export const ANSWER_OPTIONS = ["a", "b", "c", "d", "e"] as const;
export type AnswerOption = typeof ANSWER_OPTIONS[number];
export interface SurveyQuestion {
  id: typeof QUESTION_IDS_V4[number];
  text: string;
  a: string;
  b: string;
  axis: TraitAxis;
  aScore: number;
}
export const QUESTIONS_V4: SurveyQuestion[] = [
  { id: "q1", text: "함께 보내는 쉬는 날, 더 끌리는 쪽은?", a: "밖에서 이것저것 해보기", b: "편한 곳에서 느긋하게 쉬기", axis: "energy", aScore: 1 },
  { id: "q2", text: "같이 밥 먹을 곳을 고른다면?", a: "처음 보는 식당에 도전", b: "맛을 아는 단골집으로", axis: "adventure", aScore: 1 },
  { id: "q3", text: "다음 만남을 정할 때 나는?", a: "시간과 장소를 미리 정한다", b: "그날 끌리는 대로 정한다", axis: "spontaneity", aScore: -1 },
  { id: "q4", text: "상대가 고마운 일을 해줬다.", a: "좋았던 마음을 말로 바로 전한다", b: "조용히 챙겨주며 마음을 전한다", axis: "expression", aScore: 1 },
  { id: "q5", text: "한참 즐겁게 놀고 난 뒤 나는?", a: "이제 쉬면서 충전하고 싶다", b: "아직 더 같이 놀고 싶다", axis: "energy", aScore: -1 },
  { id: "q6", text: "둘이 새로운 취미를 고른다면?", a: "익숙하고 편한 것을 함께 한다", b: "둘 다 처음인 것을 해본다", axis: "adventure", aScore: -1 },
  { id: "q7", text: "약속까지 시간이 남았을 때 나는?", a: "눈에 띄는 곳에 즉흥적으로 들른다", b: "생각해둔 순서대로 움직인다", axis: "spontaneity", aScore: 1 },
  { id: "q8", text: "함께 본 영화가 정말 좋았다.", a: "감상을 혼자 곱씹으며 간직한다", b: "좋았던 장면을 바로 이야기한다", axis: "expression", aScore: -1 },
  { id: "q9", text: "상대에게 서운한 마음이 들면?", a: "바로 이야기하며 풀고 싶다", b: "생각을 정리한 뒤 이야기하고 싶다", axis: "conflict", aScore: 1 },
  { id: "q10", text: "상대가 힘든 일을 털어놓으면?", a: "도움이 될 방법부터 함께 찾는다", b: "어떤 마음인지 먼저 들어준다", axis: "support", aScore: 1 },
];
export const answerLabel = (question: SurveyQuestion, option: AnswerOption): string => ({
  a: `${question.a} · 매우 가까워요`, b: `${question.a} · 조금 가까워요`,
  c: "둘 다 비슷해요", d: `${question.b} · 조금 가까워요`, e: `${question.b} · 매우 가까워요`,
})[option];
